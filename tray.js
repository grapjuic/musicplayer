

const { Tray, Menu } = require("electron");
const path = require("path");

let tray = null;

function createTray(mainWindow) {
    const iconPath = path.join(__dirname, "assets/music-icon.png"); // Ensure this path exists!

    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
        { label: "Show", click: () => mainWindow.show() },
        { label: "Quit", click: () => app.quit() }
    ]);

    tray.setContextMenu(contextMenu);
    tray.setToolTip("Music Player");

    console.log("🎵 Tray created successfully!");
}

function updateTraySong(songTitle) {
    if (tray) {
        tray.setToolTip(`🎵 Now Playing: ${songTitle}`);
        console.log(`Updating Tray: ${songTitle}`);
    }
}

module.exports = { createTray, updateTraySong };
