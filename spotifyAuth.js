const path = require('path');
const dotenvResult = require('dotenv').config({
  path: path.resolve(__dirname, '.env'),
});
if (dotenvResult.error) {
  console.warn('⚠️  Could not load .env file:', dotenvResult.error);
}

// pull in your three vars or crash early:
const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
  AUTH_SERVER_PORT = 3000
} = process.env;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REDIRECT_URI) {
  console.error('Missing one or more Spotify env vars. Make sure .env contains:');
  console.error('   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI');
  process.exit(1);
}

const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// initialize the Spotify API wrapper
const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_CLIENT_SECRET,
  redirectUri: SPOTIFY_REDIRECT_URI,
});

console.log('Spotify Auth Server');
console.log(' • Client ID:        ', SPOTIFY_CLIENT_ID);
console.log(' • Redirect URI:     ', SPOTIFY_REDIRECT_URI);
console.log(` • Listening on port ${AUTH_SERVER_PORT}\n`);
//login
app.get('/login', (req, res) => {
  const scopes = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-library-read',
    'streaming',
  ];

  // createAuthorizeURL automatically includes client_id, redirect_uri, state, etc.
  const state = Math.random().toString(36).substring(2, 15);
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state, true);

  console.log('🌐 Redirecting to Spotify Accounts:', authorizeURL);
  res.redirect(authorizeURL);
});

//callback
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Authorization code missing from callback.');
  }

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const accessToken  = data.body['access_token'];
    const refreshToken = data.body['refresh_token'];

    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);
    global.spotifyAccessToken  = accessToken;
    global.spotifyRefreshToken = refreshToken;

    console.log('🔑 Got tokens—Access:', accessToken.slice(0,8)+'…', 'Refresh:', refreshToken.slice(0,8)+'…');

    // this page closes itself and notifies the opener
    res.send(`
      <html><body>
        <script>
          localStorage.setItem('spotifyAccessToken', '${accessToken}');
          localStorage.setItem('spotifyRefreshToken', '${refreshToken}');
          // If you opened this from Electron with window.open:
          if (window.opener) window.opener.postMessage('spotify-auth-success', '*');
          window.close();
        </script>
        <p>Authentication succeeded—You can close this window.</p>
      </body></html>
    `);
  } catch (err) {
    console.error('Error exchanging code for tokens:', err);
    res.status(500).send('⚠️ Authentication failed.');
  }
});

//token
app.get('/token', (req, res) => {
  const token = spotifyApi.getAccessToken();
  if (!token) return res.status(401).json({ error: 'No access token available' });
  res.json({ accessToken: token });
});

//refresh token
app.get('/refresh_token', async (req, res) => {
  try {
    const data = await spotifyApi.refreshAccessToken();
    const newToken = data.body['access_token'];
    spotifyApi.setAccessToken(newToken);
    console.log('Refreshed access token:', newToken.slice(0,8)+'…');
    res.json({ accessToken: newToken });
  } catch (err) {
    console.error('Failed to refresh token:', err);
    res.status(500).send('Failed to refresh token');
  }
});

//server check
app.get('/', (req, res) => res.send('🎵 Spotify Auth Server is up'));

//listening
app.listen(AUTH_SERVER_PORT, () => {
  console.log(`Auth server listening on http://localhost:${AUTH_SERVER_PORT}/\n`);
});
