const { Tray, Menu } = require("electron");
const path = require("path");

let tray = null; 

function createTray(mainWindow) {
    console.log("🎵 Creating tray...");

    // prevent duplicate tray instances
    if (tray !== null) {
        console.log("⚠️ Tray already exists!");
        return;
    }

    const iconPath = path.join(__dirname, "assets", "music-icon.png");
    tray = new Tray(iconPath); // ✅ Assign the icon

    const contextMenu = Menu.buildFromTemplate([
        { label: "Show", click: () => mainWindow.show() },
        { label: "Quit", click: () => mainWindow.close() }
    ]);

    tray.setContextMenu(contextMenu);
    tray.setToolTip("Music Player");

    console.log("✅ Tray created successfully!");
}

function updateTraySong(songTitle) {
    if (!tray) {
        console.error("❌ Tray not initialized! Cannot update song.");
        return;
    }

    tray.setTitle(`${songTitle}`);
    console.log(`🎵 Updated Tray Title: ${songTitle}`);
}

module.exports = { createTray, updateTraySong };
