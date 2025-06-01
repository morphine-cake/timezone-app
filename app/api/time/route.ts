import { DateTime } from "luxon";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get("timezone");

    if (!timezone) {
      return NextResponse.json(
        { error: "Timezone parameter is required" },
        { status: 400 }
      );
    }

    const now = DateTime.now().setZone(timezone);

    if (!now.isValid) {
      return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
    }

    return NextResponse.json({
      timezone,
      currentTime: now.toFormat("HH:mm:ss"),
      timestamp: now.toMillis(),
      offsetHours: Math.floor(now.offset / 60),
      offsetMinutes: now.offset,
    });
  } catch (error) {
    console.error("Error getting time:", error);
    return NextResponse.json({ error: "Failed to get time" }, { status: 500 });
  }
}
