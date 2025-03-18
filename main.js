const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),  // load preload
            nodeIntegration: false,  // ✅ improves security
            contextIsolation: true  // required for `contextBridge`
        }
    });

    mainWindow.loadFile("index.html");

    ipcMain.on("open-playlists", () => {
        console.log("📜 Opening playlists.html...");
        mainWindow.loadFile("playlists.html");
    });

    ipcMain.on("open-themes", () => {
        console.log("🎨 Opening themes.html...");
        mainWindow.loadFile("themes.html");
    });
});
