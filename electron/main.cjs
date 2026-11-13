const { app, BrowserWindow } = require("electron");
const path = require("node:path");

app.setPath(
  "userData",
  path.join(app.getPath("appData"), "WahomeFoundation", "StudentCenter")
);

const defaultUrl = "https://scholar-app-delta.vercel.app";
const startUrl = process.env.SCHOLAR_APP_URL || defaultUrl;
const parsedStartUrl = new URL(startUrl);

if (parsedStartUrl.protocol !== "https:" && !isLoopbackUrl(parsedStartUrl)) {
  throw new Error("The desktop app must load an HTTPS URL.");
}

function isLoopbackUrl(url) {
  return (
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(url.hostname)
  );
}

function isAllowedUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.origin === parsedStartUrl.origin ||
      (isLoopbackUrl(parsedStartUrl) && isLoopbackUrl(url))
    );
  } catch {
    return false;
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 900,
    minHeight: 640,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  window.once("ready-to-show", () => window.show());

  window.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedUrl(url)) event.preventDefault();
  });

  window.webContents.on("will-redirect", (event, url) => {
    if (!isAllowedUrl(url)) event.preventDefault();
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedUrl(url)) void window.loadURL(url);
    return { action: "deny" };
  });

  void window.loadURL(startUrl);
}

app.whenReady().then(() => {
  if (process.platform === "win32") {
    app.setAppUserModelId("org.wahomefoundation.studentcenter");
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
