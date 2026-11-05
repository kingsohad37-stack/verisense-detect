// Netlify Functions v2 handler: return a Web Response, not a legacy response object.
const apiUser = "1990469587";
const apiSecret = "UTrve5yLivzR9hGmpLvtFYEEduba33oN";
export default async function handler() {
  const configured = Boolean(apiUser && apiSecret);
  return new Response(JSON.stringify({
    ok: configured,
    credentialsConfigured: configured,
    message: configured
      ? "Sightengine credentials are present in the server-side function."
      : "Sightengine credentials are missing."
  }), {
    status: configured ? 200 : 503,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
