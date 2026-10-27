const carousel = document.querySelector(".photo-carousel");
const track = carousel?.querySelector(".photo-track");
const aboutNotes = document.querySelectorAll(".about-note");

aboutNotes.forEach((note) => {
    note.addEventListener("toggle", () => {
        if (!note.open) return;

        aboutNotes.forEach((otherNote) => {
            if (otherNote !== note) {
                otherNote.open = false;
            }
        });
    });
});

if (carousel && track) {
    const slides = Array.from(track.children);
    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );
    let activeIndex = 0;
    let pointerStart = null;
    let dragOffset = 0;
    let startTranslate = 0;

    const getTranslate = (index) => {
        const slide = slides[index];
        return carousel.clientWidth / 2 - slide.offsetLeft - slide.clientWidth / 2;
    };

    const showSlide = (index, animate = true) => {
        activeIndex = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => {
            slide.classList.toggle("is-active", slideIndex === activeIndex);
        });
        track.style.transition = animate ? "" : "none";
        track.style.transform = `translateX(${getTranslate(activeIndex)}px)`;
    };

    carousel.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;

        pointerStart = event.clientX;
        dragOffset = 0;
        startTranslate = getTranslate(activeIndex);
        track.style.transition = "none";
        carousel.setPointerCapture(event.pointerId);
    });

    carousel.addEventListener("pointermove", (event) => {
        if (pointerStart === null) return;

        dragOffset = event.clientX - pointerStart;
        track.style.transform = `translateX(${startTranslate + dragOffset}px)`;
    });

    const finishDrag = () => {
        if (pointerStart === null) return;

        const threshold = carousel.clientWidth * 0.15;
        if (Math.abs(dragOffset) > threshold) {
            showSlide(activeIndex + (dragOffset < 0 ? 1 : -1));
        } else {
            showSlide(activeIndex);
        }

        pointerStart = null;
        dragOffset = 0;
    };

    carousel.addEventListener("pointerup", finishDrag);
    carousel.addEventListener("pointercancel", finishDrag);
    carousel.addEventListener("lostpointercapture", finishDrag);

    carousel.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") {
            showSlide(activeIndex + 1);
        } else if (event.key === "ArrowLeft") {
            showSlide(activeIndex - 1);
        } else {
            return;
        }
        event.preventDefault();
    });

    window.addEventListener("resize", () => showSlide(activeIndex, false));

    if (!prefersReducedMotion.matches) {
        window.setInterval(() => {
            if (pointerStart === null) {
                showSlide(activeIndex + 1);
            }
        }, 3000);
    }

    showSlide(activeIndex, false);
}
