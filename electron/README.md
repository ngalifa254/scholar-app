# Desktop builds

The Electron app opens the hosted Student Center at
`https://scholars.wahomefoundation.com`. The Next.js server and Supabase
credentials stay on the server; the desktop package contains only the secure
Electron window shell.

For local development, start Next.js in one terminal and point Electron at it
from another PowerShell terminal:

```powershell
$env:SCHOLAR_APP_URL = "http://localhost:3000"
pnpm desktop
```

Build an installer on the matching operating system:

```powershell
pnpm desktop:win
```

On macOS, run:

```sh
pnpm desktop:mac
```

Installers are written to `release/`. The macOS build is universal for Intel
and Apple Silicon. Signing and notarization credentials are not configured, so
these are development builds until the organization adds its distribution
credentials.
