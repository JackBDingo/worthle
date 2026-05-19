const SEED_WORDS = [
  "cabin", "apple", "brave", "dream", "focus", "light", "money", "worth",
  "value", "penny", "score", "daily", "climb", "quick", "trade", "graph",
  "maker", "field", "craft", "pilot", "forge", "stack", "logic", "tempo",
  "cents", "prize", "vault", "spark", "north", "plain", "river", "solar",
  "grain", "flint", "crown", "shift", "solid", "magic", "trace", "index",
  "model", "agent", "human", "build", "clean", "sharp", "stone", "metal",
  "paper", "novel", "pixel", "press", "route", "sound", "watch", "learn",
  "scale", "voice", "trial", "quest", "frame", "level", "point", "token",
  "anchor", "budget", "signal", "market", "silver", "rocket", "bridge",
  "garden", "honest", "motion", "parcel", "stream", "window", "yellow"
];

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const START_DATE = Date.UTC(2026, 0, 1);
const MS_PER_DAY = 86400000;
const DAILY_GOAL_WORDS = 10;
const CATEGORY_GOAL_WORDS = 5;
const MAX_DEFINITION_HINTS = 5;
const EMOJI_MAX_GUESSES = 6;
const SETTINGS_KEY = "worthle-settings";
const MODES = {
  classic: {
    label: "Classic",
    description: "Fixed A=1 through Z=26 pricing."
  },
  market: {
    label: "Market",
    description: "Daily all-letter pricing."
  },
  definition: {
    label: "Definition",
    description: "Solve from a daily meaning clue."
  },
  category: {
    label: "Category",
    description: "Bank words from a daily theme."
  },
  emoji: {
    label: "Emoji",
    description: "Guess the 5-letter word from emojis."
  }
};

const DEFINITION_PUZZLES = [
  { word: "precise", clue: "careful, exact, and accurate" },
  { word: "refine", clue: "to improve by making small, careful changes" },
  { word: "vivid", clue: "clear, bright, and easy to imagine" },
  { word: "scarce", clue: "hard to find because there is not much available" },
  { word: "sturdy", clue: "strongly built and not easily damaged" },
  { word: "brisk", clue: "quick, active, and energetic" },
  { word: "humble", clue: "not acting as if you are more important than others" },
  { word: "curious", clue: "eager to learn or know more" },
  { word: "fragile", clue: "easily broken or damaged" },
  { word: "candid", clue: "honest and direct, even when the truth is uncomfortable" },
  { word: "nimble", clue: "quick and light in movement or thought" },
  { word: "serene", clue: "calm, peaceful, and untroubled" },
  { word: "modest", clue: "not showy or boastful" },
  { word: "urgent", clue: "needing immediate attention" },
  { word: "lavish", clue: "rich, generous, or more than enough" },
  { word: "clever", clue: "quick to understand or invent solutions" }
];

const CATEGORY_PUZZLES = [
  {
    category: "weather",
    words: ["storm", "cloud", "rain", "snow", "wind", "frost", "humid", "sunny", "thunder", "breeze"]
  },
  {
    category: "kitchen",
    words: ["spoon", "knife", "plate", "bowl", "stove", "oven", "whisk", "pantry", "kettle", "simmer"]
  },
  {
    category: "movement",
    words: ["walk", "run", "crawl", "leap", "glide", "slide", "sprint", "wander", "climb", "drift"]
  },
  {
    category: "emotion",
    words: ["happy", "angry", "calm", "glad", "grief", "worry", "delight", "envy", "joyful", "lonely"]
  },
  {
    category: "tools",
    words: ["hammer", "saw", "drill", "level", "pliers", "wrench", "chisel", "clamp", "sander", "file"]
  },
  {
    category: "nature",
    words: ["river", "stone", "forest", "meadow", "flower", "branch", "valley", "moss", "ocean", "summit"]
  },
  {
    category: "music",
    words: ["piano", "drum", "violin", "guitar", "rhythm", "melody", "chorus", "tempo", "harmony", "lyric"]
  },
  {
    category: "money",
    words: ["coin", "cash", "price", "value", "budget", "profit", "market", "wallet", "dollar", "credit"]
  }
];

const EMOJI_PUZZLES = [
  { word: "beach", emoji: "🏖️🌊☀️" },
  { word: "brain", emoji: "🧠💭⚡" },
  { word: "bread", emoji: "🍞🌾🔥" },
  { word: "crown", emoji: "👑🤴✨" },
  { word: "dance", emoji: "💃🕺🎵" },
  { word: "dream", emoji: "😴💭🌙" },
  { word: "flame", emoji: "🔥🪵✨" },
  { word: "ghost", emoji: "👻🌫️🏚️" },
  { word: "heart", emoji: "❤️💓🫀" },
  { word: "horse", emoji: "🐴🏇🌾" },
  { word: "lemon", emoji: "🍋🟡😖" },
  { word: "magic", emoji: "🪄✨🎩" },
  { word: "music", emoji: "🎵🎧🎹" },
  { word: "ocean", emoji: "🌊🐚🐟" },
  { word: "plant", emoji: "🌱🪴☀️" },
  { word: "robot", emoji: "🤖⚙️🔋" },
  { word: "sheep", emoji: "🐑🧶🌾" },
  { word: "snake", emoji: "🐍🌿⚠️" },
  { word: "spoon", emoji: "🥄🍲🍽️" },
  { word: "storm", emoji: "⛈️🌧️⚡" },
  { word: "tiger", emoji: "🐅🌿👁️" },
  { word: "watch", emoji: "⌚⏱️👀" }
];

const form = document.querySelector("#wordForm");
const input = document.querySelector("#wordInput");
const message = document.querySelector("#message");
const targetValue = document.querySelector("#targetValue");
const foundCount = document.querySelector("#foundCount");
const scoreValue = document.querySelector("#scoreValue");
const goalCurrent = document.querySelector("#goalCurrent");
const goalTarget = document.querySelector("#goalTarget");
const goalHeadingLabel = document.querySelector(".goal-heading .label");
const goalProgressFill = document.querySelector("#goalProgressFill");
const goalWords = document.querySelector("#goalWords");
const goalStatus = document.querySelector("#goalStatus");
const puzzleNumber = document.querySelector("#puzzleNumber");
const cluePanel = document.querySelector("#cluePanel");
const clueLabel = document.querySelector("#clueLabel");
const clueText = document.querySelector("#clueText");
const hintControls = document.querySelector("#hintControls");
const hintButton = document.querySelector("#hintButton");
const hintCount = document.querySelector("#hintCount");
const hintList = document.querySelector("#hintList");
const currentWord = document.querySelector("#currentWord");
const currentValue = document.querySelector("#currentValue");
const currentDelta = document.querySelector("#currentDelta");
const meter = document.querySelector(".meter");
const foundWords = document.querySelector("#foundWords");
const foundWordsTitle = document.querySelector(".panel-heading h2");
const emptyStateEl = document.querySelector("#emptyState");
const attemptCount = document.querySelector("#attemptCount");
const submitButton = document.querySelector("#wordForm .text-button.primary");
const shareButton = document.querySelector("#shareButton");
const resetButton = document.querySelector("#resetButton");
const settingsButton = document.querySelector("#settingsButton");
const statsButton = document.querySelector("#statsButton");
const statsDialog = document.querySelector("#statsDialog");
const settingsDialog = document.querySelector("#settingsDialog");
const valuesButton = document.querySelector("#valuesButton");
const valuesDialog = document.querySelector("#valuesDialog");
const valueGrid = document.querySelector("#valueGrid");
const keyboard = document.querySelector("#keyboard");
const winDialog = document.querySelector("#winDialog");
const winScore = document.querySelector("#winScore");
const winMeta = document.querySelector("#winMeta");
const winShareButton = document.querySelector("#winShareButton");

let puzzle;
let state;
let settings;
let letterValues = {};
let dictionary = new Set();
let dictionaryReady = false;
let dictionaryFailed = false;
let resetFromUrl = false;

function letterValue(letter) {
  return letterValues[letter.toLowerCase()] || 0;
}

function wordValue(word) {
  return [...word.toLowerCase()].reduce((sum, letter) => sum + letterValue(letter), 0);
}

function cents(value) {
  return "$" + (value / 100).toFixed(2);
}

function money(value) {
  return "$" + (value / 100).toFixed(2);
}

function currentScore() {
  return state.found.reduce((sum, word) => sum + wordValue(word), 0);
}

function isGoalReached() {
  if (settings.mode === "emoji") return state.found.includes(puzzle.answer);
  if (settings.mode === "category") return state.found.length >= CATEGORY_GOAL_WORDS;
  if (settings.mode === "definition") return state.found.includes(puzzle.answer);
  return currentScore() >= puzzle.goal;
}

function isGameOver() {
  return settings.mode === "emoji" && !isGoalReached() && state.attempts >= EMOJI_MAX_GUESSES;
}

function normalizeWord(value) {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

function clearWorthleStorage() {
  Object.keys(localStorage)
    .filter((key) => key.startsWith("worthle-hunt-"))
    .forEach((key) => localStorage.removeItem(key));
}

function loadSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    return {
      mode: MODES[parsed.mode] ? parsed.mode : "classic"
    };
  } catch {
    return { mode: "classic" };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function hashSeed(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return function random() {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function buildClassicValues() {
  return Object.fromEntries([...ALPHABET].map((letter, index) => [letter, index + 1]));
}

function buildMarketValues(dateKey) {
  const random = seededRandom(hashSeed("worthle-market-" + dateKey));
  return Object.fromEntries(
    [...ALPHABET].map((letter) => [letter, 1 + Math.floor(random() * 26)])
  );
}

function buildLetterValues(dateKey) {
  letterValues = settings.mode === "market" ? buildMarketValues(dateKey) : buildClassicValues();
}

function modeIndex(dayIndex, mode, length) {
  const seed = hashSeed(mode + "-" + dayIndex);
  return seed % length;
}

function consumeResetParam() {
  const url = new URL(window.location.href);
  const resetValue = url.searchParams.get("reset");
  if (!resetValue || resetValue === "0" || resetValue === "false") return false;

  clearWorthleStorage();
  url.searchParams.delete("reset");
  window.history.replaceState({}, "", url);
  return true;
}

async function loadDictionary() {
  dictionaryReady = false;
  dictionaryFailed = false;

  try {
    const response = await fetch("./assets/dictionary.txt", { cache: "no-store" });
    if (!response.ok) throw new Error("Dictionary unavailable");
    const text = await response.text();
    const words = text.split(/\r?\n/).filter(Boolean);
    if (words.length < 1000) throw new Error("Dictionary too small");
    dictionary = new Set(words);
    dictionaryReady = true;
  } catch {
    dictionary = new Set();
    dictionaryFailed = true;
    setMessage("Dictionary could not load. Refresh with ?reset=1.");
  }
}

function getPuzzle() {
  const today = new Date();
  const localMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayIndex = Math.floor((localMidnight.getTime() - START_DATE) / MS_PER_DAY);
  const seed = SEED_WORDS[((dayIndex % SEED_WORDS.length) + SEED_WORDS.length) % SEED_WORDS.length];
  const dateKey = localMidnight.toISOString().slice(0, 10);
  buildLetterValues(dateKey);

  if (settings.mode === "definition") {
    const entry = DEFINITION_PUZZLES[modeIndex(dayIndex, "definition", DEFINITION_PUZZLES.length)];
    return {
      id: dayIndex + 1,
      dateKey,
      target: wordValue(entry.word),
      goal: wordValue(entry.word),
      answer: entry.word,
      promptLabel: "Definition",
      prompt: "Find a word meaning " + entry.clue + ".",
      goalWords: 1
    };
  }

  if (settings.mode === "category") {
    const entry = CATEGORY_PUZZLES[modeIndex(dayIndex, "category", CATEGORY_PUZZLES.length)];
    return {
      id: dayIndex + 1,
      dateKey,
      target: null,
      goal: CATEGORY_GOAL_WORDS,
      category: entry.category,
      allowedWords: entry.words,
      promptLabel: "Category",
      prompt: "Bank " + CATEGORY_GOAL_WORDS + " words related to " + entry.category + ".",
      goalWords: CATEGORY_GOAL_WORDS
    };
  }

  if (settings.mode === "emoji") {
    const entry = EMOJI_PUZZLES[modeIndex(dayIndex, "emoji", EMOJI_PUZZLES.length)];
    return {
      id: dayIndex + 1,
      dateKey,
      target: null,
      goal: 1,
      answer: entry.word,
      emoji: entry.emoji,
      promptLabel: "Emoji",
      prompt: entry.emoji,
      goalWords: 1
    };
  }

  return {
    id: dayIndex + 1,
    dateKey,
    target: wordValue(seed),
    goal: wordValue(seed) * DAILY_GOAL_WORDS,
    goalWords: DAILY_GOAL_WORDS
  };
}

function emptyState() {
  return {
    found: [],
    attempts: 0,
    lastValue: 0,
    hintsUsed: 0,
    guesses: [],
    completedAt: "",
    congratsSeen: false
  };
}

function stateKey() {
  return "worthle-hunt-" + puzzle.dateKey + "-" + settings.mode;
}

function loadState() {
  const raw =
    localStorage.getItem(stateKey()) ||
    (settings.mode === "classic" ? localStorage.getItem("worthle-hunt-" + puzzle.dateKey) : null);
  if (!raw) return emptyState();

  try {
    const parsed = JSON.parse(raw);
    return { ...emptyState(), ...parsed };
  } catch {
    return emptyState();
  }
}

function saveState() {
  localStorage.setItem(stateKey(), JSON.stringify(state));
}

function loadStats() {
  try {
    return {
      days: 0,
      total: 0,
      money: 0,
      streak: 0,
      best: 0,
      lastScoredDate: "",
      ...JSON.parse(localStorage.getItem("worthle-hunt-stats") || "{}")
    };
  } catch {
    return { days: 0, total: 0, money: 0, streak: 0, best: 0, lastScoredDate: "" };
  }
}

function saveStats(stats) {
  localStorage.setItem("worthle-hunt-stats", JSON.stringify(stats));
}

function yesterdayKey(dateKey) {
  const date = new Date(dateKey + "T00:00:00");
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function recordFirstFind() {
  const stats = loadStats();
  if (stats.lastScoredDate === puzzle.dateKey) return;

  stats.days += 1;
  stats.streak = stats.lastScoredDate === yesterdayKey(puzzle.dateKey) ? stats.streak + 1 : 1;
  stats.lastScoredDate = puzzle.dateKey;
  saveStats(stats);
}

function recordFoundWord() {
  const stats = loadStats();
  stats.total += 1;
  if (settings.mode !== "emoji") stats.money += state.lastValue;
  stats.best = Math.max(stats.best, state.found.length);
  saveStats(stats);
}

function renderStats() {
  const stats = loadStats();
  document.querySelector("#playedStat").textContent = stats.days;
  document.querySelector("#totalStat").textContent = stats.total;
  document.querySelector("#moneyStat").textContent = money(stats.money);
  document.querySelector("#streakStat").textContent = stats.streak;
  document.querySelector("#bestStat").textContent = stats.best;
}

function renderGoal() {
  const score = currentScore();
  const targetCount = puzzle.goalWords || DAILY_GOAL_WORDS;
  const progress =
    settings.mode === "emoji"
      ? Math.min(100, Math.round((state.attempts / EMOJI_MAX_GUESSES) * 100))
      : settings.mode === "category"
        ? Math.min(100, Math.round((state.found.length / targetCount) * 100))
        : Math.min(100, Math.round((score / puzzle.goal) * 100));

  if (settings.mode === "emoji") {
    goalCurrent.textContent = state.attempts + " guesses";
    goalTarget.textContent = EMOJI_MAX_GUESSES + " max";
    goalProgressFill.style.width = progress + "%";
    goalWords.textContent = isGoalReached() ? "Solved" : state.attempts + " / " + EMOJI_MAX_GUESSES + " guesses";
    goalStatus.textContent = isGoalReached() ? "Emoji solved" : isGameOver() ? "Out of guesses" : (EMOJI_MAX_GUESSES - state.attempts) + " guesses left";
    return;
  }

  const bankProgress =
    settings.mode === "category"
      ? Math.min(100, Math.round((state.found.length / targetCount) * 100))
      : Math.min(100, Math.round((score / puzzle.goal) * 100));

  goalCurrent.textContent = money(score);
  goalTarget.textContent = settings.mode === "category" ? targetCount + " words" : money(puzzle.goal);
  goalProgressFill.style.width = bankProgress + "%";
  goalWords.textContent = state.found.length + " / " + targetCount + " goal words";
  goalStatus.textContent = isGoalReached() ? "Daily goal reached" : bankProgress + "% to daily goal";
}

function describeValue(value) {
  if (settings.mode === "emoji") return value === 0 ? "Start guessing" : state.attempts + " / " + EMOJI_MAX_GUESSES + " guesses";
  if (settings.mode === "category") return value === 0 ? "Start typing" : "Category guess";
  const diff = value - puzzle.target;
  if (value === 0) return "Start typing";
  if (diff === 0) return "Exact match";
  return Math.abs(diff) + (diff < 0 ? " low" : " high");
}

function renderMeter() {
  const word = normalizeWord(input.value);
  const value = wordValue(word);
  const diff = value - puzzle.target;

  currentWord.textContent = word || "-";
  currentValue.textContent = settings.mode === "emoji" ? word.length + " / 5" : cents(value);
  currentDelta.textContent = describeValue(value);

  meter.classList.remove("hit", "low", "high");
  if (settings.mode === "emoji") {
    if (word.length === 5) meter.classList.add("hit");
    return;
  }
  if (value > 0 && diff === 0) meter.classList.add("hit");
  if (value > 0 && diff < 0) meter.classList.add("low");
  if (value > 0 && diff > 0) meter.classList.add("high");
}

function renderFoundWords() {
  foundWords.innerHTML = "";
  const words = settings.mode === "emoji" ? state.guesses : [...state.found].sort((a, b) => a.localeCompare(b));

  words.forEach((word) => {
    const item = document.createElement("li");
    const text = document.createElement("strong");
    const value = document.createElement("span");
    text.textContent = word;
    value.textContent = settings.mode === "emoji" ? (word === puzzle.answer ? "hit" : "miss") : cents(wordValue(word));
    item.append(text, value);
    foundWords.appendChild(item);
  });

  emptyStateEl.hidden = words.length > 0;
}

function renderValueGrid() {
  valueGrid.innerHTML = "";
  [...ALPHABET].forEach((letter) => {
    const cell = document.createElement("div");
    const strong = document.createElement("strong");
    const span = document.createElement("span");
    strong.textContent = letter.toUpperCase();
    span.textContent = cents(letterValue(letter));
    cell.append(strong, span);
    valueGrid.appendChild(cell);
  });
}

function renderSettings() {
  document.querySelectorAll("input[name='mode']").forEach((radio) => {
    radio.checked = radio.value === settings.mode;
  });
}

function hintText(level) {
  if (settings.mode !== "definition") return "";
  const answer = puzzle.answer || "";
  const value = wordValue(answer);
  const vowels = [...new Set([...answer].filter((letter) => "aeiou".includes(letter)))].join(", ");
  const middle = answer.length > 3 ? answer.slice(1, -1).replace(/[a-z]/g, "_") : "";

  switch (level) {
    case 1:
      return "It is " + answer.length + " letters long.";
    case 2:
      return "It starts with " + answer[0].toUpperCase() + ".";
    case 3:
      return "It ends with " + answer.at(-1).toUpperCase() + ".";
    case 4:
      return vowels ? "Its vowel" + (vowels.length > 1 ? "s are " : " is ") + vowels.toUpperCase() + "." : "It has no standard vowels.";
    case 5:
      return "Pattern: " + answer[0].toUpperCase() + middle + answer.at(-1).toUpperCase() + " · value " + cents(value) + ".";
    default:
      return "";
  }
}

function renderHints() {
  const isDefinition = settings.mode === "definition";
  hintControls.hidden = !isDefinition;
  hintList.hidden = !isDefinition || state.hintsUsed === 0;
  hintList.innerHTML = "";

  if (!isDefinition) return;

  hintButton.disabled = state.hintsUsed >= MAX_DEFINITION_HINTS || isGoalReached();
  hintButton.textContent = state.hintsUsed >= MAX_DEFINITION_HINTS ? "No hints left" : "Hint";
  hintCount.textContent =
    state.hintsUsed + " / " + MAX_DEFINITION_HINTS + " hint" + (state.hintsUsed === 1 ? "" : "s") + " used";

  for (let index = 1; index <= state.hintsUsed; index += 1) {
    const item = document.createElement("li");
    item.textContent = hintText(index);
    hintList.appendChild(item);
  }
}

function renderKeyboard() {
  const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  keyboard.innerHTML = "";

  rows.forEach((row, index) => {
    const rowEl = document.createElement("div");
    rowEl.className = "keyboard-row";

    if (index === 2) {
      rowEl.appendChild(makeKey("Enter", "enter", "wide"));
    }

    [...row].forEach((letter) => {
      rowEl.appendChild(makeKey(letter.toUpperCase(), letter, ""));
    });

    if (index === 2) {
      rowEl.appendChild(makeKey("⌫", "backspace", "wide"));
    }

    keyboard.appendChild(rowEl);
  });
}

function makeKey(label, value, className) {
  const button = document.createElement("button");
  const keyLabel = document.createElement("strong");
  const keyValue = document.createElement("span");

  button.type = "button";
  button.dataset.key = value;
  button.className = className ? "key " + className : "key";
  keyLabel.textContent = label;
  keyValue.textContent = value.length === 1 ? letterValue(value) : "";
  button.append(keyLabel, keyValue);
  return button;
}

function render() {
  targetValue.textContent = settings.mode === "emoji" ? "Emoji" : puzzle.target === null ? "Any" : cents(puzzle.target);
  foundCount.textContent = settings.mode === "emoji" ? state.attempts + "/" + EMOJI_MAX_GUESSES : state.found.length;
  scoreValue.textContent = settings.mode === "emoji" ? (isGoalReached() ? "Solved" : isGameOver() ? "Missed" : "Guess") : money(currentScore());
  puzzleNumber.textContent = "#" + String(puzzle.id).padStart(3, "0");
  settingsButton.textContent = "Settings · " + MODES[settings.mode].label;
  goalHeadingLabel.textContent = settings.mode === "emoji" ? "Emoji Guess" : "Daily Bank";
  foundWordsTitle.textContent = settings.mode === "emoji" ? "Guesses" : "Banked Words";
  submitButton.textContent = settings.mode === "emoji" ? "Guess" : "Bank";
  attemptCount.textContent =
    settings.mode === "emoji"
      ? state.attempts + " / " + EMOJI_MAX_GUESSES + " guesses"
      : state.attempts + (state.attempts === 1 ? " try" : " tries");
  shareButton.hidden = !isGoalReached();
  valuesButton.textContent =
    settings.mode === "emoji"
      ? "Emoji mode · 5 letters · 6 guesses"
      : settings.mode === "market"
      ? "Daily market values · tap to inspect"
      : "A=1 · B=2 · C=3 · … · Z=26";
  cluePanel.hidden = !puzzle.prompt;
  cluePanel.classList.toggle("emoji-clue", settings.mode === "emoji");
  clueLabel.textContent = puzzle.promptLabel || "Clue";
  clueText.textContent = puzzle.prompt || "";
  renderHints();
  renderGoal();
  renderMeter();
  renderFoundWords();
  renderSettings();
  renderStats();
  renderWinDialog();
}

function setMessage(text) {
  message.textContent = text;
}

function renderWinDialog() {
  if (settings.mode === "emoji") {
    winScore.textContent = "Solved";
    winMeta.textContent =
      state.attempts +
      " / " +
      EMOJI_MAX_GUESSES +
      " guesses · Emoji";
    return;
  }

  const hintMeta =
    settings.mode === "definition"
      ? " · " + state.hintsUsed + " hint" + (state.hintsUsed === 1 ? "" : "s")
      : "";
  winScore.textContent = money(currentScore());
  winMeta.textContent =
    state.found.length +
    (state.found.length === 1 ? " word" : " words") +
    " in " +
    state.attempts +
    (state.attempts === 1 ? " try" : " tries") +
    hintMeta +
    " · " +
    MODES[settings.mode].label;
}

function showWinDialog() {
  renderWinDialog();
  if (!winDialog.open) winDialog.showModal();
}

function submitWord(event) {
  event.preventDefault();
  if (dictionaryFailed) {
    setMessage("Dictionary did not load. Refresh with ?reset=1.");
    return;
  }

  if (!dictionaryReady) {
    setMessage("Dictionary is still loading.");
    return;
  }

  const word = normalizeWord(input.value);
  const value = wordValue(word);
  state.lastValue = value;

  if (settings.mode === "emoji") {
    if (isGoalReached()) {
      setMessage("Already solved.");
    } else if (isGameOver()) {
      setMessage("Out of guesses. Today's word was " + puzzle.answer.toUpperCase() + ".");
    } else if (word.length !== 5) {
      setMessage("Emoji mode needs a 5-letter word.");
    } else if (!dictionary.has(word)) {
      setMessage(word.toUpperCase() + " is not in the dictionary.");
    } else if (state.guesses.includes(word)) {
      setMessage(word.toUpperCase() + " was already guessed.");
    } else {
      const wasGoalMet = isGoalReached();
      state.attempts += 1;
      state.guesses.push(word);

      if (word === puzzle.answer) {
        state.found.push(word);
        recordFirstFind();
        recordFoundWord();
        state.completedAt = new Date().toISOString();
        state.congratsSeen = false;
        setMessage("Emoji solved.");
      } else {
        const remaining = EMOJI_MAX_GUESSES - state.attempts;
        setMessage(
          remaining > 0
            ? "Not it. " + remaining + " guess" + (remaining === 1 ? "" : "es") + " left."
            : "Out of guesses. Today's word was " + puzzle.answer.toUpperCase() + "."
        );
      }
      input.value = "";

      if (!wasGoalMet && isGoalReached()) {
        state.completedAt = new Date().toISOString();
        state.congratsSeen = false;
      }
    }

    saveState();
    render();
    if (isGoalReached() && !state.congratsSeen) {
      state.congratsSeen = true;
      saveState();
      showWinDialog();
    }
    return;
  }

  state.attempts += 1;

  if (word.length < 2) {
    setMessage("Use at least two letters.");
  } else if (!dictionary.has(word)) {
    setMessage(word.toUpperCase() + " is not in the dictionary.");
  } else if (state.found.includes(word)) {
    setMessage(word.toUpperCase() + " is already banked.");
  } else if (settings.mode === "definition" && word !== puzzle.answer) {
    const diff = value - puzzle.target;
    setMessage(cents(value) + " is not the clue word" + (diff === 0 ? "." : " and is " + Math.abs(diff) + (diff < 0 ? " low." : " high.")));
  } else if (settings.mode === "category" && !puzzle.allowedWords.includes(word)) {
    setMessage(word.toUpperCase() + " is not one of today's " + puzzle.category + " words.");
  } else if (settings.mode !== "category" && value !== puzzle.target) {
    const diff = value - puzzle.target;
    setMessage(cents(value) + " is " + Math.abs(diff) + (diff < 0 ? " low." : " high."));
  } else {
    const wasGoalMet = isGoalReached();
    state.found.push(word);
    recordFirstFind();
    recordFoundWord();
    const isGoalMet = isGoalReached();
    if (!wasGoalMet && isGoalMet) {
      state.completedAt = new Date().toISOString();
      state.congratsSeen = false;
    }
    setMessage(
      !wasGoalMet && isGoalMet
        ? "Daily goal hit."
        : "Banked " + word.toUpperCase() + (settings.mode === "category" ? " for " + puzzle.category + "." : ". Keep going.")
    );
    input.value = "";
  }

  saveState();
  render();
  if (isGoalReached() && !state.congratsSeen) {
    state.congratsSeen = true;
    saveState();
    showWinDialog();
  }
}

function shareText() {
  if (settings.mode === "emoji") {
    return [
      "Worthle #" + puzzle.id,
      "Emoji mode",
      puzzle.emoji,
      "Solved in " + state.attempts + " / " + EMOJI_MAX_GUESSES + " guesses"
    ].join("\n");
  }

  const found = state.found.length;
  const tries = state.attempts;
  const lines = [
    "Worthle #" + puzzle.id,
    MODES[settings.mode].label + " mode",
    puzzle.prompt ? puzzle.prompt : "Target " + cents(puzzle.target),
    found + " word" + (found === 1 ? "" : "s") + " banked in " + tries + (tries === 1 ? " try" : " tries"),
    "Score " + money(currentScore())
  ];
  if (settings.mode === "definition") {
    lines.push(state.hintsUsed + " hint" + (state.hintsUsed === 1 ? "" : "s") + " used");
  }
  return lines.join("\n");
}

async function shareResult() {
  const text = shareText();
  try {
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
      setMessage("Copied result.");
    }
  } catch {
    setMessage("Share canceled.");
  }
}

function resetToday() {
  state = emptyState();
  input.value = "";
  localStorage.removeItem(stateKey());
  setMessage("Worthle reset. Fresh board loaded.");
  render();
}

function useHint() {
  if (settings.mode !== "definition") return;
  if (state.hintsUsed >= MAX_DEFINITION_HINTS) {
    setMessage("No hints left for this clue.");
    return;
  }
  if (isGoalReached()) {
    setMessage("Already solved.");
    return;
  }

  state.hintsUsed += 1;
  saveState();
  setMessage("Hint " + state.hintsUsed + " revealed.");
  render();
}

function switchMode(mode) {
  if (!MODES[mode] || settings.mode === mode) return;
  settings.mode = mode;
  saveSettings();
  puzzle = getPuzzle();
  state = loadState();
  input.value = "";
  renderKeyboard();
  renderValueGrid();
  setMessage(MODES[mode].label + " mode loaded.");
  render();
}

function bindEvents() {
  form.addEventListener("submit", submitWord);
  input.addEventListener("beforeinput", (event) => event.preventDefault());
  input.addEventListener("keydown", (event) => event.preventDefault());
  input.addEventListener("focus", () => input.blur());
  input.addEventListener("input", () => {
    const normalized = normalizeWord(input.value);
    if (input.value !== normalized) input.value = normalized;
    renderMeter();
  });
  shareButton.addEventListener("click", shareResult);
  winShareButton.addEventListener("click", shareResult);
  hintButton.addEventListener("click", useHint);
  resetButton.addEventListener("click", resetToday);
  statsButton.addEventListener("click", () => statsDialog.showModal());
  settingsButton.addEventListener("click", () => settingsDialog.showModal());
  valuesButton.addEventListener("click", () => valuesDialog.showModal());
  settingsDialog.addEventListener("change", (event) => {
    if (event.target.name === "mode") switchMode(event.target.value);
  });
  keyboard.addEventListener("click", handleKeyboardClick);
  document.addEventListener("dblclick", (event) => event.preventDefault(), { passive: false });
}

function handleKeyboardClick(event) {
  const key = event.target.closest("button")?.dataset.key;
  if (!key) return;

  if (key === "enter") {
    form.requestSubmit();
    return;
  }

  if (key === "backspace") {
    input.value = input.value.slice(0, -1);
  } else {
    input.value += key;
  }

  renderMeter();
}

async function init() {
  resetFromUrl = consumeResetParam();
  settings = loadSettings();
  puzzle = getPuzzle();
  state = loadState();
  renderKeyboard();
  renderValueGrid();
  bindEvents();
  render();
  if (resetFromUrl) setMessage("Worthle reset from URL. Fresh board loaded.");
  await loadDictionary();
  render();
  if (resetFromUrl) setMessage("Worthle reset from URL. Fresh board loaded.");
}

init();
