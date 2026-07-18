const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

// The Chromium GPU process fails to init on some Linux setups (missing/
// incompatible GL drivers), which crashes the whole app ("GPU process
// isn't usable. Goodbye.") before the renderer ever paints -- looks like a
// blank white window with no error dialog. Software (CPU) rendering avoids
// depending on the GPU process at all.
app.disableHardwareAcceleration();

let backendProcess = null;
let mainWindow = null;
let backendPort = null;

const BACKEND_DIR = path.join(__dirname, "..", "backend");

function isWindows() {
  return process.platform === "win32";
}

function spawnBackend() {
  return new Promise((resolve, reject) => {
    const scriptPath = isWindows()
      ? path.join(BACKEND_DIR, "scripts", "run.ps1")
      : path.join(BACKEND_DIR, "scripts", "run.sh");

    const command = isWindows() ? "powershell.exe" : "bash";
    const args = isWindows()
      ? ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath]
      : [scriptPath];

    backendProcess = spawn(command, args, { cwd: BACKEND_DIR });

    let resolved = false;
    let stdoutBuf = "";

    backendProcess.stdout.on("data", (data) => {
      stdoutBuf += data.toString();
      const match = stdoutBuf.match(/READY (\d+)/);
      if (match && !resolved) {
        resolved = true;
        resolve(parseInt(match[1], 10));
      }
      console.log(`[backend] ${data}`.trim());
    });

    backendProcess.stderr.on("data", (data) => {
      console.error(`[backend] ${data}`.trim());
    });

    backendProcess.on("exit", (code) => {
      if (!resolved) {
        reject(new Error(`Backend exited before becoming ready (code ${code})`));
      }
    });
  });
}

async function createWindow() {
  try {
    backendPort = await spawnBackend();
  } catch (err) {
    console.error("Failed to start backend:", err);
    app.quit();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Packaged builds block ad-hoc CLI switches like --enable-logging /
  // --remote-debugging-port (Electron's hardening for signed apps), so a
  // renderer-side failure (blank window, JS exception, load error) is
  // otherwise invisible -- these forward it to our own stdout instead.
  mainWindow.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
  });
  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[renderer] did-fail-load ${errorCode} ${errorDescription} ${validatedURL}`);
  });
  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error(`[renderer] render-process-gone ${JSON.stringify(details)}`);
  });

  if (!app.isPackaged) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
  }
}

ipcMain.handle("get-backend-port", () => backendPort);

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
