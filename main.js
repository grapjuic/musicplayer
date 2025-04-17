// main.js
const path          = require("path");
const { app, BrowserWindow, ipcMain } = require("electron");
const express       = require("express");
const cors          = require("cors");
const SpotifyWebApi = require("spotify-web-api-node");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
  AUTH_SERVER_PORT = 3000
} = process.env;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REDIRECT_URI) {
  console.error("missing Spotify env vars");
  process.exit(1);
}

// ——— shared Spotify client —————————————————————————————————————————————
const spotifyApi = new SpotifyWebApi({
  clientId:     SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_CLIENT_SECRET,
  redirectUri:  SPOTIFY_REDIRECT_URI
});

// ——— embedded auth server ————————————————————————————————————————————
const authApp = express();
authApp.use(cors());
authApp.use(express.json());

// 1) kick off the OAuth dance
authApp.get("/login", (_req, res) => {
  const scopes = [
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-library-read",
    "streaming"
  ];
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, null, true);
  res.redirect(authorizeURL);
});

// spotify redirects here 
authApp.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("missing code");

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    spotifyApi.setAccessToken(data.body.access_token);
    spotifyApi.setRefreshToken(data.body.refresh_token);

    // tell the user to close the window
    res.send(`
      <html><body>
        <p>Authentication succeeded! You can close this window.</p>
        <script>window.close()</script>
      </body></html>
    `);
  } catch (err) {
    console.error("authorizationCodeGrant failed", err);
    res.status(500).send("⚠️ Authentication failed");
  }
});


authApp.get("/token", (_req, res) => {
  const token = spotifyApi.getAccessToken();
  if (!token) {
    return res
      .status(401)
      .json({ error: "No access token yet – please log in first." });
  }
  res.json({ accessToken: token });
});

// refresh when needed
authApp.get("/refresh-token", async (_req, res) => {
  try {
    const data     = await spotifyApi.refreshAccessToken();
    const newToken = data.body.access_token;
    spotifyApi.setAccessToken(newToken);
    res.json({ accessToken: newToken });
  } catch (err) {
    console.error("refreshAccessToken failed", err);
    res.status(500).send("Failed to refresh token");
  }
});

authApp.listen(AUTH_SERVER_PORT, () => {
  console.log(`🚀 Auth server listening on http://localhost:${AUTH_SERVER_PORT}`);
});

//electron
let mainWindow;
app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 350, height: 530, frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile("index.html");

  // tray + nav
  const { createTray } = require("./tray");
  createTray(mainWindow);
  ipcMain.on("update-tray-song", (_, song) => require("./tray").updateTraySong(song));
  ipcMain.on("open-playlists",   ()  => mainWindow.loadFile("playlist.html"));
  ipcMain.on("go-back",           ()  => mainWindow.loadFile("index.html"));

  // spotify login
  ipcMain.on("login-to-spotify", () => {
    const authWindow = new BrowserWindow({
      width: 500, height: 600,
      parent: mainWindow, modal: true, show: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    });

    authWindow.loadURL(`http://localhost:${AUTH_SERVER_PORT}/login`);
    const isCallback = url => url.startsWith(SPOTIFY_REDIRECT_URI);

    // **only** after "/callback" has fully loaded
    authWindow.webContents.on("did-navigate", (_e, url) => {
      if (isCallback(url)) {
        authWindow.close();
        mainWindow.webContents.send("spotify-auth-success");
      }
    });
  });
});

// prevent quitting when user closes window
app.on("window-all-closed", e => e.preventDefault());
