const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
// Hardcoded server-side credentials. Never expose these in public/ frontend files.
const apiUser = "1990469587";
const apiSecret = "UTrve5yLivzR9hGmpLvtFYEEduba33oN";
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 45 * 1024 * 1024, files: 1 } });

app.disable('x-powered-by');
app.set('trust proxy', 1);
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-7', legacyHeaders: false, message: { status: 'failure', error: 'Too many scans from this connection. Please wait a little and try again.' } });
app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/health', (_req, res) => res.json({ ok: true, credentialsConfigured: Boolean(apiUser && apiSecret) }));

function makeHandler(kind) {
  return async (req, res) => {
    if (!apiUser || !apiSecret) return res.status(503).json({ status: 'failure', error: 'Sightengine credentials are not configured on the server yet.' });
    if (!req.file) return res.status(400).json({ status: 'failure', error: 'Upload one media file using the media field.' });
    const isImage = kind === 'image';
    if (isImage && !req.file.mimetype.startsWith('image/')) return res.status(415).json({ status: 'failure', error: 'Please upload an image file.' });
    if (!isImage && !req.file.mimetype.startsWith('video/')) return res.status(415).json({ status: 'failure', error: 'Please upload a video file.' });
    if (isImage && req.file.size > 15 * 1024 * 1024) return res.status(413).json({ status: 'failure', error: 'Images must be 15 MB or smaller.' });
    const form = new FormData();
    form.append('media', new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname.replace(/[\\/\\\\]/g, '_'));
    form.append('models', 'genai');
    form.append('api_user', apiUser);
    form.append('api_secret', apiSecret);
    const endpoint = isImage
      ? 'https://api.sightengine.com/1.0/check.json'
      : 'https://api.sightengine.com/1.0/video/check-sync.json';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), isImage ? 45000 : 110000);
    try {
      const upstream = await fetch(endpoint, { method: 'POST', body: form, signal: controller.signal });
      const payload = await upstream.json().catch(() => ({}));
      if (!upstream.ok || payload.status !== 'success') {
        const message = payload.error && (payload.error.message || payload.error.type) || payload.message || `Sightengine returned HTTP ${upstream.status}`;
        return res.status(upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502).json({ status: 'failure', error: message });
      }
      return res.json(payload);
    } catch (err) {
      const message = err.name === 'AbortError' ? 'Sightengine request timed out. Try a smaller file.' : 'Could not reach Sightengine. Check server logs and network status.';
      return res.status(502).json({ status: 'failure', error: message });
    } finally { clearTimeout(timeout); }
  };
}
app.post('/api/detect-image', apiLimiter, upload.single('media'), makeHandler('image'));
app.post('/api/detect-video', apiLimiter, upload.single('media'), makeHandler('video'));
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ status: 'failure', error: 'File is too large. Images: 15 MB max; videos: 45 MB max.' });
  return res.status(400).json({ status: 'failure', error: 'Upload could not be processed. Choose a supported image or video file.' });
});
app.listen(PORT, () => console.log(`VeriSense server listening on ${PORT}`));
