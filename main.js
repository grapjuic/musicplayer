const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"), 
            nodeIntegration: false, 
            contextIsolation: true 
        }
    });

    mainWindow.loadFile("index.html");
});
