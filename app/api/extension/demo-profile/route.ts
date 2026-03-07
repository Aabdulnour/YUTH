import { NextResponse } from "next/server";
import demoProfile from "@/lib/data/spendingProfile.json";

export async function GET() {
  return NextResponse.json({
    ok: true,
    profile: demoProfile
  });
}