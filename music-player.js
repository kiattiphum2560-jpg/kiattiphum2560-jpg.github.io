const initializeMusicPlayer = () => {
    const musicAudio = document.querySelector("#music-audio");
    const musicPlayButton = document.querySelector("#music-play");
    const musicProgress = document.querySelector("#music-progress");
    const musicCover = document.querySelector("#music-cover");
    const musicCurrentTime = document.querySelector("#music-current-time");
    const musicDuration = document.querySelector("#music-duration");
    const musicStatus = document.querySelector("#music-status");
    const musicVolume = document.querySelector("#music-volume");
    const musicVolumeToggle = document.querySelector("#music-volume-toggle");
    const musicVolumePanel = document.querySelector("#music-volume-panel");
    const musicVolumeValue = document.querySelector("#music-volume-value");

    if (!musicAudio) return;
    if (
        !musicPlayButton ||
        !musicProgress ||
        !musicCover ||
        !musicCurrentTime ||
        !musicDuration ||
        !musicStatus ||
        !musicVolume ||
        !musicVolumeToggle ||
        !musicVolumePanel ||
        !musicVolumeValue
    ) {
        throw new Error("Music player markup is incomplete.");
    }

    if (musicAudio.dataset.playerInitialized === "true") return;
    musicAudio.dataset.playerInitialized = "true";

    musicAudio.volume = Number(musicVolume.value);
    musicVolumeValue.textContent = `${Math.round(musicAudio.volume * 100)}%`;

    const formatTime = (seconds) => {
        if (!Number.isFinite(seconds)) return "0:00";

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
    };

    musicAudio.addEventListener("loadedmetadata", async () => {
        musicDuration.textContent = formatTime(musicAudio.duration);
        musicPlayButton.disabled = false;
        musicProgress.disabled = false;

        try {
            await musicAudio.play();
            musicStatus.textContent = "";
        } catch (error) {
            if (error.name === "NotAllowedError") {
                musicStatus.textContent = "เบราว์เซอร์บล็อกการเล่นอัตโนมัติ กรุณากดปุ่มเล่นเพลง";
                return;
            }

            musicStatus.textContent = "เปิดเพลงอัตโนมัติไม่สำเร็จ กรุณากดปุ่มเล่นเพลง";
            console.error("Unable to start project audio automatically.", error);
        }
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
                musicStatus.textContent =
                    error.name === "NotAllowedError"
                        ? "เบราว์เซอร์บล็อกการเล่น กรุณากดปุ่มเล่นอีกครั้ง"
                        : "เล่นเพลงไม่สำเร็จ กรุณาลองอีกครั้ง";
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

    musicVolume.addEventListener("input", () => {
        musicAudio.volume = Number(musicVolume.value);
        musicAudio.muted = musicAudio.volume === 0;
    });

    musicAudio.addEventListener("volumechange", () => {
        const volumePercent = Math.round(musicAudio.volume * 100);
        musicVolume.value = String(musicAudio.volume);
        musicVolumeValue.textContent = `${volumePercent}%`;
        musicVolume.setAttribute("aria-label", `ระดับเสียง ${volumePercent}%`);

        const isMuted = musicAudio.muted || musicAudio.volume === 0;
        musicVolumeToggle.textContent = isMuted ? "🔇" : "🔊";
        musicVolumeToggle.setAttribute(
            "aria-label",
            musicVolumeToggle.getAttribute("aria-expanded") === "true"
                ? "ซ่อนระดับเสียง"
                : isMuted
                  ? "แสดงระดับเสียง (ปิดเสียง)"
                  : "แสดงระดับเสียง"
        );
    });

    musicVolumeToggle.addEventListener("click", () => {
        const isExpanded = musicVolumeToggle.getAttribute("aria-expanded") === "true";
        musicVolumeToggle.setAttribute("aria-expanded", String(!isExpanded));
        musicVolumeToggle.setAttribute(
            "aria-label",
            isExpanded ? "แสดงระดับเสียง" : "ซ่อนระดับเสียง"
        );
        musicVolumePanel.hidden = isExpanded;

        if (!isExpanded) {
            musicVolume.focus();
        }
    });

    document.addEventListener("click", (event) => {
        if (!musicVolumeToggle.parentElement.contains(event.target)) {
            musicVolumePanel.hidden = true;
            musicVolumeToggle.setAttribute("aria-expanded", "false");
            musicVolumeToggle.setAttribute("aria-label", "แสดงระดับเสียง");
        }
    });

    musicVolumePanel.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            musicVolumePanel.hidden = true;
            musicVolumeToggle.setAttribute("aria-expanded", "false");
            musicVolumeToggle.setAttribute("aria-label", "แสดงระดับเสียง");
            musicVolumeToggle.focus();
        }
    });
};

document.addEventListener("site:pagechange", initializeMusicPlayer);
initializeMusicPlayer();
