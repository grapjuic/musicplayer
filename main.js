
const { app, BrowserWindow, ipcMain, Tray, Menu } = require("electron");
const path = require("path");
const { shell } = require('electron');
const { createTray, updateTraySong } = require("./tray"); // import tray update function

let mainWindow;
let tray = null;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 350,
        height: 530,
        resizable: false,
        fullscreen: false,  
        fullscreenable: false,
        frame: false,
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
    ipcMain.on("login-to-spotify", async () => {
        const clientId = process.env.SPOTIFY_CLIENT_ID;  
        const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
        const scope = "user-read-playback-state user-read-currently-playing";
    
        const authURL = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
        
        shell.openExternal(authURL);
    });

});


    
  
   