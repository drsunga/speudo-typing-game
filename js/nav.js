const difficultyToggle = document.querySelector("#difficulty-toggle");
const difficultyPanel = document.querySelector("#game-difficulty");
const mechanicsToggle = document.querySelector("#mechanics-toggle");
const mechanicsPanel = document.querySelector("#game-mechanics-left");
const mechanicsClose = document.querySelector(".mechanics-close");

/* <------------PANEL OPEN / CLOSE------------> */

// Sets a single panel open/closed state and syncs its related ARIA attributes
const setPanel = (panel, toggle, open) => {
    // Add "is-open" class if open is true, remove it if false
    panel.classList.toggle("is-open", open);

    // If a toggle button was passed, tell it whether the panel it controls is expanded
    if (toggle) {
        toggle.setAttribute("aria-expanded", String(open));
    }

    // Only the mechanics panel needs manual aria-hidden management
    if (panel === mechanicsPanel) {
        // Hide from screen readers when closed, reveal when open
        panel.setAttribute("aria-hidden", String(!open));
    }
}

// Closes both panels at once, so only one panel can ever be open at a time
export const closeAllPanels = () => {
    setPanel(difficultyPanel, difficultyToggle, false);
    setPanel(mechanicsPanel, mechanicsToggle, false);
}

// Handles clicks on the difficulty toggle button
difficultyToggle.addEventListener("click", (event) => {
    // Prevent this click from bubbling up to the document listener below
    event.stopPropagation();

    // Determine open/close intent: opposite of the panel's current state
    const willOpen = !difficultyPanel.classList.contains("is-open");
    closeAllPanels();

    // Apply the correct open/closed state to the difficulty panel
    setPanel(difficultyPanel, difficultyToggle, willOpen);

    // If the panel just opened, move focus to the currently selected difficulty option
    if (willOpen) {
        const selected = difficultyPanel.querySelector(".difficulty-option.is-selected");
        if (selected) selected.focus();
    }
});

// Handles clicks on the mechanics toggle button
mechanicsToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const willOpen = !mechanicsPanel.classList.contains("is-open");
    closeAllPanels();

    // Apply the correct open/closed state to the mechanics panel
    setPanel(mechanicsPanel, mechanicsToggle, willOpen);
});

// Handles clicks on the mechanics panel's explicit close button
mechanicsClose.addEventListener("click", () => {
    // Force the mechanics panel closed
    setPanel(mechanicsPanel, mechanicsToggle, false);
    // Return keyboard focus to the toggle button so it isn't lost inside a hidden panel
    mechanicsToggle.focus();
});

// Global click listener: closes a panel if the click landed outside of it
document.addEventListener("click", (event) => {
    // If wasn't inside the difficulty panel, close it
    if (!difficultyPanel.contains(event.target)) {
        setPanel(difficultyPanel, difficultyToggle, false);
    }

    // If wasn't inside the mechanics panel, close it
    if (!mechanicsPanel.contains(event.target)) {
        setPanel(mechanicsPanel, mechanicsToggle, false);
    }
});

