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

    const response = await fetch(
      `${FASTAPI_BASE_URL}/api/v1/accounts/memberships`,
      {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id,
          Authorization: `Bearer ${sessionToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", response.status, errorText);
      return NextResponse.json(
        { error: `Failed to fetch jobs: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch job data" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user, session: sessionData } = session;

  try {
    const sessionToken = sessionData.token;

    const body = await req.json();

    const { membership_id } = body;

    const response = await fetch(
      `${FASTAPI_BASE_URL}/api/v1/accounts/memberships`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id,
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ membership_id }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", response.status, errorText);
      return NextResponse.json(
        { error: `Failed to fetch memberships: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch membership" },
      { status: 500 }
    );
  }
}
