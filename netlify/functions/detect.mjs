// Netlify Functions v2 handler: accepts a Web Request and returns a Web Response.
// Credentials remain server-side; rotate the Sightengine secret because it was exposed in a screenshot.
export const config = { timeout: 26 };
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const json = (status, data) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

export default async function handler(request) {
  if (request.method !== "POST") return json(405, { status: "failure", error: "Use POST to analyze a file." });
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  if (!["image", "video"].includes(kind)) return json(400, { status: "failure", error: "Unknown media type." });

  // Credentials are intentionally only in this server-side function, never in public browser code.
  const apiUser = process.env.SIGHTENGINE_API_USER;
  const apiSecret = process.env.SIGHTENGINE_API_SECRET;
  if (!apiUser || !apiSecret) return json(503, { status: "failure", error: "Sightengine credentials are missing from the server function." });

  let incoming;
  try { incoming = await request.formData(); }
  catch { return json(400, { status: "failure", error: "Upload one media file using the media field." }); }
  const file = incoming.get("media");
  if (!file || typeof file.arrayBuffer !== "function") return json(400, { status: "failure", error: "Upload one media file using the media field." });
  if (file.size > MAX_FILE_BYTES) return json(413, { status: "failure", error: "Netlify function limit: choose a file no larger than 4 MB." });
  const isImage = kind === "image";
  if (isImage && !file.type.startsWith("image/")) return json(415, { status: "failure", error: "Please upload an image file." });
  if (!isImage && !file.type.startsWith("video/")) return json(415, { status: "failure", error: "Please upload a video file." });

  const bytes = await file.arrayBuffer();
  const form = new FormData();
  form.append("media", new Blob([bytes], { type: file.type || "application/octet-stream" }), (file.name || "upload").replace(/[\\/]/g, "_"));
  form.append("models", "genai");
  form.append("api_user", apiUser);
  form.append("api_secret", apiSecret);
  const endpoint = isImage
    ? "https://api.sightengine.com/1.0/check.json"
    : "https://api.sightengine.com/1.0/video/check-sync.json";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 22000);
  try {
    const upstream = await fetch(endpoint, { method: "POST", body: form, signal: controller.signal });
    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok || payload.status !== "success") {
      const message = payload.error?.message || payload.error?.type || payload.message || `Sightengine returned HTTP ${upstream.status}`;
      return json(upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502, { status: "failure", error: message });
    }
    return json(200, payload);
  } catch (err) {
    const message = err?.name === "AbortError"
      ? "Sightengine took too long. Try a smaller image or shorter video."
      : "Could not reach Sightengine. Check API credentials, model access, and account limits.";
    return json(502, { status: "failure", error: message });
  } finally { clearTimeout(timer); }
}
