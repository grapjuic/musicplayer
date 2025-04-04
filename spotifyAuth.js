const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

require('dotenv').config();

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
  });

// redirect user to spotify login
app.get('/login', (req, res) => {
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
    console.log("Redirecting to:", authorizeURL);
    res.redirect(authorizeURL);
});


// handle callback from spotify
app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.send('Error: No authorization code provided.');
    }

    try {
        const data = await spotifyApi.authorizationCodeGrant(code);
        const accessToken = data.body['access_token'];
        const refreshToken = data.body['refresh_token'];

        // store tokens in Spotify API instance
        spotifyApi.setAccessToken(accessToken);
        spotifyApi.setRefreshToken(refreshToken);

        console.log("Access Token:", accessToken);
        console.log("Refresh Token:", refreshToken);

        //store tokens globally (in-memory storage for now)
        global.spotifyAccessToken = accessToken;
        global.spotifyRefreshToken = refreshToken;

        // redirect user back to the app
        res.send(`
            <script>
                localStorage.setItem('spotifyAccessToken', '${accessToken}');
                localStorage.setItem('spotifyRefreshToken', '${refreshToken}');
                window.close();
            </script>
            <p> Authentication successful! You can now close this tab and return to the app.</p>
        `);
    } catch (err) {
        console.error("Error getting tokens:", err);
        res.send("Authentication failed.");
    }
});

// serve access token to electron
app.get('/token', (req, res) => {
    if (spotifyApi.getAccessToken()) {
        res.json({ accessToken: spotifyApi.getAccessToken() });
    } else {
        res.status(401).send('No access token available.');
    }
});

app.get('/refresh-token', async (req, res) => {
    try {
        const refreshToken = spotifyApi.getRefreshToken();
        if (!refreshToken) return res.status(401).send("No refresh token available");

        const data = await spotifyApi.refreshAccessToken();
        const newAccessToken = data.body['access_token'];

        spotifyApi.setAccessToken(newAccessToken);
        console.log("Refreshed Access Token:", newAccessToken);

        res.json({ accessToken: newAccessToken });
    } catch (err) {
        console.error("Error refreshing token:", err);
        res.status(500).send("Failed to refresh token");
    }
});


app.get('/success', (req, res) => {
    res.send('Authentication successful! You can now close this tab and return to the app.');
});


// default route (prevents "Cannot GET /" errors)
app.get('/', (req, res) => {
    res.send('🎵 Spotify Auth Server is running!');
});

app.listen(PORT, () => {
    console.log(`🎵 Spotify auth server running on http://localhost:${PORT}`);
});

