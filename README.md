# VeriSense — Netlify Functions deployment (Option 1)

This project contains the static VeriSense frontend plus the Netlify Functions that proxy requests to Sightengine. The functions are the small server-side component; you do not need to create or manage a separate server, and the Sightengine credentials are hardcoded in the function source as requested.

## Important: don't use drag-and-drop for this deployment
Netlify drag-and-drop publishes static files only. It does not deploy the functions in `netlify/functions`, which is why `/api/health` returned “Site not found” and image analysis failed.

## Deploy to the existing Netlify site from Windows
1. Extract the whole ZIP into a folder.
2. Install Node.js 20+ if not already installed.
3. Open Command Prompt in the extracted project root (the folder containing `netlify.toml`).
4. Run these commands one by one:

   ```bash
   npm install
   npx netlify login
   npx netlify link
   npx netlify deploy --prod
   ```

5. During `netlify link`, select the existing VeriSense site. If asked for a publish directory, use `public`. The `netlify.toml` file configures the functions folder and publish directory.
6. Wait for the production deploy to finish.

## Verify
Open `https://YOUR-SITE.netlify.app/api/health`. It should return JSON with `ok: true` and `credentialsConfigured: true`.
Then try image analysis. Images must be no larger than 4 MB for the Netlify function setup.

## If you only have a phone
Use a GitHub repository connected to Netlify instead: upload the full extracted project (including `netlify.toml`, `package.json`, and `netlify/functions/`) to a repository, then in Netlify choose Add new site → Import an existing project and select that repository. Do not deploy only the `public` directory.

## Security
The Sightengine secret previously shown in the screenshot is compromised. It is hardcoded in the server-side function per the requested setup, but rotate it in Sightengine as soon as possible. Never put the replacement secret into `public/index.html` or other browser-side files.


## Deployment note

This project uses Netlify Functions v2 handlers (Web Request/Response API). Deploy from this project root with `npx netlify deploy --prod`; `netlify.toml` configures the `public` publish directory and `netlify/functions` directory. The Sightengine secret shown in earlier screenshots should be revoked and replaced before public use.
