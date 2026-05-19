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
const SETTINGS_KEY = "worthle-settings";
const MODES = {
  classic: {
    label: "Classic",
    description: "Fixed A=1 through Z=26 pricing."
  },
  market: {
    label: "Market",
    description: "Daily all-letter pricing."
  }
};
const LETTER_BANDS = {
  vowel: { letters: "aeiou", min: 1, max: 6 },
  common: { letters: "tnsrhlcd", min: 4, max: 14 },
  mid: { letters: "mpfgwybvk", min: 8, max: 20 },
  rare: { letters: "jxqz", min: 15, max: 26 }
};

const form = document.querySelector("#wordForm");
const input = document.querySelector("#wordInput");
const message = document.querySelector("#message");
const targetValue = document.querySelector("#targetValue");
const foundCount = document.querySelector("#foundCount");
const scoreValue = document.querySelector("#scoreValue");
const goalCurrent = document.querySelector("#goalCurrent");
const goalTarget = document.querySelector("#goalTarget");
const goalProgressFill = document.querySelector("#goalProgressFill");
const goalWords = document.querySelector("#goalWords");
const goalStatus = document.querySelector("#goalStatus");
const puzzleNumber = document.querySelector("#puzzleNumber");
const currentWord = document.querySelector("#currentWord");
const currentValue = document.querySelector("#currentValue");
const currentDelta = document.querySelector("#currentDelta");
const meter = document.querySelector(".meter");
const foundWords = document.querySelector("#foundWords");
const emptyStateEl = document.querySelector("#emptyState");
const attemptCount = document.querySelector("#attemptCount");
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
  return state.found.length * puzzle.target;
}

function isGoalReached() {
  return currentScore() >= puzzle.goal;
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

function bandForLetter(letter) {
  return Object.values(LETTER_BANDS).find((band) => band.letters.includes(letter));
}

function buildClassicValues() {
  return Object.fromEntries([...ALPHABET].map((letter, index) => [letter, index + 1]));
}

function buildMarketValues(dateKey) {
  const random = seededRandom(hashSeed("worthle-market-" + dateKey));
  return Object.fromEntries(
    [...ALPHABET].map((letter) => {
      const band = bandForLetter(letter);
      const min = band?.min || 10;
      const max = band?.max || 35;
      return [letter, min + Math.floor(random() * (max - min + 1))];
    })
  );
}

function buildLetterValues(dateKey) {
  letterValues = settings.mode === "market" ? buildMarketValues(dateKey) : buildClassicValues();
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
  return {
    id: dayIndex + 1,
    dateKey,
    target: wordValue(seed),
    goal: wordValue(seed) * DAILY_GOAL_WORDS
  };
}

function emptyState() {
  return {
    found: [],
    attempts: 0,
    lastValue: 0,
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
  stats.money += puzzle.target;
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
  const progress = Math.min(100, Math.round((score / puzzle.goal) * 100));

  goalCurrent.textContent = money(score);
  goalTarget.textContent = money(puzzle.goal);
  goalProgressFill.style.width = progress + "%";
  goalWords.textContent = state.found.length + " / " + DAILY_GOAL_WORDS + " goal words";
  goalStatus.textContent = score >= puzzle.goal ? "Daily goal reached" : progress + "% to daily goal";
}

function describeValue(value) {
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
  currentValue.textContent = cents(value);
  currentDelta.textContent = describeValue(value);

  meter.classList.remove("hit", "low", "high");
  if (value > 0 && diff === 0) meter.classList.add("hit");
  if (value > 0 && diff < 0) meter.classList.add("low");
  if (value > 0 && diff > 0) meter.classList.add("high");
}

function renderFoundWords() {
  foundWords.innerHTML = "";
  const sorted = [...state.found].sort((a, b) => a.localeCompare(b));

  sorted.forEach((word) => {
    const item = document.createElement("li");
    const text = document.createElement("strong");
    const value = document.createElement("span");
    text.textContent = word;
    value.textContent = cents(wordValue(word));
    item.append(text, value);
    foundWords.appendChild(item);
  });

  emptyStateEl.hidden = sorted.length > 0;
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
  targetValue.textContent = cents(puzzle.target);
  foundCount.textContent = state.found.length;
  scoreValue.textContent = money(currentScore());
  puzzleNumber.textContent = "#" + String(puzzle.id).padStart(3, "0");
  settingsButton.textContent = "Settings · " + MODES[settings.mode].label;
  attemptCount.textContent = state.attempts + (state.attempts === 1 ? " try" : " tries");
  shareButton.hidden = !isGoalReached();
  valuesButton.textContent =
    settings.mode === "market"
      ? "Daily market values · tap to inspect"
      : "A=1 · B=2 · C=3 · … · Z=26";
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
  winScore.textContent = money(currentScore());
  winMeta.textContent =
    state.found.length +
    (state.found.length === 1 ? " word" : " words") +
    " in " +
    state.attempts +
    (state.attempts === 1 ? " try" : " tries") +
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
  state.attempts += 1;
  state.lastValue = value;

  if (word.length < 2) {
    setMessage("Use at least two letters.");
  } else if (!dictionary.has(word)) {
    setMessage(word.toUpperCase() + " is not in the dictionary.");
  } else if (state.found.includes(word)) {
    setMessage(word.toUpperCase() + " is already banked.");
  } else if (value !== puzzle.target) {
    const diff = value - puzzle.target;
    setMessage(cents(value) + " is " + Math.abs(diff) + (diff < 0 ? " low." : " high."));
  } else {
    const wasGoalMet = currentScore() >= puzzle.goal;
    state.found.push(word);
    recordFirstFind();
    recordFoundWord();
    const isGoalMet = currentScore() >= puzzle.goal;
    if (!wasGoalMet && isGoalMet) {
      state.completedAt = new Date().toISOString();
      state.congratsSeen = false;
    }
    setMessage(
      !wasGoalMet && isGoalMet
        ? "Daily goal hit."
        : "Banked " + word.toUpperCase() + ". Keep going."
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
  const found = state.found.length;
  const tries = state.attempts;
  return [
    "Worthle #" + puzzle.id,
    MODES[settings.mode].label + " mode",
    "Target " + cents(puzzle.target),
    found + " word" + (found === 1 ? "" : "s") + " banked in " + tries + (tries === 1 ? " try" : " tries"),
    "Score " + money(found * puzzle.target) + " / " + money(puzzle.goal)
  ].join("\n");
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
