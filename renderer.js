console.log("🎵 Renderer process running…");

function setupButtons() {
    setupNavigationButtons();
    setupPlaybackButtons();
  }
  

let lastSentTrayTitle = "";
const progressBar    = document.getElementById("progress-bar");
const totoroThumb    = document.getElementById("totoro-thumb");
const loginButton    = document.getElementById("spotify-login");
const statusElem     = document.getElementById("user-info");

// helper to show/hide login UI
function updateConnectionStatus(connected) {
  if (connected) {
    statusElem.style.display      = "none";
    loginButton.style.display     = "none";
  } else {
    statusElem.innerText          = "not connected";
    statusElem.style.display      = "block";
    loginButton.style.display     = "block";
  }
}

// only call token endpoint once we know Spotify auth succeeded
async function fetchSpotifyToken() {
  try {
    const res = await fetch("http://localhost:3000/token");
    if (!res.ok) throw new Error(`${res.statusText}`);
    const { accessToken } = await res.json();
    localStorage.setItem("spotifyAccessToken", accessToken);
    updateConnectionStatus(true);

    // now that we’re auth’d, start polling
    fetchCurrentlyPlaying();
    setInterval(fetchCurrentlyPlaying, 1000);
  } catch (err) {
    console.error("fetch token error:", err);
    updateConnectionStatus(false);
  }
}

// pull currently playing & update tray/thumb/etc
async function fetchCurrentlyPlaying() {
  const token = localStorage.getItem("spotifyAccessToken");
  if (!token) return;

  try {
    const r = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (r.status === 204) {
      updateNowPlayingUI(null);
      window.electron.updateTraySong("no song playing");
      return;
    }
    if (!r.ok) throw new Error(r.statusText);

    const data = await r.json();
    updateNowPlayingUI(data);
    updateProgressBar(data);

  } catch (err) {
    console.error("error fetching currently-playing:", err);
  }
}

function setupButtons() {
    setupNavigationButtons();
    setupPlaybackButtons();
  }
  
  function setupNavigationButtons() {
    const playlistsButton = document.getElementById("open-playlists");
    if (playlistsButton) {
      playlistsButton.addEventListener("click", () => {
        console.log("opening playlists");
        window.electron.openPlaylists();
      });
    }
  }
  
  function setupPlaybackButtons() {
    const playButton  = document.getElementById("play");
    const pauseButton = document.getElementById("pause");
    const prevButton  = document.getElementById("prev");
    const nextButton  = document.getElementById("next");
  
    if (playButton) {
      playButton.addEventListener("click", async () => {
        console.log("playing track");
        await controlPlayback("play");
        setTimeout(fetchCurrentlyPlaying, 1000);
      });
    }
  
    if (pauseButton) {
      pauseButton.addEventListener("click", async () => {
        console.log("pausing track");
        await controlPlayback("pause");
        setTimeout(fetchCurrentlyPlaying, 1000);
      });
    }
  
    if (prevButton) {
      prevButton.addEventListener("click", async () => {
        console.log("skipping to previous track");
        await skipTrack("previous");
      });
    }
  
    if (nextButton) {
      nextButton.addEventListener("click", async () => {
        console.log("skipping to next track");
        await skipTrack("next");
      });
    }
  }
  
  function updateNowPlayingUI(data) {
    const songTitle     = document.getElementById("song-title");
    const albumCoverImg = document.getElementById("album-cover");
    const playButton    = document.getElementById("play");
    const pauseButton   = document.getElementById("pause");
  
    if (!data || !data.item) {
      songTitle.innerText      = "Not playing";
      albumCoverImg.src        = "";
      albumCoverImg.alt        = "Album Cover";
      playButton.style.display = "block";
      pauseButton.style.display= "none";
      return;
    }
  
    const songName   = data.item.name;
    const artistName = data.item.artists.map(a=>a.name).join(", ");
    const coverUrl   = data.item.album.images[0]?.url || "https://via.placeholder.com/100";
  
    songTitle.innerHTML      = `<strong>${songName}</strong> – ${artistName}`;
    albumCoverImg.src        = coverUrl;
    albumCoverImg.alt        = songName;
  
    // fetch current playback state to toggle play/pause button
    fetch("https://api.spotify.com/v1/me/player", {
      headers: { "Authorization": `Bearer ${localStorage.getItem("spotifyAccessToken")}` }
    })
    .then(res=>res.json())
    .then(state => {
      if (state.is_playing) {
        playButton.style.display  = "none";
        pauseButton.style.display = "block";
      } else {
        playButton.style.display  = "block";
        pauseButton.style.display = "none";
      }
    })
    .catch(err => console.error("Error fetching player state:", err));
  
    // update tray icon text
    const trayTitle = `${songName} – ${artistName}`;
    if (trayTitle !== lastSentTrayTitle) {
      window.electron.updateTraySong(trayTitle);
      lastSentTrayTitle = trayTitle;
    }
  }
  
  function updateProgressBar(data) {
    const bar     = document.getElementById("progress-bar");
    const curLbl  = document.getElementById("current-time");
    const totLbl  = document.getElementById("total-time");
  
    if (!data || !data.item) return;
  
    const currentMs = data.progress_ms || 0;
    const totalMs   = data.item.duration_ms || 1;
    const pct       = (currentMs / totalMs) * 100;
  
    bar.value           = pct;
    bar.style.background= `linear-gradient(to right, #e9a6a6 ${pct}%, #ddd ${pct}%)`;
    curLbl.textContent  = formatTime(currentMs);
    totLbl.textContent  = formatTime(totalMs);
  }
  
  async function controlPlayback(action) {
    const token = localStorage.getItem("spotifyAccessToken");
    if (!token) return;
    const res = await fetch(
      `https://api.spotify.com/v1/me/player/${action}`,
      { method: "PUT", headers: { "Authorization": `Bearer ${token}` } }
    );
    if (!res.ok) console.error(`Failed to ${action}`);
  }
  
  async function skipTrack(dir) {
    const token = localStorage.getItem("spotifyAccessToken");
    if (!token) return;
    await fetch(
      `https://api.spotify.com/v1/me/player/${dir}`,
      { method: "POST", headers: { "Authorization": `Bearer ${token}` } }
    );
  }
  
  function formatTime(ms) {
    const m = Math.floor(ms / 60000);
    const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
    return `${m}:${s}`;
  }
  
// position Totoro
function updateProgressBar(data) {
    const bar     = document.getElementById("progress-bar");
    const curLbl  = document.getElementById("current-time");
    const totLbl  = document.getElementById("total-time");
  
    if (!data || !data.item) return;
  
    const currentMs = data.progress_ms || 0;
    const totalMs   = data.item.duration_ms || 1;
    const pct       = currentMs / totalMs;
  
    // fill bar
    const percent = pct * 100;
    bar.value           = percent;
    bar.style.background= `linear-gradient(to right, #e9a6a6 ${percent}%, #ddd ${percent}%)`;
    curLbl.textContent  = formatTime(currentMs);
    totLbl.textContent  = formatTime(totalMs);
  
    // reposition Totoro
    updateTotoroPosition();
  }
  
  function updateTotoroPosition() {
    const bar     = document.getElementById("progress-bar");
    const totoro  = document.getElementById("totoro-thumb");
    const wrapper = document.querySelector(".progress-wrapper");
  
    // compute fraction
    const min = parseFloat(bar.min) || 0;
    const max = parseFloat(bar.max) || 100;
    const val = parseFloat(bar.value);
    const frac = (val - min) / (max - min);
  
    // get slider track geometry
    const barRect     = bar.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
  
    // x relative to wrapper: start of bar → barRect.left‑wrapperRect.left
    const offsetX = barRect.left - wrapperRect.left;
    const x       = offsetX + frac * barRect.width;
  
    // center Totoro 
    totoro.style.left = `${x - totoro.offsetWidth/2}px`;
  
    // vertically center inside wrapper
    const topPos = (wrapper.clientHeight - totoro.offsetHeight) / 2;
    totoro.style.top  = `${topPos}px`;
  }
  

// entrypoint
document.addEventListener("DOMContentLoaded", () => {
    if (!window.electron) {
      console.error("electron API missing");
      return;
    }
  
    // login button
    loginButton.addEventListener("click", () => {
      window.electron.loginToSpotify();
    });
  
    // logout button
    const logoutLogo = document.getElementById("logout-logo");
    if (logoutLogo) {
      logoutLogo.addEventListener("click", () => {
        if (confirm("Log out of Spotify?")) {
          // clear tokens
          localStorage.removeItem("spotifyAccessToken");
          localStorage.removeItem("spotifyRefreshToken");
          // reset UI
          updateConnectionStatus(false);
          updateNowPlayingUI(null);
        }
      });
    }
  
    // set up playback/navigation buttons
    setupButtons();
  
    // spotify auth success → start polling
    window.electron.onSpotifyAuthSuccess(() => fetchSpotifyToken());
  
    // if we already have a token, go
    if (localStorage.getItem("spotifyAccessToken")) {
      updateConnectionStatus(true);
      fetchSpotifyToken();
    } else {
      updateConnectionStatus(false);
    }
  });
  
  

progressBar.addEventListener("input", updateTotoroPosition);
window.addEventListener("resize", updateTotoroPosition);
setTimeout(updateTotoroPosition, 0);