console.log("🎵 Renderer process running...");

document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM fully loaded!");

    // ✅ Ensure Electron API exists before using
    if (!window.electron) {
        console.error("❌ Electron API not found. Check preload.js!");
        return;
    }

    // 📜 Playlists Button
    const playlistsButton = document.getElementById("open-playlists");
    if (playlistsButton) {
        playlistsButton.addEventListener("click", () => {
            console.log("📜 Opening playlists...");
            window.electron.openPlaylists();
        });
    }

    // 🎨 Themes Button
    const themesButton = document.getElementById("open-themes");
    if (themesButton) {
        themesButton.addEventListener("click", () => {
            console.log("🎨 Opening themes...");
            window.electron.openThemes();
        });
    }

    // ▶⏸ Play/Pause Button
    const playButton = document.getElementById("play");
    const pauseButton = document.getElementById("pause");

    if (playButton && pauseButton) {
        playButton.addEventListener("click", async () => {
            console.log("▶️ Playing track...");
            await controlPlayback("play");
            setTimeout(fetchCurrentlyPlaying, 1000); // Refresh song info after 1 sec
        });

        pauseButton.addEventListener("click", async () => {
            console.log("⏸ Pausing track...");
            await controlPlayback("pause");
            setTimeout(fetchCurrentlyPlaying, 1000); // Refresh song info after 1 sec
        });
    }

    // ⏮ Previous Track Button
    const prevButton = document.getElementById("prev");
    if (prevButton) {
        prevButton.addEventListener("click", async () => {
            console.log("⏮ Skipping to previous track...");
            try {
                const response = await fetch("https://api.spotify.com/v1/me/player/previous", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${localStorage.getItem("spotifyAccessToken")}` }
                });
                if (!response.ok) throw new Error("Failed to skip track");
                setTimeout(fetchCurrentlyPlaying, 1000); // Update UI
            } catch (error) {
                console.error("Error skipping track:", error);
            }
        });
    }

    // ⏭ Next Track Button
    const nextButton = document.getElementById("next");
    if (nextButton) {
        nextButton.addEventListener("click", async () => {
            console.log("⏭ Skipping to next track...");
            try {
                const response = await fetch("https://api.spotify.com/v1/me/player/next", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${localStorage.getItem("spotifyAccessToken")}` }
                });
                if (!response.ok) throw new Error("Failed to skip track");
                setTimeout(fetchCurrentlyPlaying, 1000); // Update UI
            } catch (error) {
                console.error("Error skipping track:", error);
            }
        });
    }

    // ✅ Fetch Spotify Token when DOM is loaded
    fetchSpotifyToken();
});


/* ----------------- 🟢 Spotify Functions ----------------- */

// 🎵 Fetch Spotify Access Token
async function fetchSpotifyToken() {
    try {
        const response = await fetch("http://localhost:3000/token");
        const data = await response.json();

        if (data.accessToken) {
            console.log("🔗 Connected to Spotify!");
            localStorage.setItem("spotifyAccessToken", data.accessToken);
            loadUserData(data.accessToken);
            fetchCurrentlyPlaying();

            // Start auto-fetching now playing every 5 seconds
            if (!window.fetchPlayingInterval) {
                window.fetchPlayingInterval = setInterval(fetchCurrentlyPlaying, 5000);
            }
        } else {
            console.log("❌ No token received. Attempting refresh...");
            await refreshToken();
        }
    } catch (error) {
        console.error("Error fetching token:", error);
    }
}

// 🔄 Refresh Token If Expired
async function refreshToken() {
    try {
        const response = await fetch("http://localhost:3000/refresh-token");
        const data = await response.json();

        if (data.accessToken) {
            console.log("🔄 Token refreshed!");
            localStorage.setItem("spotifyAccessToken", data.accessToken);
            await fetchSpotifyToken();
        } else {
            console.error("❌ Failed to refresh token.");
        }
    } catch (error) {
        console.error("Error refreshing token:", error);
    }
}

// 🧑‍💻 Load User Data
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

// 🎵 Fetch Currently Playing Song
// async function fetchCurrentlyPlaying() {
//     let accessToken = localStorage.getItem("spotifyAccessToken");

//     if (!accessToken) {
//         console.error("❌ No access token found.");
//         return;
//     }

//     try {
//         const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
//             headers: { "Authorization": `Bearer ${accessToken}` }
//         });

//         if (response.status === 204) {
//             console.log("⏸ No song is currently playing.");
//             document.getElementById("song-title").innerText = "Not playing";
//             return;
//         }

//         if (!response.ok) throw new Error("Failed to fetch current song");

//         const data = await response.json();
//         updateNowPlayingUI(data);
//     } catch (error) {
//         console.error("Error fetching currently playing song:", error);
//     }
// }

async function fetchCurrentlyPlaying() {
    let accessToken = localStorage.getItem("spotifyAccessToken");

    if (!accessToken) {
        console.error("❌ No access token found.");
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
        updateProgressBar(data);
    } catch (error) {
        console.error("Error fetching currently playing song:", error);
    }
}

function updateProgressBar(songData) {
    const progressBar = document.getElementById("progress-bar");
    const currentTimeLabel = document.getElementById("current-time");
    const totalTimeLabel = document.getElementById("total-time");

    if (!songData || !songData.item) return;

    let currentTime = songData.progress_ms;  // Current progress in ms
    let totalTime = songData.item.duration_ms;  // Total song length in ms

    progressBar.value = (currentTime / totalTime) * 100;
    currentTimeLabel.textContent = formatTime(currentTime);
    totalTimeLabel.textContent = formatTime(totalTime);
}

// Helper function to format time from ms to MM:SS
function formatTime(ms) {
    let minutes = Math.floor(ms / 60000);
    let seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

// 🖥️ Update Now Playing UI
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

    // Check if music is playing to toggle play/pause button visibility
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
    }).catch(console.error);
}


// ▶ Play Button
document.getElementById("play").addEventListener("click", async () => {
    await controlPlayback("play");
    updateNowPlayingUI();
});

// ⏸ Pause Button
document.getElementById("pause").addEventListener("click", async () => {
    await controlPlayback("pause");
    updateNowPlayingUI();
});

// ▶⏸ Control Playback (Play/Pause)
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

// ⏮ Previous Track
document.getElementById("prev").addEventListener("click", async () => {
    await fetch("https://api.spotify.com/v1/me/player/previous", {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("spotifyAccessToken")}` }
    }).catch(console.error);
});

// ⏭ Next Track
document.getElementById("next").addEventListener("click", async () => {
    await fetch("https://api.spotify.com/v1/me/player/next", {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("spotifyAccessToken")}` }
    }).catch(console.error);
});

async function fetchPlaylists() {
    let accessToken = localStorage.getItem("spotifyAccessToken");
    if (!accessToken) return console.error("❌ No access token found.");

    try {
        const response = await fetch("https://api.spotify.com/v1/me/playlists", {
            headers: { "Authorization": `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error("Failed to fetch playlists");

        const data = await response.json();
        displayPlaylists(data.items);
    } catch (error) {
        console.error("Error fetching playlists:", error);
    }
}

// start auto-fetching the currently playing song every second
setInterval(fetchCurrentlyPlaying, 1000);
