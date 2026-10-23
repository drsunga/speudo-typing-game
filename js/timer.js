export class GameClock {
    constructor({ wordQueue, overlaySelector, overlayValueSelector, hudTimerSelector, onGameOver }){
        this.wordQueue = wordQueue;
        this.overlaySelector = document.querySelector(overlaySelector);
        this.overlayValueSelector = document.querySelector(overlayValueSelector);
        this.hudTimerSelector = document.querySelector(hudTimerSelector);
        this.onGameOver = onGameOver;
        this.lastDuration = null;
        this.countdownIntervalId = null;
        this.gameIntervalId = null;
    }

    preGameCountdown(duration) {
        if (this.countdownIntervalId) clearInterval(this.countdownIntervalId);
        if (this.gameIntervalId) clearInterval(this.gameIntervalId);

        this.lastDuration = duration;
        this.wordQueue.isLocked = true;
        this.overlaySelector.classList.add("is-open");

        let count = 3;
        this.overlayValueSelector.innerText = count;

        this.countdownIntervalId = setInterval(() => {
            count -= 1;

            if (count > 0) {
                this.overlayValueSelector.innerText = count;
            } else {
                clearInterval(this.countdownIntervalId);
                this.overlaySelector.classList.remove("is-open");
                this.wordQueue.isLocked = false;
                this.startGameTimer(duration);
            }
        }, 1000);
    }

    startGameTimer(duration) {
        if (this.gameIntervalId) clearInterval(this.gameIntervalId);

        let remaining = duration;
        this.renderTime(remaining);

        this.gameIntervalId = setInterval(() => {
            remaining -= 1;
            this.renderTime(remaining);

            if (remaining <= 0) {
                clearInterval(this.gameIntervalId);
                this.wordQueue.isLocked = true;
                if (this.onGameOver) this.onGameOver();
            }
        }, 1000);
    }

    renderTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = String(totalSeconds % 60).padStart(2,"0");
        this.hudTimerSelector.innerText = `${minutes}:${seconds}`;
    }
}