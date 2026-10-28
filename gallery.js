const galleryPhotoSources = [
    "image_01 (1).jpg",
    "image_01 (112).jpg",
    "image_01 (128).jpg",
    "image_01 (13).jpg",
    "image_01 (133).jpg",
    "image_01 (137).jpg",
    "image_01 (138).jpg",
    "image_01 (139).jpg",
    "image_01 (14).jpg",
    "image_01 (17).jpg",
    "image_01 (18).jpg",
    "image_01 (19).jpg",
    "image_01 (20).jpg",
    "image_01 (22).jpg",
    "image_01 (24).jpg",
    "image_01 (26).JPG",
    "image_01 (27).JPG",
    "image_01 (29).JPG",
    "image_01 (3).jpg",
    "image_01 (32).JPG",
    "image_01 (4).jpg",
    "image_01 (41).JPG",
    "image_01 (46).JPG",
    "image_01 (47).JPG",
    "image_01 (5).jpg",
    "image_01 (52).JPG",
    "image_01 (53).JPG",
    "image_01 (55).JPG",
    "image_01 (6).jpg",
    "image_01 (60).jpg",
    "image_01 (61).jpg",
    "image_01 (65).jpg",
    "image_01 (66).jpg",
    "image_01 (67).jpg",
    "image_01 (68).jpg",
    "image_01 (7).jpg",
    "image_01 (70).jpg",
    "image_01 (71).jpg",
    "image_01 (73).jpg",
    "image_01 (76).jpg",
    "image_01 (77).jpg",
    "image_01 (78).jpg",
    "image_01 (80).jpg",
    "image_01 (81).jpg",
    "image_01 (83).jpg",
    "image_01 (87).jpg",
    "image_01 (88).jpg",
    "image_01 (95).jpg",
    "image_01 (96).jpg",
    "image_01 (98).jpg"
];

const galleryDatabaseName = "myweb-gallery";
const galleryStoreName = "uploaded-photos";
const galleryObjectUrls = new Set();
let galleryDatabasePromise;

const getShuffledGallerySources = () => {
    const sources = [...galleryPhotoSources];

    for (let index = sources.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [sources[index], sources[randomIndex]] = [sources[randomIndex], sources[index]];
    }

    return sources;
};

const openGalleryDatabase = () => {
    if (!window.indexedDB) {
        return Promise.reject(new Error("This browser does not support saving photos locally."));
    }

    if (!galleryDatabasePromise) {
        galleryDatabasePromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(galleryDatabaseName, 1);

            request.onupgradeneeded = () => {
                request.result.createObjectStore(galleryStoreName, {
                    keyPath: "id",
                    autoIncrement: true
                });
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("Unable to open the photo library."));
            request.onblocked = () => reject(new Error("The photo library is blocked by another open page."));
        });
    }

    return galleryDatabasePromise;
};

const getUploadedPhotos = async () => {
    const database = await openGalleryDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(galleryStoreName, "readonly");
        const request = transaction.objectStore(galleryStoreName).getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("Unable to load saved photos."));
        transaction.onerror = () => reject(transaction.error || new Error("Unable to load saved photos."));
    });
};

const saveUploadedPhotos = async (files) => {
    const database = await openGalleryDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(galleryStoreName, "readwrite");
        const store = transaction.objectStore(galleryStoreName);
        const records = files.map((file) => ({
            name: file.name,
            type: file.type,
            blob: file,
            addedAt: Date.now()
        }));

        records.forEach((record) => {
            const request = store.add(record);
            request.onsuccess = () => {
                record.id = request.result;
            };
        });

        transaction.oncomplete = () => resolve(records);
        transaction.onerror = () => reject(transaction.error || new Error("Unable to save selected photos."));
        transaction.onabort = () => reject(transaction.error || new Error("Saving selected photos was canceled."));
    });
};

const updateGalleryPhotoCount = (gallery, photoCount) => {
    const total = Number(gallery.dataset.staticCount) + Number(gallery.dataset.uploadCount);
    photoCount.textContent = `${total} photos · scroll down to browse`;
};

const appendUploadedPhoto = (gallery, record) => {
    const card = document.createElement("figure");
    const image = document.createElement("img");
    const objectUrl = URL.createObjectURL(record.blob);

    galleryObjectUrls.add(objectUrl);
    card.className = "pinterest-card";
    image.src = objectUrl;
    image.alt = record.name;
    image.loading = "lazy";
    image.decoding = "async";
    card.append(image);
    gallery.prepend(card);
};

const initializeGallery = async () => {
    const gallery = document.querySelector("#pinterest-gallery");
    const photoCount = document.querySelector("#gallery-photo-count");
    const photoInput = document.querySelector("#gallery-photo-input");
    const uploadStatus = document.querySelector("#gallery-upload-status");
    if (
        !gallery ||
        !photoCount ||
        !photoInput ||
        !uploadStatus ||
        gallery.dataset.loaded === "true"
    ) return;

    const shuffledSources = getShuffledGallerySources();
    gallery.dataset.staticCount = String(shuffledSources.length);
    gallery.dataset.uploadCount = "0";
    updateGalleryPhotoCount(gallery, photoCount);

    shuffledSources.forEach((fileName, index) => {
        const card = document.createElement("figure");
        const image = document.createElement("img");
        const photoNumber = index + 1;

        card.className = "pinterest-card";
        image.src = `scr/images/Gallery/${encodeURIComponent(fileName)}`;
        image.alt = `Gallery photo ${photoNumber}`;
        image.loading = "lazy";
        image.decoding = "async";
        image.addEventListener("error", () => {
            card.remove();
            gallery.dataset.staticCount = String(
                Math.max(0, Number(gallery.dataset.staticCount) - 1)
            );
            updateGalleryPhotoCount(gallery, photoCount);
        }, { once: true });

        card.append(image);
        gallery.append(card);
    });

    gallery.dataset.loaded = "true";

    photoInput.addEventListener("change", async () => {
        const selectedFiles = Array.from(photoInput.files || []);
        photoInput.value = "";
        if (selectedFiles.length === 0) return;

        const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/"));
        const rejectedCount = selectedFiles.length - imageFiles.length;
        if (imageFiles.length === 0) {
            uploadStatus.textContent = "Please choose image files.";
            return;
        }

        uploadStatus.textContent = "Saving photos...";

        try {
            const savedPhotos = await saveUploadedPhotos(imageFiles);
            if (!gallery.isConnected) return;

            savedPhotos.slice().reverse().forEach((photo) => appendUploadedPhoto(gallery, photo));
            gallery.dataset.uploadCount = String(
                Number(gallery.dataset.uploadCount) + imageFiles.length
            );
            updateGalleryPhotoCount(gallery, photoCount);

            const rejectionMessage = rejectedCount > 0
                ? ` ${rejectedCount} unsupported file(s) skipped.`
                : "";
            uploadStatus.textContent = `${imageFiles.length} photo(s) added.${rejectionMessage}`;
        } catch (error) {
            console.error("Unable to save gallery photos.", error);
            uploadStatus.textContent = `Unable to save photos: ${error.message}`;
        }
    });

    try {
        const savedPhotos = await getUploadedPhotos();
        if (!gallery.isConnected) return;
        savedPhotos
            .slice()
            .reverse()
            .forEach((photo) => appendUploadedPhoto(gallery, photo));
        gallery.dataset.uploadCount = String(savedPhotos.length);
        updateGalleryPhotoCount(gallery, photoCount);
    } catch (error) {
        console.error("Unable to load saved gallery photos.", error);
        uploadStatus.textContent = `Unable to load saved photos: ${error.message}`;
    }
};

document.addEventListener("site:pagechange", () => {
    galleryObjectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    galleryObjectUrls.clear();
    initializeGallery();
});
initializeGallery();
