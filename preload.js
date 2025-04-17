const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  loginToSpotify:      ()       => ipcRenderer.send("login-to-spotify"),
  onSpotifyAuthSuccess: cb      => ipcRenderer.on("spotify-auth-success", cb),
  updateTraySong:      song     => ipcRenderer.send("update-tray-song", song),
  openPlaylists:       ()       => ipcRenderer.send("open-playlists"),
  goBack:              ()       => ipcRenderer.send("go-back")
});
