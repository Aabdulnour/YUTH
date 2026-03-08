import { NextResponse } from "next/server";
import demoProfile from "@/lib/data/spendingProfile.json";

function withCors(response: NextResponse): NextResponse {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET() {
  return withCors(
    NextResponse.json({
      ok: true,
      profile: demoProfile,
      metadata: {
        profileSource: "demo_profile",
        mode: "preview",
        note: "Preview mode demo profile for the YUTH extension.",
      },
    })
  );
}
