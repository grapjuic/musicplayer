const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    loginToSpotify: () => ipcRenderer.send("login-to-spotify"), 
    openPlaylists: () => ipcRenderer.send("open-playlists"),
    openThemes: () => ipcRenderer.send("open-themes"),
    goBack: () => ipcRenderer.send("go-back"),
    updateTraySong: (songTitle) => ipcRenderer.send("update-tray-song", songTitle),
});
