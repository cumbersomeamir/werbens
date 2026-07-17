import { NextResponse } from "next/server";
import { siteUrl } from "../../seoPages";

export async function POST(request) {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    return NextResponse.json({ error: "INDEXNOW_KEY is not configured" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const urls = Array.isArray(body.urls) ? body.urls : [body.url].filter(Boolean);
  const urlList = urls.filter((url) => typeof url === "string" && url.startsWith(siteUrl));

  if (!urlList.length) {
    return NextResponse.json({ error: "No valid Werbens URLs provided" }, { status: 400 });
  }

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(siteUrl).host,
      key,
      keyLocation: `${siteUrl}/${key}.txt`,
      urlList,
    }),
  });

  return NextResponse.json({ ok: response.ok, status: response.status });
}
