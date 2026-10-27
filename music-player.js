const musicAudio = document.querySelector("#music-audio");
const musicPlayButton = document.querySelector("#music-play");
const musicProgress = document.querySelector("#music-progress");
const musicCover = document.querySelector("#music-cover");
const musicCurrentTime = document.querySelector("#music-current-time");
const musicDuration = document.querySelector("#music-duration");
const musicStatus = document.querySelector("#music-status");

if (
    !musicAudio ||
    !musicPlayButton ||
    !musicProgress ||
    !musicCover ||
    !musicCurrentTime ||
    !musicDuration ||
    !musicStatus
) {
    throw new Error("Music player markup is incomplete.");
}

const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

musicAudio.addEventListener("loadedmetadata", () => {
    musicDuration.textContent = formatTime(musicAudio.duration);
    musicPlayButton.disabled = false;
    musicProgress.disabled = false;
    musicStatus.textContent = "";
});

musicAudio.addEventListener("timeupdate", () => {
    musicCurrentTime.textContent = formatTime(musicAudio.currentTime);
    if (Number.isFinite(musicAudio.duration) && musicAudio.duration > 0) {
        musicProgress.value = String(
            Math.round((musicAudio.currentTime / musicAudio.duration) * 1000)
        );
    }
});

musicAudio.addEventListener("play", () => {
    musicCover.classList.add("is-playing");
    musicPlayButton.textContent = "❚❚";
    musicPlayButton.setAttribute("aria-label", "หยุดเพลงชั่วคราว");
});

musicAudio.addEventListener("pause", () => {
    musicCover.classList.remove("is-playing");
    musicPlayButton.textContent = "▶";
    musicPlayButton.setAttribute("aria-label", "เล่นเพลง");
});

musicAudio.addEventListener("ended", () => {
    musicProgress.value = "0";
});

musicAudio.addEventListener("error", () => {
    musicPlayButton.disabled = true;
    musicProgress.disabled = true;
    musicStatus.textContent = "เปิดไฟล์เพลงไม่ได้ กรุณาตรวจสอบไฟล์ในโฟลเดอร์ scr\\เพลง";
    console.error("Unable to load the LANDOKMAI audio file from scr/เพลง.");
});

musicPlayButton.addEventListener("click", async () => {
    if (musicAudio.paused) {
        try {
            await musicAudio.play();
            musicStatus.textContent = "";
        } catch (error) {
            musicStatus.textContent = "เล่นเพลงไม่สำเร็จ กรุณาลองอีกครั้ง";
            console.error("Unable to play the selected project audio file.", error);
        }
    } else {
        musicAudio.pause();
    }
});

musicProgress.addEventListener("input", () => {
    if (Number.isFinite(musicAudio.duration)) {
        musicAudio.currentTime =
            (Number(musicProgress.value) / 1000) * musicAudio.duration;
    }
});
