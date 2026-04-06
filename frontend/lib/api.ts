export function getApiBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
  }

  return "";
}
