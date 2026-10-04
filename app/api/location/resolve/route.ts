import { NextResponse } from "next/server";

import {parseCoordinates,isAllowedMapsHost} from "../../../../lib/map-coordinates";

async function resolveRedirects(input: URL) {
  let current = input;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
      headers: { "User-Agent": "Katu location link resolver" },
    });

    if (response.status < 300 || response.status >= 400) {
      return current;
    }

    const location = response.headers.get("location");
    if (!location) return current;

    const next = new URL(location, current);
    if (next.protocol !== "https:" || next.port || next.username || next.password || !isAllowedMapsHost(next.hostname)) {
      throw new Error("地图链接跳转到了不受支持的地址");
    }
    current = next;
  }

  return current;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("url")?.trim() || "";

  if (!raw) {
    return NextResponse.json(
      { message: "请先粘贴 Google 地图分享链接" },
      { status: 400 },
    );
  }

  let input: URL;
  try {
    input = new URL(raw);
  } catch {
    return NextResponse.json(
      { message: "链接格式不正确，请粘贴完整的 Google 地图链接" },
      { status: 400 },
    );
  }

  if (
    input.protocol !== "https:" || input.port || input.username || input.password ||
    !isAllowedMapsHost(input.hostname)
  ) {
    return NextResponse.json(
      { message: "只支持 Google Maps 或 maps.app.goo.gl 链接" },
      { status: 400 },
    );
  }

  try {
    const direct = parseCoordinates(input.toString());
    const resolvedUrl = direct ? input : await resolveRedirects(input);
    const coordinates =
      parseCoordinates(resolvedUrl.toString()) || parseCoordinates(raw);

    if (!coordinates) {
      return NextResponse.json(
        {
          message:
            "链接中没有可识别的地图坐标，请在 Google 地图中选择具体位置后重新复制分享链接",
        },
        { status: 422 },
      );
    }

    const mapLink =
      "https://www.google.com/maps/search/?api=1&query=" +
      coordinates.latitude +
      "," +
      coordinates.longitude;

    return NextResponse.json({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      mapLink,
      resolvedUrl: resolvedUrl.toString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "地图链接读取失败，请重新复制后粘贴",
      },
      { status: 502 },
    );
  }
}
