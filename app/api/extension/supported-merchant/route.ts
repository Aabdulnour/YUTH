import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    merchants: [
      { id: "amazon", hosts: ["amazon.ca", "www.amazon.ca"] },
      { id: "bestbuy", hosts: ["bestbuy.ca", "www.bestbuy.ca"] },
      { id: "sephora", hosts: ["sephora.ca", "www.sephora.ca", "sephora.com", "www.sephora.com"] }
    ]
  });
}