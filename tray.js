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
    tray = new Tray(iconPath); // assign the icon

    const contextMenu = Menu.buildFromTemplate([
        { label: "Show", click: () => mainWindow.show() },
        { label: "Quit", click: () => mainWindow.close() }
    ]);

    tray.setContextMenu(contextMenu);
    tray.setToolTip("Music Player");

    console.log("tray created successfully!");
}

let lastSong = ""; // Store the last song title

function updateTraySong(songTitle) {
    if (!tray) {
        console.error("tray not initialized! Cannot update song.");
        return;
    }

    // Only update if the song is different from the last one
    if (songTitle !== lastSong) {
        lastSong = songTitle; // Update the last song
        tray.setTitle(songTitle);

        console.log(`updated Tray Title: ${songTitle}`); // only logs when the song changes
    }
}


module.exports = { createTray, updateTraySong };