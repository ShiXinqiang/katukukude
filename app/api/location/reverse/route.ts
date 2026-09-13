import { NextResponse } from "next/server";

type AddressMap = Record<string, string>;

const regionAliases: Record<string, string> = {
  "yangon region": "仰光省",
  "yangon": "仰光省",
  "mandalay region": "曼德勒省",
  "mandalay": "曼德勒省",
  "naypyidaw union territory": "内比都",
  "naypyidaw": "内比都",
  "shan state": "掸邦",
  "shan": "掸邦",
  "shan (north) state": "掸邦",
  "shan (south) state": "掸邦",
  "kachin state": "克钦邦",
  "rakhine state": "若开邦",
  "mon state": "孟邦",
  "bago region": "勃固省",
  "magway region": "马圭省",
  "sagaing region": "实皆省",
  "tanintharyi region": "德林达依省"
};

const townshipAliases: Record<string, string> = {
  "laukkaing township": "老街镇区",
  "laukkai township": "老街镇区",
  "laukkaing myone": "老街镇区",
  "mong nai township": "孟乃镇区",
  "mongnai township": "孟乃镇区",
  "မိုးနဲမြို့နယ်": "孟乃镇区"
};

const placeAliases: Record<string, string> = {
  "laukkai": "老街市",
  "laukkaing": "老街市",
  "laukkai city": "老街市",
  "laokai": "老街市",
  "laogai": "老街市",
  "လောက်ကိုင်": "老街市",
  "老街": "老街市",
  "taunggyi": "东枝市",
  "taunggyi city": "东枝市",
  "yangon": "仰光市",
  "mandalay": "曼德勒市",
  "mong nai": "孟乃市",
  "mongnai": "孟乃市"
};

const autonomousAliases: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /kokang|laukkaing|laukkai|laokai|laogai|konkyan|လောက်ကိုင်|ကိုးကန့်|果敢|老街/i, label: "果敢自治区" },
  { pattern: /danu self-administered|danu sa[z]?|ဓနု|达努/i, label: "达努自治区" },
  { pattern: /pa-?o self-administered|pa-?o sa[z]?|ပအိုဝ်း|巴奥/i, label: "巴奥自治区" },
  { pattern: /palaung self-administered|ta'?ang self-administered|德昂|德昂自治区/i, label: "德昂自治区" },
  { pattern: /naga self-administered|那加自治区/i, label: "那加自治区" }
];

function clean(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normalize(value: unknown) {
  return clean(value).toLowerCase();
}

function alias(value: unknown, aliases: Record<string, string>) {
  const normalized = normalize(value);
  return normalized ? aliases[normalized] || clean(value) : "";
}

function readable(value: unknown) {
  return alias(value, regionAliases);
}

function findAlias(value: unknown, aliases: Record<string, string>) {
  const normalized = normalize(value);
  if (!normalized) return "";
  if (aliases[normalized]) return aliases[normalized];

  for (const [key, label] of Object.entries(aliases)) {
    if (normalized.includes(key)) return label;
  }
  return clean(value);
}

function detectAutonomous(address: AddressMap) {
  const source = Object.entries(address)
    .map(([key, value]) => key + " " + value)
    .join(" ");
  return autonomousAliases.find(item => item.pattern.test(source))?.label || "";
}

function formatTownship(value: unknown) {
  const raw = clean(value);
  if (!raw) return "";
  const mapped = findAlias(raw, townshipAliases);
  if (mapped !== raw) return mapped;

  const base = raw
    .replace(/\s+(township|myone)$/i, "")
    .replace(/မြို့နယ်/g, "")
    .trim();

  if (!base) return "";
  if (/[镇区]$/.test(base)) return base;
  return base + "镇区";
}

function formatCity(value: unknown) {
  const raw = clean(value);
  if (!raw) return "";
  const mapped = findAlias(raw, placeAliases);
  if (mapped !== raw) return mapped;

  const base = raw
    .replace(/\s+(city|town|municipality)$/i, "")
    .trim();

  if (!base) return "";
  if (/[市县区]$/.test(base)) return base;
  return base;
}

function uniqueParts(parts: string[]) {
  return Array.from(new Set(parts.map(clean).filter(Boolean)));
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

    const data = await response.json() as { display_name?: string; address?: AddressMap };
    const address = data.address || {};

    let state = readable(address.state || address.region || address.province);
    const autonomous = detectAutonomous(address);
    if (!state && autonomous === "果敢自治区") state = "掸邦";

    const townshipRaw =
      address.township ||
      (address.county && /(township|myone|မြို့နယ်)/i.test(address.county) ? address.county : "");
    const township = formatTownship(townshipRaw);
    const city = formatCity(address.city || address.town || address.municipality);
    const district = readable(address.state_district || address.district);
    const village = clean(address.village || address.hamlet || address.suburb || address.neighbourhood);
    const suburb = clean(address.suburb);
    const neighbourhood = clean(address.neighbourhood);
    const quarter = clean(address.quarter);
    const hamlet = clean(address.hamlet);
    const road = clean(address.road);
    const houseNumber = clean(address.house_number);
    const postcode = clean(address.postcode);

    const detailedParts = uniqueParts([
      state,
      autonomous,
      district,
      township,
      city,
      village,
      suburb,
      neighbourhood,
      quarter,
      hamlet,
      road,
      houseNumber,
      postcode
    ]);

    const label =
      detailedParts.join(" · ") ||
      data.display_name ||
      ("当前位置 · " + lat.toFixed(3) + ", " + lon.toFixed(3));

    return NextResponse.json({
      label,
      detail: label,
      state,
      autonomous,
      district,
      township,
      city,
      village,
      street,
      latitude: lat,
      longitude: lon
    });
  } catch {
    return NextResponse.json({ error: "geocoder_failed" }, { status: 502 });
  }
}
