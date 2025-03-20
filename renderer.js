console.log("🎵 Renderer process running...");

document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM fully loaded!");

    if (!window.electron) {
        console.error("❌ Electron API not found. Check preload.js!");
        return;
    }

    setupButtons();
    fetchSpotifyToken(); // Get token when app starts
    setInterval(fetchCurrentlyPlaying, 1000); // Auto-update song info every second
});

/* ----------------- 🟢 UI Setup Functions ----------------- */

// set up button listeners
function setupButtons() {
    setupNavigationButtons();
    setupPlaybackButtons();
}

// playlists Button
function setupNavigationButtons() {
    const playlistsButton = document.getElementById("open-playlists");
    if (playlistsButton) {
        playlistsButton.addEventListener("click", () => {
            console.log("📜 Opening playlists...");
            window.electron.openPlaylists();
        });
    }

    const themesButton = document.getElementById("open-themes");
    if (themesButton) {
        themesButton.addEventListener("click", () => {
            console.log("🎨 Opening themes...");
            window.electron.openThemes();
        });
    }
}

// playback buttons
function setupPlaybackButtons() {
    const playButton = document.getElementById("play");
    const pauseButton = document.getElementById("pause");
    const prevButton = document.getElementById("prev");
    const nextButton = document.getElementById("next");

    if (playButton) {
        playButton.addEventListener("click", async () => {
            console.log("▶️ Playing track...");
            await controlPlayback("play");
            setTimeout(fetchCurrentlyPlaying, 1000);
        });
    }

    if (pauseButton) {
        pauseButton.addEventListener("click", async () => {
            console.log("⏸ Pausing track...");
            await controlPlayback("pause");
            setTimeout(fetchCurrentlyPlaying, 1000);
        });
    }

    if (prevButton) {
        prevButton.addEventListener("click", async () => {
            console.log("⏮ Skipping to previous track...");
            await skipTrack("previous");
        });
    }

    if (nextButton) {
        nextButton.addEventListener("click", async () => {
            console.log("⏭ Skipping to next track...");
            await skipTrack("next");
        });
    }
}

/* ----------------- 🔄 Spotify API Functions ----------------- */

// fetch Spotify Access Token
function fetchSpotifyToken() {
    fetch("http://localhost:3000/token")
        .then(response => response.json())
        .then(data => {
            if (data.accessToken) {
                localStorage.setItem("spotifyAccessToken", data.accessToken);
                console.log("🔑 Access Token Retrieved:", data.accessToken);
                updateConnectionStatus(true);
            } else {
                console.error("❌ No access token received.");
                updateConnectionStatus(false);
            }
        })
        .catch(error => {
            console.error("❌ Error fetching token:", error);
            updateConnectionStatus(false);
        });
}

// update connection status
function updateConnectionStatus(isConnected) {
    const connectionStatus = document.getElementById("connection-status");
    if (connectionStatus) {
        connectionStatus.innerText = isConnected ? "✅ Connected to Spotify" : "❌ Not connected";
    }
}

// refresh Spotify Token
async function refreshToken() {
    try {
        const response = await fetch("http://localhost:3000/refresh-token");
        const data = await response.json();
        if (data.accessToken) {
            console.log("🔄 Token refreshed!");
            localStorage.setItem("spotifyAccessToken", data.accessToken);
            fetchSpotifyToken();
        } else {
            console.error("❌ Failed to refresh token.");
        }
    } catch (error) {
        console.error("Error refreshing token:", error);
    }
}

// fetch Currently Playing Song
async function fetchCurrentlyPlaying() {
    let accessToken = localStorage.getItem("spotifyAccessToken");
    if (!accessToken) return console.error("❌ No access token found.");

    try {
        const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
            headers: { "Authorization": `Bearer ${accessToken}` }
        });

        if (response.status === 204) {
            console.log("⏸ No song is currently playing.");
            updateNowPlayingUI(null);
            return;
        }

        if (!response.ok) throw new Error("Failed to fetch current song");

        const data = await response.json();
        updateNowPlayingUI(data);
        updateTraySong(data);
        updateProgressBar(data);
    } catch (error) {
        console.error("Error fetching currently playing song:", error);
    }
}

/* ----------------- Update UI & Tray ----------------- */

// update Tray with Song Title
function updateTraySong(songData) {
    if (!window.electron) {
        console.error("Electron API not available.");
        return;
    }

    if (!songData || !songData.item) {
        console.log("🎵 No song playing (sending to tray)");
        window.electron.updateTraySong("No song playing");
        return;
    }

    const songName = songData.item.name;
    const artistName = songData.item.artists.map(artist => artist.name).join(", ");
    const songTitle = `${songName} - ${artistName}`;

    console.log(`🎵 Sending to tray: ${songTitle}`);
    window.electron.updateTraySong(songTitle);
}


function updateNowPlayingUI(songData) {
    const nowPlayingContainer = document.getElementById("now-playing");
    const playButton = document.getElementById("play");
    const pauseButton = document.getElementById("pause");

    if (!songData || !songData.item) {
        nowPlayingContainer.innerHTML = "<p>Not playing</p>";
        playButton.style.display = "block"; // Show Play button
        pauseButton.style.display = "none"; // Hide Pause button
        return;
    }

    const songName = songData.item.name;
    const artistName = songData.item.artists.map(artist => artist.name).join(", ");
    const albumCover = songData.item.album.images[0]?.url || "https://via.placeholder.com/100";

    nowPlayingContainer.innerHTML = `
        <img src="${albumCover}" alt="${songName}" width="300">
        <p><strong>${songName}</strong> - ${artistName}</p>
    `;

    // check playback state to toggle play/pause button
    fetch("https://api.spotify.com/v1/me/player", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("spotifyAccessToken")}` }
    })
    .then(response => response.json())
    .then(playerState => {
        if (playerState.is_playing) {
            playButton.style.display = "none";  // Hide Play button
            pauseButton.style.display = "block"; // Show Pause button
        } else {
            playButton.style.display = "block"; // Show Play button
            pauseButton.style.display = "none"; // Hide Pause button
        }
    }).catch(error => {
        console.error("Error fetching player state:", error);
    });

    // send song title to the tray
    window.electron.updateTraySong(`${songName} - ${artistName}`);
}


// update Progress Bar
function updateProgressBar(songData) {
    const progressBar = document.getElementById("progress-bar");
    const currentTimeLabel = document.getElementById("current-time");
    const totalTimeLabel = document.getElementById("total-time");

    if (!songData || !songData.item) return;

    let currentTime = songData.progress_ms;
    let totalTime = songData.item.duration_ms;

    progressBar.value = (currentTime / totalTime) * 100;
    currentTimeLabel.textContent = formatTime(currentTime);
    totalTimeLabel.textContent = formatTime(totalTime);
}

// format time from ms to MM:SS
function formatTime(ms) {
    let minutes = Math.floor(ms / 60000);
    let seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

/* ----------------- 🎵 Playback Controls ----------------- */

// play / pause track
async function controlPlayback(action) {
    let accessToken = localStorage.getItem("spotifyAccessToken");
    if (!accessToken) return console.error("❌ No access token found.");

    try {
        const response = await fetch(`https://api.spotify.com/v1/me/player/${action}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" }
        });

        if (!response.ok) throw new Error(`Failed to ${action} playback`);
        console.log(action === "play" ? "▶️ Playing!" : "⏸ Paused!");
    } catch (error) {
        console.error(`Error with ${action} playback:`, error);
    }
}

// skip track
async function skipTrack(direction) {
    let accessToken = localStorage.getItem("spotifyAccessToken");
    if (!accessToken) return;

    await fetch(`https://api.spotify.com/v1/me/player/${direction}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${accessToken}` }
    }).catch(console.error);
}