// Ensure this script runs only when the DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
    console.log("📜 Playlist page loaded.");

    // Fetch and display playlists
    await fetchPlaylists();

    // Back button functionality
    document.getElementById("back-btn").addEventListener("click", () => {
        const { ipcRenderer } = require("electron");
        ipcRenderer.send("go-back");
    });
});

// 🎵 Fetch User Playlists from Spotify
async function fetchPlaylists() {
    let accessToken = localStorage.getItem("spotifyAccessToken");

    if (!accessToken) {
        console.error("❌ No access token found.");
        document.getElementById("playlist-container").innerHTML = "<p>⚠ Please log in to Spotify first.</p>";
        return;
    }

    try {
        const response = await fetch("https://api.spotify.com/v1/me/playlists", {
            headers: { "Authorization": `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error("Failed to fetch playlists");

        const data = await response.json();
        displayPlaylists(data.items);
    } catch (error) {
        console.error("Error fetching playlists:", error);
        document.getElementById("playlist-container").innerHTML = "<p>⚠ Failed to load playlists.</p>";
    }
}

// 🎶 Display Playlists in UI
function displayPlaylists(playlists) {
    const container = document.getElementById("playlist-container");
    container.innerHTML = ""; // Clear previous content

    if (!playlists || playlists.length === 0) {
        container.innerHTML = "<p>No playlists found.</p>";
        return;
    }

    playlists.forEach(playlist => {
        const div = document.createElement("div");
        div.innerHTML = `
            <p><strong>${playlist.name}</strong></p>
            <button onclick="playPlaylist('${playlist.id}')">▶ Play</button>
        `;
        container.appendChild(div);
    });
}

// ▶ Play Playlist
async function playPlaylist(playlistId) {
    let accessToken = localStorage.getItem("spotifyAccessToken");

    try {
        const response = await fetch("https://api.spotify.com/v1/me/player/play", {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ context_uri: `spotify:playlist:${playlistId}` })
        });

        if (!response.ok) throw new Error("Failed to start playlist playback");
        console.log("🎵 Now playing playlist:", playlistId);
    } catch (error) {
        console.error("Error playing playlist:", error);
    }
}
