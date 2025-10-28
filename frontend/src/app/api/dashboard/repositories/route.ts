import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL =
  process.env.FASTAPI_BASE_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user, session: sessionData } = session;

  try {
    const sessionToken = sessionData.token;
    const url = new URL(req.url);
    const searchParams = url.searchParams.toString();
    
    const backendUrl = `${FASTAPI_BASE_URL}/api/v1/dashboard/repositories${searchParams ? `?${searchParams}` : ''}`;

    const response = await fetch(backendUrl, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": user.id,
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", response.status, errorText);
      return NextResponse.json(
        { error: `Failed to fetch repositories: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}