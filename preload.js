window.addEventListener("DOMContentLoaded", () => {
    const audioPlayer = document.getElementById("audio-player");
    const playButton = document.getElementById("play");
    const pauseButton = document.getElementById("pause");
    const stopButton = document.getElementById("stop");

    if (audioPlayer && playButton && pauseButton && stopButton) {
        playButton.addEventListener("click", () => {
            audioPlayer.play();
        });

        pauseButton.addEventListener("click", () => {
            audioPlayer.pause();
        });

        stopButton.addEventListener("click", () => {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
        });
    }
});
