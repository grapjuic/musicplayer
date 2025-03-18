const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    openPlaylists: () => ipcRenderer.send("open-playlists"),
    openThemes: () => ipcRenderer.send("open-themes"),
    goBack: () => ipcRenderer.send("go-back"),
});
