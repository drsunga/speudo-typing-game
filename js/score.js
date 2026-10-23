const DIFFICULTY_STORAGE_KEY = "speudo-difficulty";

// Game State Function
const gameState = {
    difficulty: localStorage.getItem(DIFFICULTY_STORAGE_KEY) || "easy",
    streak: 0,
    score: 0
}

// Game Difficulty Multipliers
const gameDifficultyMultiplier = {
    easy: 1,
    medium: 2,
    hard: 3,
}

const setDifficulty = (level) => {
    gameState.difficulty = level;
    localStorage.setItem(DIFFICULTY_STORAGE_KEY, level);
}

// Function for score multiplier
const getStreakMultiplier = (streak) => {
    if (streak >= 6) return 3;
    if (streak >= 3) return 2;
    return 1;
}

// Record Correct Word
const recordCorrectWord = (word = "") => {
    // Update gameState streak
    gameState.streak += 1;

    // Base score and multipliers computation
    const basePoint = word.length > 0 ? word.length * 1 : 0;
    const baseDifficultyMultiplier = gameDifficultyMultiplier[gameState.difficulty] || 1;
    const baseStreakMultiplier = getStreakMultiplier(gameState.streak);

    // Current points computation
    const pointsEarned = Math.round(basePoint * baseDifficultyMultiplier * baseStreakMultiplier);
    
    // Update gameState score
    gameState.score += pointsEarned;

    return pointsEarned;
};

// Resetting streak when mistake
const recordMistake = () => {
    gameState.streak = 0;
};

// Resetting gameState when game resets
const resetGame = () => {
    gameState.streak = 0;
    gameState.score = 0;
};

export {getStreakMultiplier, setDifficulty, recordCorrectWord, recordMistake, resetGame, gameState};