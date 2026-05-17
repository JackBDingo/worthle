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

const form = document.querySelector("#wordForm");
const input = document.querySelector("#wordInput");
const message = document.querySelector("#message");
const targetValue = document.querySelector("#targetValue");
const foundCount = document.querySelector("#foundCount");
const scoreValue = document.querySelector("#scoreValue");
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
const statsButton = document.querySelector("#statsButton");
const statsDialog = document.querySelector("#statsDialog");
const valuesButton = document.querySelector("#valuesButton");
const valuesDialog = document.querySelector("#valuesDialog");
const valueGrid = document.querySelector("#valueGrid");
const keyboard = document.querySelector("#keyboard");

let puzzle;
let state;
let dictionary = new Set();
let dictionaryReady = false;
let dictionaryFailed = false;
let resetFromUrl = false;

function letterValue(letter) {
  return letter.toLowerCase().charCodeAt(0) - 96;
}

function wordValue(word) {
  return [...word.toLowerCase()].reduce((sum, letter) => sum + letterValue(letter), 0);
}

function cents(value) {
  return "$0." + String(value).padStart(2, "0");
}

function money(value) {
  return "$" + (value / 100).toFixed(2);
}

function normalizeWord(value) {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

function clearWorthleStorage() {
  Object.keys(localStorage)
    .filter((key) => key.startsWith("worthle-hunt-"))
    .forEach((key) => localStorage.removeItem(key));
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
  return {
    id: dayIndex + 1,
    dateKey: localMidnight.toISOString().slice(0, 10),
    target: wordValue(seed)
  };
}

function emptyState() {
  return {
    found: [],
    attempts: 0,
    lastValue: 0
  };
}

function loadState() {
  const raw = localStorage.getItem("worthle-hunt-" + puzzle.dateKey);
  if (!raw) return emptyState();

  try {
    const parsed = JSON.parse(raw);
    return { ...emptyState(), ...parsed };
  } catch {
    return emptyState();
  }
}

function saveState() {
  localStorage.setItem("worthle-hunt-" + puzzle.dateKey, JSON.stringify(state));
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
    span.textContent = letterValue(letter);
    cell.append(strong, span);
    valueGrid.appendChild(cell);
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
  scoreValue.textContent = money(state.found.length * puzzle.target);
  puzzleNumber.textContent = "#" + String(puzzle.id).padStart(3, "0");
  attemptCount.textContent = state.attempts + (state.attempts === 1 ? " try" : " tries");
  renderMeter();
  renderFoundWords();
  renderStats();
}

function setMessage(text) {
  message.textContent = text;
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
    state.found.push(word);
    recordFirstFind();
    recordFoundWord();
    setMessage("Banked " + word.toUpperCase() + ". Keep going.");
    input.value = "";
  }

  saveState();
  render();
}

function shareText() {
  const found = state.found.length;
  const tries = state.attempts;
  return [
    "Worthle #" + puzzle.id,
    "Target " + cents(puzzle.target),
    found + " word" + (found === 1 ? "" : "s") + " banked in " + tries + (tries === 1 ? " try" : " tries"),
    "Score " + money(found * puzzle.target),
    state.found.length ? state.found.map((word) => word.toUpperCase()).sort().join(", ") : "No words banked yet"
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
  clearWorthleStorage();
  setMessage("Worthle reset. Fresh board loaded.");
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
  resetButton.addEventListener("click", resetToday);
  statsButton.addEventListener("click", () => statsDialog.showModal());
  valuesButton.addEventListener("click", () => valuesDialog.showModal());
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
