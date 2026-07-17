import { NextResponse } from "next/server";

export async function GET(_request, { params }) {
  const { indexnowKey } = await params;
  const key = process.env.INDEXNOW_KEY;

  if (!key || indexnowKey !== key) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(key, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
