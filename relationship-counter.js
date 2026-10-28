let durationInterval;

const initializeRelationshipCounter = () => {
    window.clearInterval(durationInterval);

    const counter = document.querySelector(".relationship-counter");
    if (!counter) return;

    const startDateValue = counter.dataset.startDate;
    const dateParts = startDateValue?.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!dateParts) {
        throw new Error("Invalid relationship start date. Expected YYYY-MM-DD.");
    }

    const [, yearText, monthText, dayText] = dateParts;
    const startDate = new Date(
        Number(yearText),
        Number(monthText) - 1,
        Number(dayText)
    );

    if (
        startDate.getFullYear() !== Number(yearText) ||
        startDate.getMonth() !== Number(monthText) - 1 ||
        startDate.getDate() !== Number(dayText)
    ) {
        throw new Error("Invalid relationship start date.");
    }

    const updateDuration = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate > today) {
            throw new Error("Relationship start date cannot be in the future.");
        }

        let years = today.getFullYear() - startDate.getFullYear();
        let months = today.getMonth() - startDate.getMonth();
        let days = today.getDate() - startDate.getDate();

        if (days < 0) {
            months -= 1;
            days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        }

        if (months < 0) {
            years -= 1;
            months += 12;
        }

        counter.querySelector('[data-duration="years"]').textContent = years;
        counter.querySelector('[data-duration="months"]').textContent = months;
        counter.querySelector('[data-duration="days"]').textContent = days;
    };

    updateDuration();
    durationInterval = window.setInterval(updateDuration, 60_000);
};

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        initializeRelationshipCounter();
    }
});

document.addEventListener("site:pagechange", initializeRelationshipCounter);
initializeRelationshipCounter();
