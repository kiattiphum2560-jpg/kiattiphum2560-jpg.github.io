let navigationController;

const navigateToPage = async (targetUrl, addHistoryEntry) => {
    navigationController?.abort();
    navigationController = new AbortController();

    try {
        const response = await fetch(targetUrl, {
            signal: navigationController.signal,
            headers: { Accept: "text/html" }
        });

        if (!response.ok) {
            throw new Error(`Page request failed with status ${response.status}.`);
        }

        const page = new DOMParser().parseFromString(
            await response.text(),
            "text/html"
        );
        const nextHeader = page.querySelector(".site-header");
        const nextMain = page.querySelector("main");
        const currentHeader = document.querySelector(".site-header");
        const currentMain = document.querySelector("main");

        if (!nextHeader || !nextMain || !currentHeader || !currentMain) {
            throw new Error("The requested page is missing its header or main content.");
        }

        let musicPlayer = document.querySelector(".music-player");
        const incomingMusicPlayer = nextMain.querySelector(".music-player");

        if (!musicPlayer && incomingMusicPlayer) {
            musicPlayer = incomingMusicPlayer;
        } else {
            incomingMusicPlayer?.remove();
        }

        musicPlayer?.remove();
        currentHeader.replaceWith(nextHeader);
        currentMain.replaceWith(nextMain);

        if (musicPlayer) {
            musicPlayer.hidden = nextMain.id !== "home";
            nextMain.append(musicPlayer);
        }

        document.title = page.title;
        document.documentElement.lang = page.documentElement.lang;

        if (addHistoryEntry) {
            window.history.pushState({}, "", targetUrl);
        }

        window.scrollTo(0, 0);
        document.dispatchEvent(new Event("site:pagechange"));
    } catch (error) {
        if (error.name === "AbortError") return;

        console.error("Unable to navigate without interrupting music playback.", error);
        window.location.assign(targetUrl);
    }
};

document.addEventListener("click", (event) => {
    if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
    ) {
        return;
    }

    const clickedElement =
        event.target instanceof Element ? event.target : null;
    const link = clickedElement?.closest("a[href]");
    if (
        !link ||
        link.target ||
        link.hasAttribute("download") ||
        link.origin !== window.location.origin ||
        !link.pathname.endsWith(".html")
    ) {
        return;
    }

    const targetUrl = new URL(link.href);
    if (targetUrl.href === window.location.href) return;

    event.preventDefault();
    navigateToPage(targetUrl.href, true);
});

window.addEventListener("popstate", () => {
    navigateToPage(window.location.href, false);
});
