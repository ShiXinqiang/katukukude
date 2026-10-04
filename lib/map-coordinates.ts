const numberPattern = "-?\\d{1,3}(?:\\.\\d+)?";

export function isAllowedMapsHost(hostname: string) {
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

export function parseCoordinates(value: string) {
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }
  decoded = decoded.replace(/\+/g, " ");

  const patterns = [
    new RegExp("[?&](?:query|q|ll|destination)=\\s*(" + numberPattern + ")\\s*[, ]\\s*(" + numberPattern + ")", "i"),
    new RegExp("!3d(" + numberPattern + ")!4d(" + numberPattern + ")", "i"),
    new RegExp("@\\s*(" + numberPattern + ")\\s*,\\s*(" + numberPattern + ")", "i"),
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

