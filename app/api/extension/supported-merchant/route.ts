import { NextResponse } from "next/server";
import { SUPPORTED_EXTENSION_MERCHANTS } from "@/lib/extension/supportedMerchants";

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
      mode: "preview",
      merchants: SUPPORTED_EXTENSION_MERCHANTS,
    })
  );
}
