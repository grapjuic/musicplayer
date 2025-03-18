console.log("🎵 Renderer process running...");

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded!");

    // navigate to Playlists
    const playlistsButton = document.getElementById("open-playlists");
    if (playlistsButton) {
        playlistsButton.addEventListener("click", () => {
            console.log("📜 Navigating to Playlists...");
            window.electron.openPlaylists();  // use the exposed IPC function
        });
    }

    // navigate to Themes
    const themesButton = document.getElementById("open-themes");
    if (themesButton) {
        themesButton.addEventListener("click", () => {
            console.log("🎨 Navigating to Themes...");
            window.electron.openThemes();  // use the exposed IPC function
        });
    }

    // connect to spotify
    const connectButton = document.getElementById("connect-spotify");
    if (connectButton) {
        connectButton.addEventListener("click", () => {
            console.log("🔗 Connecting to Spotify...");
            window.open("http://localhost:3000/login", "_blank");  // open spotify login
        });
    }

    // fetch spotify token after DOM is loaded
    fetchSpotifyToken();
});

// fetch spotify access token
async function fetchSpotifyToken() {
    try {
        const response = await fetch("http://localhost:3000/token");
        const data = await response.json();

        if (data.accessToken) {
            console.log("Connected to Spotify!");
            localStorage.setItem("spotifyAccessToken", data.accessToken);
            loadUserData(data.accessToken);
            fetchCurrentlyPlaying();

            // Start auto-fetching now playing every 5s
            if (!window.fetchPlayingInterval) {
                window.fetchPlayingInterval = setInterval(fetchCurrentlyPlaying, 5000);
            }
        } else {
            console.log("No token received. Attempting refresh...");
            await refreshToken();
        }
    } catch (error) {
        console.error("Error fetching token:", error);
    }
}

// refresh token if expired
async function refreshToken() {
    try {
        const response = await fetch("http://localhost:3000/refresh-token");
        const data = await response.json();

        if (data.accessToken) {
            console.log("🔄 Token refreshed!");
            localStorage.setItem("spotifyAccessToken", data.accessToken);
            await fetchSpotifyToken();
        } else {
            console.error("Failed to refresh token.");
        }
    } catch (error) {
        console.error("Error refreshing token:", error);
    }
}

// load user data
async function loadUserData(accessToken) {
    try {
        const response = await fetch("https://api.spotify.com/v1/me", {
            headers: { "Authorization": `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error("Failed to fetch user data");

        const userData = await response.json();
        document.getElementById("user-info").innerText = `Logged in as ${userData.display_name}`;
        document.getElementById("connect-spotify").style.display = "none";
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

// fetch currently playing song
async function fetchCurrentlyPlaying() {
    let accessToken = localStorage.getItem("spotifyAccessToken");

    if (!accessToken) {
        console.error("No access token found.");
        return;
    }

    try {
        const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
            headers: { "Authorization": `Bearer ${accessToken}` }
        });

        if (response.status === 204) {
            console.log("⏸ No song is currently playing.");
            document.getElementById("song-title").innerText = "Not playing";
            return;
        }

        if (!response.ok) throw new Error("Failed to fetch current song");

        const data = await response.json();
        updateNowPlayingUI(data);
    } catch (error) {
        console.error("Error fetching currently playing song:", error);
    }
}

// update Now Playing UI
function updateNowPlayingUI(songData) {
    const nowPlayingContainer = document.getElementById("now-playing");
    const playButton = document.getElementById("play");
    const pauseButton = document.getElementById("pause");

    if (!songData || !songData.item) {
        nowPlayingContainer.innerHTML = "<p>Not playing</p>";
        playButton.style.display = "block"; // Show play button
        pauseButton.style.display = "none"; // Hide pause button
        return;
    }

    const songName = songData.item.name;
    const artistName = songData.item.artists.map(artist => artist.name).join(", ");
    const albumCover = songData.item.album.images[0]?.url || "https://via.placeholder.com/100";

    nowPlayingContainer.innerHTML = `
        <img src="${albumCover}" alt="${songName}" width="300">
        <p><strong>${songName}</strong> - ${artistName}</p>
    `;

    playButton.style.display = "none"; // Hide play button when playing
    pauseButton.style.display = "block"; // Show pause button
}

// control playback (play/pause)
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

// previous track
document.getElementById("prev").addEventListener("click", async () => {
    await fetch("https://api.spotify.com/v1/me/player/previous", {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("spotifyAccessToken")}` }
    }).catch(console.error);
});

// next track
document.getElementById("next").addEventListener("click", async () => {
    await fetch("https://api.spotify.com/v1/me/player/next", {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("spotifyAccessToken")}` }
    }).catch(console.error);
});

// start auto-fetching the currently playing song every 5 seconds
setInterval(fetchCurrentlyPlaying, 5000);
