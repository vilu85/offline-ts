# offline-ts demo

This directory contains the interactive offline-ts demo deployed with GitHub Pages.

## Deployment

The `.github/workflows/static.yml` workflow deploys the demo when `master` is updated or when the workflow is started manually.

Before the `docs/` directory is uploaded, the workflow:

1. Installs dependencies with `npm ci`.
2. Runs lint and tests.
3. Creates a production build.
4. Copies `dist/offline.umd.js` to `docs/dist/offline.umd.js`.

The deployed demo is available at <https://vilu85.github.io/offline-ts/>.

GitHub Pages must use **GitHub Actions** as its source in the repository settings.

## Local development

Build the library:

```bash
npm run build:production
```

Copy the UMD bundle into the demo directory:

```bash
mkdir -p docs/dist
cp dist/offline.umd.js docs/dist/
```

On Windows PowerShell, use:

```powershell
New-Item -ItemType Directory -Force docs/dist
Copy-Item dist/offline.umd.js docs/dist/
```

Serve the repository root so the demo has an HTTP origin:

```bash
npx http-server .
```

Open <http://localhost:8080/docs/>. Opening the file directly is not recommended because browsers restrict XHR requests from `file://` pages.

## Demo controls

- **Check now** runs the selected XHR or image check.
- **Retry now** starts a reconnect check when reconnect state is `waiting`.
- **Simulate down** and **Simulate up** demonstrate state transitions without changing the browser network.
- The event log displays check, state, and reconnect events.

Use the browser developer tools to switch the network offline when testing real failures. Load the demo before enabling offline mode so its scripts are already available.
