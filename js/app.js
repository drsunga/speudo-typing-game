import {
    SIKYORD_API_KEY,
    SIKYORD_DB_ENDPOINT,
    SIKYORD_AI_ENDPOINT,
    GROQ_AI_ENDPOINT,
    EASY_DB_ENDPOINT,
    MEDIUM_DB_ENDPOINT,
    HARD_DB_ENDPOINT
} from "../configs.js";

import { 
    getStreakMultiplier,
    setDifficulty,
    recordCorrectWord,
    recordMistake,
    resetGame,
    gameState
} from "./score.js";

import { closeAllPanels } from "./nav.js";
import { GameClock } from "./timer.js";

const gameDifficulty = {
    easy: EASY_DB_ENDPOINT,
    medium: MEDIUM_DB_ENDPOINT,
    hard: HARD_DB_ENDPOINT
}


/* <------------FETCHING API DB------------> */


class ApiClient {
    constructor({sikyordApiKey,  dbEndpoint, aiEndpoint }) {
        this.sikyordApiKey = sikyordApiKey
        this.dbEndpoint = dbEndpoint;
        this.aiEndpoint = aiEndpoint;
    }

    // Accessing testapi key in sikyord
    async dbKey() {
        try {
            const response = await fetch(this.dbEndpoint, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.sikyordApiKey}`
                },
            });
            const result = await response.json();
            return result.data

        } catch (error) {
            console.error(error);
            throw new Error ("Fetching dbKey Failed: ", error);
        }
    }

    // Accessing groq api key in sikyord
    async aiKey() {
        try {
            const response = await fetch(this.aiEndpoint, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.sikyordApiKey}`
                },
            });
            const result = await response.json();
            return result.data;

        } catch (error) {
            console.error(error);
            throw new Error ("Fetching aiKey failed: ", error);
        }
    }

    // Fetching records in testapi key depending on the difficulty
    async fetchRecords(endpoint) {
        try {
            const recordsKey = await this.dbKey();
            const response = await fetch(endpoint, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${recordsKey}`
                },
            });
            const result = await response.json();
            return result.data;

        } catch (error) {
            console.error(error)
            throw new Error ("Fetching records failed: ", error);
        }
    };
}


/* <-----------ACCESSING API DB------------> */


class WordQueue {
    constructor ({apiClient, difficultyEndpoint, inputSelector }) {
        this.apiClient = apiClient;
        this.difficultyEndpoint = difficultyEndpoint;
        this.inputWord = document.querySelector(inputSelector);
        this.words = [];
        this.remaining = [];
        this.isLocked = true;
        
        // Global event listener so player cannot enter the word without
        // game start
        this.inputWord.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && !this.isLocked) {
                this.shiftWordPosition();
            }
        });
    };

    // Fetch all records in db depending on the difficulty
    async fetchAllRecords() {
        const allRecords = await this.apiClient.fetchRecords(this.difficultyEndpoint);
        const arrayWords = allRecords.map(entry => entry.data.word);
        
        return arrayWords;
    };

    // Return random words picked on the records
    getRandomWords(words, count = 3) {
        // contains all words
        const wordsPool = [...words];
        const totalWords = wordsPool.length;
        // contains picked words from wordsPool
        const picked = [];

        // Picked 3 random words and remove them from the array
        for (let i=0; i < count && totalWords > 0; i++){
            const randomIndex = Math.floor(Math.random() * totalWords);
            picked.push(wordsPool[randomIndex]);
            wordsPool.splice(randomIndex, 1);
        }

        return {
            picked,
            wordsPool
        }
    }

    // Fetching the 3 random words in picked and
    // the remaining words in the database
    async getThreeRandomWords() {
        const allWords = await this.fetchAllRecords();
        const {picked, wordsPool} = this.getRandomWords(allWords, 3);

        return {
            picked, 
            wordsPool
        };
    }

    // Rendering words in the in each slot for the game
    renderWords() {
        const wordsRoleSlot = ["#main-word", "#next-word", "#last-word"];
        wordsRoleSlot.forEach((id, i) => {
            document.querySelector(id).innerText = this.words[i].toUpperCase(); 
        });
    }

    // Assigning each word to be displayed in games UI
    async assignWordsRole() {
        const blinkingCursor = document.querySelector("#main-word");
        const {picked, wordsPool} = await this.getThreeRandomWords();
        this.words = picked;
        this.remaining = wordsPool;

        if (picked.length < 3) {
            throw new Error ("Incomplete random words:", picked);
        };

        this.renderWords();
        // Removes the blinking cursor upon the game start
        blinkingCursor.classList.remove("is-idle");

        return {
            picked, 
            wordsPool
        };
    }

    // HUD values
    updateHUD() {
        document.querySelector("#hud-score-value").innerText = gameState.score;
        document.querySelector("#hud-streak-value").innerText = gameState.streak;
        document.querySelector("#hud-multiplier-value").innerText = `x${getStreakMultiplier(gameState.streak)}`;
    }

    // Shifting word position if correctly typed
    async shiftWordPosition() {
        const typedValue = this.inputWord.value.trim().toUpperCase();
        
        if (typedValue === this.words[0].toUpperCase()) {
            const nextWord = this.remaining.shift();
            recordCorrectWord(this.words[0]);
            this.words.shift();
            this.words.push(nextWord);
            this.renderWords();
            this.updateHUD();
            this.inputWord.value = "";
        } else {
            recordMistake();
            this.updateHUD();
            this.inputWord.value = "";
        }
    }

}

// Calling ApiClient Class
const apiClient = new ApiClient({
    sikyordApiKey: SIKYORD_API_KEY,
    dbEndpoint: SIKYORD_DB_ENDPOINT,
    aiEndpoint: SIKYORD_AI_ENDPOINT
});

// Calling the game
const gameWordQueue = new WordQueue({
    apiClient,
    difficultyEndpoint: HARD_DB_ENDPOINT,
    inputSelector: ".input-typed-word"
});


/* <-----------AUDIO BACKGROUND------------> */


const audioBtn = document.querySelector("#audio-toggle");
const audioIcon = document.querySelector("#mute-icon");
const playTerrariaOST = document.querySelector("#terraria-ost");

// Upon clicking the volume icon
// Music can start and stop playing
audioBtn.addEventListener("click", () => {
    
    if (playTerrariaOST.muted) {
        playTerrariaOST.muted = false;
        playTerrariaOST.play();

        audioIcon.classList.remove('fa-volume-xmark');
        audioIcon.classList.add('fa-volume-high');
    } else {
        playTerrariaOST.muted = true;

        audioIcon.classList.remove('fa-volume-high');
        audioIcon.classList.add('fa-volume-xmark');
    }
})


/* <-----------HUD BACKGROUND UPDATE------------> */


const gameoverOverlay = document.querySelector("#gameover-overlay");
const gameoverScore = document.querySelector("#gameover-score");
const playAgainBtn = document.querySelector("#play-again-btn");
const navRetryBtn = document.querySelector("#nav-retry-btn");

// Converts minutes to total seconds
const parseTimeToSeconds = (timeStr) => {
    const [min, sec] = timeStr.split(":").map(Number);
    return min * 60 + sec;
}

// Resets game and hud upon new round
const startNewRound = () => {
    gameoverOverlay.classList.remove("is-open");
    resetGame();
    gameWordQueue.updateHUD();
    gameWordQueue.assignWordsRole().then(() => {
        gameClock.preGameCountdown(gameClock.lastDuration || 60);
    });
}

// Call GameClock class
const gameClock = new GameClock ({
    wordQueue: gameWordQueue,
    overlaySelector: "#countdown-overlay",
    overlayValueSelector: "#countdown-value",
    hudTimerSelector: "#hud-timer-value",
    onGameOver: () => {
        gameoverScore.innerText = gameState.score;
        gameoverOverlay.classList.add("is-open");
    }
});

// Play again button after timer ends
playAgainBtn.addEventListener("click", startNewRound);

// Retry button to start another round
navRetryBtn.addEventListener("click", (event) => {
    event.preventDefault();
    startNewRound();
})


/* <-----------NAVIGATION WIRING------------> */


const clickPlay = document.querySelector("#difficulty-default");
const clickDifficulty = document.querySelectorAll(".difficulty-option");
const replaceHudDifficultyValue = document.querySelector("#hud-difficulty-value");

// Navigation of play button when click will set difficulty to default (Easy)
clickPlay.addEventListener('click', () => {
    const defaultEndpoint = gameDifficulty[clickPlay.dataset.difficulty];
    const toUpperCaseLetter = clickPlay.dataset.difficulty.charAt(0).toUpperCase();
    const concatDiffTitle = toUpperCaseLetter + clickPlay.dataset.difficulty.slice(1);
    
    setDifficulty(clickPlay.dataset.difficulty);
    replaceHudDifficultyValue.innerText = concatDiffTitle;
    gameWordQueue.difficultyEndpoint = defaultEndpoint;

    resetGame();
    gameWordQueue.updateHUD();

    gameWordQueue.assignWordsRole().then(() => {
        gameClock.preGameCountdown(60);
    });
});

// Navigation that points difficulty to the correct API endpoint
clickDifficulty.forEach( btn => {
    btn.addEventListener('click', () => {
        const newEndpoint = gameDifficulty[btn.dataset.difficulty];
        const getDifficultyValue = btn.dataset.difficulty;
        const toUpperCaseFirstLetter = getDifficultyValue.charAt(0).toUpperCase();
        const concatDifficultyTitle = toUpperCaseFirstLetter + getDifficultyValue.slice(1);

        setDifficulty(btn.dataset.difficulty);
        replaceHudDifficultyValue.innerText = concatDifficultyTitle;
        gameWordQueue.difficultyEndpoint = newEndpoint;
        closeAllPanels();

        resetGame();
        gameWordQueue.updateHUD();

        gameWordQueue.assignWordsRole().then(() => {
            gameClock.preGameCountdown(parseTimeToSeconds(btn.dataset.time));
        });
    });
});

// Global event listener for keyboard
// added so players can start typing
// without needing to click the input box
document.addEventListener('keydown', (event) => {
  const inputElement = document.querySelector('.input-typed-word');

  if (!event.ctrlKey && !event.altKey && !event.metaKey) {
    inputElement.focus();
  }
});

// Close pop-up button upon click
const gameoverClose = document.querySelector(".gameover-close");

gameoverClose.addEventListener("click", () => {
    gameoverOverlay.classList.remove("is-open");
});
