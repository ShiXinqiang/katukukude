import { NextResponse } from "next/server";

const numberPattern = "-?\\d{1,3}(?:\\.\\d+)?";

function isAllowedMapsHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return (
    host === "goo.gl" ||
    host.endsWith(".goo.gl") ||
    host === "google.com" ||
    host.endsWith(".google.com") ||
    host === "google.com.mm" ||
    host.endsWith(".google.com.mm") ||
    host === "google.cn" ||
    host.endsWith(".google.cn")
  );
}

function parseCoordinates(value: string) {
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }
  decoded = decoded.replace(/\+/g, " ");

  const patterns = [
    new RegExp("[?&](?:query|q|ll|destination)=\\s*(" + numberPattern + ")\\s*[, ]\\s*(" + numberPattern + ")", "i"),
    new RegExp("@\\s*(" + numberPattern + ")\\s*,\\s*(" + numberPattern + ")", "i"),
    new RegExp("!3d(" + numberPattern + ")!4d(" + numberPattern + ")", "i"),
    new RegExp("(?:^|[/=])(" + numberPattern + ")\\s*,\\s*(" + numberPattern + ")(?=$|[/,?&#])", "i"),
  ];

  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (!match) continue;
    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    ) {
      return { latitude, longitude };
    }
  }

  return null;
}

async function resolveRedirects(input: URL) {
  let current = input;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      cache: "no-store",
      headers: { "User-Agent": "Katu location link resolver" },
    });

    if (response.status < 300 || response.status >= 400) {
      return current;
    }

    const location = response.headers.get("location");
    if (!location) return current;

    const next = new URL(location, current);
    if (!isAllowedMapsHost(next.hostname)) {
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
    !["http:", "https:"].includes(input.protocol) ||
    !isAllowedMapsHost(input.hostname)
  ) {
    return NextResponse.json(
      { message: "只支持 Google Maps 或 maps.app.goo.gl 链接" },
      { status: 400 },
    );
  }

  try {
    const resolvedUrl = await resolveRedirects(input);
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
