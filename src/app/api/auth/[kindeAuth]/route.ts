import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, props: any) {
  try {
    const handler = handleAuth();
    return await handler(request, props);
  } catch (error: any) {
    console.error("Kinde Auth error:", error?.message);
    return NextResponse.json({ error: error?.message || "Auth error" }, { status: 500 });
  }
}