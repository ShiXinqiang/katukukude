
export type SavedAddress = {
  id: string;
  label: string;
  contact: string;
  phone: string;
  detail: string;
  googleMapsUrl: string;
  latitude?: string;
  longitude?: string;
  isHome: boolean;
};

const ADDRESS_KEY = "katu.saved-addresses";
const REGION_KEY = "katu.region";

export function readAddresses(): SavedAddress[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(ADDRESS_KEY) || "[]") as SavedAddress[]; }
  catch { return []; }
}
export function saveAddresses(value: SavedAddress[]) {
  localStorage.setItem(ADDRESS_KEY, JSON.stringify(value));
}
export function readRegion() {
  if (typeof window === "undefined") return "仰光 Yangon";
  return localStorage.getItem(REGION_KEY) || "仰光 Yangon";
}
export function saveRegion(value: string) {
  localStorage.setItem(REGION_KEY, value);
}
export function isGoogleMapsLink(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return /(^|\.)google\.(com|com\.mm)$/.test(hostname) ||
      /(^|\.)maps\.google\./.test(hostname) ||
      hostname === "goo.gl" ||
      hostname.endsWith(".goo.gl");
  } catch { return false; }
}
