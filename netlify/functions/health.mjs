// Netlify Functions v2 handler: check server-side environment configuration only.
export default async function handler() {
  const configured = Boolean(process.env.SIGHTENGINE_API_USER && process.env.SIGHTENGINE_API_SECRET);
  return new Response(JSON.stringify({
    ok: configured,
    credentialsConfigured: configured,
    message: configured
      ? "Sightengine credentials are configured in the server environment."
      : "Sightengine credentials are missing from the server environment."
  }), {
    status: configured ? 200 : 503,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
