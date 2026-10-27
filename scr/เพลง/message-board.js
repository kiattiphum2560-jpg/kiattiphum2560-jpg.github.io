(() => {
    const storageKey = "message-page-notes-v1";
    const form = document.getElementById("message-form");
    const titleInput = document.getElementById("message-title-input");
    const input = document.getElementById("message-input");
    const notes = document.querySelector(".love-notes");
    const status = document.getElementById("message-status");

    if (!form || !(titleInput instanceof HTMLInputElement) || !(input instanceof HTMLTextAreaElement) || !notes || !status) {
        return;
    }

    let savedMessages = [];
    const legacyTitle = "ข้อความที่เพิ่ม";

    const setStatus = (message) => {
        status.textContent = message;
    };

    const renderMessage = ({ title: messageTitle, message }, number) => {
        const note = document.createElement("details");
        note.className = "love-note";
        note.open = true;

        const summary = document.createElement("summary");
        const noteNumber = document.createElement("span");
        noteNumber.className = "love-note-number";
        noteNumber.textContent = `+${number}`;

        const title = document.createElement("span");
        title.className = "love-note-title";
        title.textContent = messageTitle;
        summary.append(noteNumber, title);

        const content = document.createElement("div");
        content.className = "love-note-content";
        const paragraph = document.createElement("p");
        paragraph.textContent = message;
        content.append(paragraph);
        note.append(summary, content);
        notes.append(note);
    };

    try {
        const storedValue = localStorage.getItem(storageKey);
        if (storedValue) {
            const parsedMessages = JSON.parse(storedValue);
            if (!Array.isArray(parsedMessages)) {
                throw new Error("Saved messages have an invalid format.");
            }

            savedMessages = parsedMessages.map((entry) => {
                if (typeof entry === "string") {
                    return { title: legacyTitle, message: entry };
                }
                if (entry && typeof entry.title === "string" && typeof entry.message === "string") {
                    return { title: entry.title, message: entry.message };
                }
                throw new Error("Saved messages have an invalid format.");
            });
            savedMessages.forEach((message, index) => renderMessage(message, index + 1));
        }
    } catch (error) {
        setStatus("ไม่สามารถโหลดข้อความที่บันทึกไว้ได้ กรุณาตรวจสอบการตั้งค่าเบราว์เซอร์");
        console.error("Unable to load saved messages:", error);
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const title = titleInput.value.trim();
        const message = input.value.trim();

        if (!title) {
            setStatus("กรุณาใส่หัวข้อก่อนเพิ่ม");
            titleInput.focus();
            return;
        }

        if (!message) {
            setStatus("กรุณาพิมพ์ข้อความก่อนเพิ่ม");
            input.focus();
            return;
        }

        const newMessage = { title, message };
        const updatedMessages = [...savedMessages, newMessage];
        try {
            localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
        } catch (error) {
            setStatus("บันทึกข้อความไม่สำเร็จ กรุณาตรวจสอบพื้นที่จัดเก็บของเบราว์เซอร์");
            console.error("Unable to save message:", error);
            return;
        }

        savedMessages = updatedMessages;
        renderMessage(newMessage, savedMessages.length);
        form.reset();
        setStatus("เพิ่มข้อความเรียบร้อยแล้ว 💜");
    });
})();
