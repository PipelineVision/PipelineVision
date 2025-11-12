import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const FASTAPI_BASE_URL =
  process.env.FASTAPI_BASE_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user, session: sessionData } = session;
    if (!user?.id) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const sessionToken = sessionData.token;
    const userId = user.id;

    const backendResponse = await fetch(`${FASTAPI_BASE_URL}/api/v1/events`, {
      method: "GET",
      headers: {
        "X-User-ID": userId.toString(),
        Authorization: `Bearer ${sessionToken}`,
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });

    if (!backendResponse.ok) {
      console.error(
        "Backend SSE request failed:",
        backendResponse.status,
        backendResponse.statusText
      );
      return NextResponse.json(
        { error: "Failed to connect to events stream" },
        { status: backendResponse.status }
      );
    }

    // TODO: Look into potential caddy buffering issue? Might be a redis issue also not keeping up with the requests
    // Potential issue with caddy buffering
    return new NextResponse(backendResponse.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("SSE API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
