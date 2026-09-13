import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SearchResult = {
  lat?: string;
  lon?: string;
  display_name?: string;
};

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() || "";
  if (query.length < 3) {
    return NextResponse.json({ message: "请填写更详细的地址" }, { status: 400 });
  }
  try {
    const endpoint = new URL("https://nominatim.openstreetmap.org/search");
    endpoint.searchParams.set("format", "jsonv2");
    endpoint.searchParams.set("addressdetails", "1");
    endpoint.searchParams.set("limit", "1");
    endpoint.searchParams.set("countrycodes", "mm");
    endpoint.searchParams.set("accept-language", "zh-CN,my,en");
    endpoint.searchParams.set("q", query);
    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: { "User-Agent": "Katu merchant address lookup" },
    });
    if (!response.ok) {
      return NextResponse.json({ message: "地址识别服务暂时不可用" }, { status: 502 });
    }
    const rows = await response.json() as SearchResult[];
    const item = rows[0];
    const latitude = Number(item?.lat);
    const longitude = Number(item?.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json({ message: "没有识别到该地址，请补充省邦、城市、镇区或附近地标" }, { status: 404 });
    }
    return NextResponse.json({
      latitude,
      longitude,
      displayName: item.display_name || query,
      mapLink: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });
  } catch {
    return NextResponse.json({ message: "地址识别失败，请稍后重试" }, { status: 502 });
  }
}
