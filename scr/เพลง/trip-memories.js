const tripDatabaseName = "relationship-site-trip-memories";
const tripStoreName = "trips";
let tripDatabasePromise;
let tripPageController;

const openTripDatabase = () => {
    if (tripDatabasePromise) return tripDatabasePromise;

    tripDatabasePromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(tripDatabaseName, 1);
        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(tripStoreName)) {
                database.createObjectStore(tripStoreName, {
                    keyPath: "id",
                    autoIncrement: true
                });
            }
        };
        request.onsuccess = () => {
            const database = request.result;
            database.onversionchange = () => database.close();
            resolve(database);
        };
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error("Trip memory storage is blocked by another page."));
    });

    return tripDatabasePromise;
};

const runTripStoreRequest = async (mode, action) => {
    const database = await openTripDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(tripStoreName, mode);
        const request = action(transaction.objectStore(tripStoreName));
        let result;

        request.onsuccess = () => {
            result = request.result;
        };
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => resolve(result);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error("Trip memory storage transaction was aborted."));
    });
};

const googleMapsEmbedUrl = (place) =>
    `https://www.google.com/maps?q=${encodeURIComponent(place)}&output=embed`;

const googleMapsLinkUrl = (place) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;

const createTripCard = (trip) => {
    const card = document.createElement("article");
    const photo = document.createElement("img");
    const content = document.createElement("div");
    const title = document.createElement("h3");
    const place = document.createElement("p");
    const mapContainer = document.createElement("div");
    const map = document.createElement("iframe");
    const mapLink = document.createElement("a");
    const deleteButton = document.createElement("button");

    card.className = "trip-card";
    card.dataset.tripId = String(trip.id);
    photo.className = "trip-card-photo";
    photo.src = URL.createObjectURL(trip.photo);
    photo.alt = trip.name;
    photo.loading = "lazy";
    photo.decoding = "async";
    photo.addEventListener("error", () => {
        URL.revokeObjectURL(photo.src);
        photo.removeAttribute("src");
        photo.alt = "Trip photo could not be loaded.";
    }, { once: true });

    content.className = "trip-card-content";
    title.textContent = trip.name;
    place.className = "trip-card-place";
    place.textContent = trip.place;
    mapContainer.className = "trip-card-map";
    map.src = googleMapsEmbedUrl(trip.place);
    map.title = `Google Maps: ${trip.place}`;
    map.loading = "lazy";
    map.referrerPolicy = "no-referrer-when-downgrade";
    mapContainer.append(map);
    mapLink.className = "trip-card-map-link";
    mapLink.href = googleMapsLinkUrl(trip.place);
    mapLink.target = "_blank";
    mapLink.rel = "noopener noreferrer";
    mapLink.textContent = "Open in Google Maps";
    deleteButton.className = "trip-delete";
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete-trip";
    deleteButton.textContent = "Delete trip";

    content.append(title, place, mapContainer, mapLink, deleteButton);
    card.append(photo, content);
    return card;
};

const renderSavedTrips = async (list, emptyState) => {
    const trips = await runTripStoreRequest("readonly", (store) => store.getAll());
    trips.sort((first, second) => second.createdAt - first.createdAt);
    list.replaceChildren(...trips.map(createTripCard));
    emptyState.hidden = trips.length > 0;
};

const initializeTripMemories = () => {
    tripPageController?.abort();
    const form = document.querySelector("#trip-form");
    if (!form) return;

    tripPageController = new AbortController();
    const { signal } = tripPageController;
    const photoInput = form.querySelector("#trip-photo");
    const preview = form.querySelector("#trip-photo-preview");
    const previewImage = form.querySelector("#trip-photo-preview-image");
    const placeInput = form.querySelector("#trip-place");
    const mapPreview = form.querySelector("#trip-map-preview");
    const mapPlaceholder = form.querySelector("#trip-map-placeholder");
    const status = form.querySelector("#trip-form-status");
    const submitButton = form.querySelector(".trip-submit");
    const list = document.querySelector("#trip-list");
    const emptyState = document.querySelector("#trip-empty-state");
    let previewUrl = null;
    let mapUpdateTimer;

    signal.addEventListener("abort", () => {
        window.clearTimeout(mapUpdateTimer);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    }, { once: true });

    const updateMapPreview = () => {
        window.clearTimeout(mapUpdateTimer);
        mapUpdateTimer = window.setTimeout(() => {
            const place = placeInput.value.trim();
            if (!place) {
                mapPreview.hidden = true;
                mapPreview.removeAttribute("src");
                mapPlaceholder.hidden = false;
                return;
            }

            mapPreview.src = googleMapsEmbedUrl(place);
            mapPreview.title = `Google Maps preview: ${place}`;
            mapPreview.hidden = false;
            mapPlaceholder.hidden = true;
        }, 450);
    };

    photoInput.addEventListener("change", () => {
        const file = photoInput.files?.[0];
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = null;

        if (!file || !file.type.startsWith("image/")) {
            preview.hidden = true;
            previewImage.removeAttribute("src");
            if (file) status.textContent = "Please choose a valid image file.";
            return;
        }

        previewUrl = URL.createObjectURL(file);
        previewImage.src = previewUrl;
        preview.hidden = false;
        status.textContent = "";
    }, { signal });

    placeInput.addEventListener("input", updateMapPreview, { signal });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const file = photoInput.files?.[0];
        if (!file || !file.type.startsWith("image/")) {
            status.textContent = "Please choose an image for this trip.";
            return;
        }

        submitButton.disabled = true;
        status.textContent = "Saving trip memory...";
        try {
            await runTripStoreRequest("readwrite", (store) =>
                store.add({
                    name: form.querySelector("#trip-name").value.trim(),
                    place: placeInput.value.trim(),
                    photo: file,
                    createdAt: Date.now()
                })
            );
            form.reset();
            preview.hidden = true;
            previewImage.removeAttribute("src");
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            previewUrl = null;
            mapPreview.hidden = true;
            mapPreview.removeAttribute("src");
            mapPlaceholder.hidden = false;
            status.textContent = "Trip memory saved.";
            await renderSavedTrips(list, emptyState);
        } catch (error) {
            console.error("Unable to save trip memory.", error);
            status.textContent = "Could not save this trip. Please check browser storage and try again.";
        } finally {
            submitButton.disabled = false;
        }
    }, { signal });

    list.addEventListener("click", async (event) => {
        const target = event.target instanceof Element ? event.target : null;
        const button = target?.closest('[data-action="delete-trip"]');
        const card = button?.closest(".trip-card");
        if (!button || !card) return;

        button.disabled = true;
        try {
            await runTripStoreRequest("readwrite", (store) =>
                store.delete(Number(card.dataset.tripId))
            );
            const photo = card.querySelector(".trip-card-photo");
            if (photo?.src.startsWith("blob:")) URL.revokeObjectURL(photo.src);
            card.remove();
            emptyState.hidden = list.childElementCount > 0;
        } catch (error) {
            console.error("Unable to delete trip memory.", error);
            button.disabled = false;
            status.textContent = "Could not delete this trip. Please try again.";
        }
    }, { signal });

    renderSavedTrips(list, emptyState).catch((error) => {
        console.error("Unable to load saved trip memories.", error);
        status.textContent = "Could not load saved trips. Please check browser storage.";
    });
};

document.addEventListener("site:pagechange", initializeTripMemories);
initializeTripMemories();
