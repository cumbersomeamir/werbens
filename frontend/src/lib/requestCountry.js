import { headers } from "next/headers";

const COUNTRY_HEADERS = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "cloudfront-viewer-country",
  "x-country-code",
];

export async function getRequestCountry() {
  const requestHeaders = await headers();

  for (const headerName of COUNTRY_HEADERS) {
    const value = requestHeaders.get(headerName);
    if (value) return value;
  }

  return "";
}
