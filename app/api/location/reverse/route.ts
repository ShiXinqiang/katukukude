import { NextResponse } from "next/server";

const regionAliases: Record<string, string> = {
  "Yangon Region": "仰光省 Yangon",
  "Yangon": "仰光 Yangon",
  "Mandalay Region": "曼德勒省 Mandalay",
  "Mandalay": "曼德勒 Mandalay",
  "Naypyidaw Union Territory": "内比都 Naypyidaw",
  "Naypyidaw": "内比都 Naypyidaw",
  "Shan State": "掸邦 Shan",
  "Kachin State": "克钦邦 Kachin",
  "Rakhine State": "若开邦 Rakhine",
  "Mon State": "孟邦 Mon",
  "Bago Region": "勃固省 Bago",
  "Magway Region": "马圭省 Magway",
  "Sagaing Region": "实皆省 Sagaing",
  "Tanintharyi Region": "德林达依省 Tanintharyi"
};

function readable(value: unknown) {
  if (typeof value !== "string") return "";
  return regionAliases[value] || value;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "invalid_coordinates" }, { status: 400 });
  }

  try {
    const endpoint = new URL("https://nominatim.openstreetmap.org/reverse");
    endpoint.searchParams.set("format", "jsonv2");
    endpoint.searchParams.set("addressdetails", "1");
    endpoint.searchParams.set("zoom", "18");
    endpoint.searchParams.set("lat", String(lat));
    endpoint.searchParams.set("lon", String(lon));
    endpoint.searchParams.set("accept-language", "zh-CN,en");

    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: { "User-Agent": "Katu local-life app location lookup" }
    });
    if (!response.ok) return NextResponse.json({ error: "geocoder_unavailable" }, { status: 502 });

    const data = await response.json() as { display_name?: string; address?: Record<string, string> };
    const address = data.address || {};
    const state = readable(address.state || address.region || address.province);
    const city = readable(address.city || address.town || address.municipality || address.county);
    const township = readable(address.township || address.city_district || address.suburb || address.village || address.neighbourhood);
    const street = [address.road, address.house_number].filter(Boolean).join(" ");
    const parts = Array.from(new Set([state, city, township, street].filter(Boolean)));
    const label = parts.join(" · ") || data.display_name || ("当前位置 · " + lat.toFixed(3) + ", " + lon.toFixed(3));

    return NextResponse.json({
      label,
      detail: label,
      state,
      city,
      township,
      latitude: lat,
      longitude: lon
    });
  } catch {
    return NextResponse.json({ error: "geocoder_failed" }, { status: 502 });
  }
}
