
const { app, BrowserWindow, ipcMain, Tray, Menu } = require("electron");
const path = require("path");
const { createTray, updateTraySong } = require("./tray"); // ✅ Import tray update function

let mainWindow;
let tray = null;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile("index.html");

    console.log("✅ Attempting to create tray...");
    createTray(mainWindow);
  

    ipcMain.on("update-tray-song", (event, songTitle) => {
        updateTraySong(songTitle);
    });

    ipcMain.on("open-playlists", () => {
        console.log("📜 Opening playlists.html...");
        mainWindow.loadFile("playlist.html");
    });

    ipcMain.on("open-themes", () => {
        console.log("🎨 Opening themes.html...");
        mainWindow.loadFile("themes.html");
    });

    ipcMain.on("go-back", () => {
        console.log("⬅ Navigating back to index.html");
        mainWindow.loadFile("index.html");
    });
    app.on("window-all-closed", (event) => {
        event.preventDefault(); // Prevents quitting when all windows close
    });

});
