const ANSWERS = [
  "cabin", "apple", "brave", "dream", "focus", "light", "money", "worth",
  "value", "penny", "score", "daily", "climb", "quick", "trade", "graph",
  "maker", "field", "craft", "pilot", "forge", "stack", "logic", "tempo",
  "cents", "prize", "vault", "spark", "north", "plain", "river", "solar",
  "grain", "flint", "crown", "shift", "solid", "magic", "trace", "index",
  "model", "agent", "human", "build", "clean", "sharp", "stone", "metal",
  "paper", "novel", "pixel", "press", "route", "sound", "watch", "learn",
  "scale", "voice", "trial", "quest", "frame", "level", "point", "token"
];

const MAX_GUESSES = 6;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const KEY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const START_DATE = Date.UTC(2026, 0, 1);
const MS_PER_DAY = 86400000;

const board = document.querySelector("#board");
const keyboard = document.querySelector("#keyboard");
const message = document.querySelector("#message");
const targetValue = document.querySelector("#targetValue");
const letterCount = document.querySelector("#letterCount");
const puzzleNumber = document.querySelector("#puzzleNumber");
const shareButton = document.querySelector("#shareButton");
const statsButton = document.querySelector("#statsButton");
const statsDialog = document.querySelector("#statsDialog");

let puzzle;
let state;

function letterValue(letter) {
  return letter.toLowerCase().charCodeAt(0) - 96;
}

function wordValue(word) {
  return [...word.toLowerCase()].reduce((sum, letter) => sum + letterValue(letter), 0);
}

function cents(value) {
  return "$0." + String(value).padStart(2, "0");
}

function getPuzzle() {
  const today = new Date();
  const localMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayIndex = Math.floor((localMidnight.getTime() - START_DATE) / MS_PER_DAY);
  const answer = ANSWERS[((dayIndex % ANSWERS.length) + ANSWERS.length) % ANSWERS.length];
  return {
    answer,
    id: dayIndex + 1,
    dateKey: localMidnight.toISOString().slice(0, 10),
    target: wordValue(answer),
    length: answer.length
  };
}

function emptyState() {
  return {
    guesses: [],
    current: "",
    status: "playing",
    keyboard: {}
  };
}

function loadState() {
  const raw = localStorage.getItem("worthle-state-" + puzzle.dateKey);
  if (!raw) return emptyState();

  try {
    const parsed = JSON.parse(raw);
    return { ...emptyState(), ...parsed };
  } catch {
    return emptyState();
  }
}

function saveState() {
  localStorage.setItem("worthle-state-" + puzzle.dateKey, JSON.stringify(state));
}

function loadStats() {
  try {
    return {
      played: 0,
      wins: 0,
      streak: 0,
      best: 0,
      lastPlayed: "",
      ...JSON.parse(localStorage.getItem("worthle-stats") || "{}")
    };
  } catch {
    return { played: 0, wins: 0, streak: 0, best: 0, lastPlayed: "" };
  }
}

function saveStats(stats) {
  localStorage.setItem("worthle-stats", JSON.stringify(stats));
}

function commitStats(won) {
  const completionKey = "worthle-complete-" + puzzle.dateKey;
  if (localStorage.getItem(completionKey)) return;

  const stats = loadStats();
  stats.played += 1;
  if (won) {
    stats.wins += 1;
    stats.streak += 1;
    stats.best = Math.max(stats.best, stats.streak);
  } else {
    stats.streak = 0;
  }
  stats.lastPlayed = puzzle.dateKey;
  saveStats(stats);
  localStorage.setItem(completionKey, "1");
  renderStats();
}

function evaluateGuess(guess) {
  const answer = puzzle.answer;
  const result = Array(puzzle.length).fill("absent");
  const remaining = {};

  for (let i = 0; i < answer.length; i += 1) {
    if (guess[i] === answer[i]) {
      result[i] = "correct";
    } else {
      remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
    }
  }

  for (let i = 0; i < guess.length; i += 1) {
    if (result[i] === "correct") continue;
    if (remaining[guess[i]]) {
      result[i] = "present";
      remaining[guess[i]] -= 1;
    }
  }

  return result;
}

function updateKeyboard(guess, result) {
  const rank = { absent: 1, present: 2, correct: 3 };
  [...guess].forEach((letter, index) => {
    const status = result[index];
    if (!state.keyboard[letter] || rank[status] > rank[state.keyboard[letter]]) {
      state.keyboard[letter] = status;
    }
  });
}

function scoreClass(value) {
  const diff = Math.abs(value - puzzle.target);
  if (diff === 0) return "exact";
  if (diff <= 5) return "close";
  return "off";
}

function scoreLabel(value) {
  const diff = value - puzzle.target;
  if (diff === 0) return "hit";
  return Math.abs(diff) + (diff < 0 ? " low" : " high");
}

function renderBoard() {
  board.style.setProperty("--letters", puzzle.length);
  board.innerHTML = "";

  for (let rowIndex = 0; rowIndex < MAX_GUESSES; rowIndex += 1) {
    const row = document.createElement("div");
    row.className = "row";
    row.style.setProperty("--letters", puzzle.length);

    const submitted = state.guesses[rowIndex];
    const active = rowIndex === state.guesses.length ? state.current : "";
    const letters = submitted?.word || active;
    const result = submitted ? evaluateGuess(submitted.word) : [];

    for (let i = 0; i < puzzle.length; i += 1) {
      const tile = document.createElement("div");
      tile.className = "tile";
      if (result[i]) tile.classList.add(result[i]);
      tile.textContent = letters[i] || "";
      row.appendChild(tile);
    }

    const scoreTile = document.createElement("div");
    scoreTile.className = "score-tile";
    if (submitted) {
      const value = wordValue(submitted.word);
      scoreTile.classList.add(scoreClass(value));
      scoreTile.textContent = scoreLabel(value);
      scoreTile.title = submitted.word.toUpperCase() + " = " + cents(value);
    } else {
      scoreTile.textContent = rowIndex === state.guesses.length && state.current
        ? cents(wordValue(state.current))
        : "";
      if (!scoreTile.textContent) scoreTile.classList.add("empty");
    }
    row.appendChild(scoreTile);
    board.appendChild(row);
  }
}

function renderKeyboard() {
  keyboard.innerHTML = "";
  KEY_ROWS.forEach((letters, rowIndex) => {
    const row = document.createElement("div");
    row.className = "key-row";

    if (rowIndex === 2) row.appendChild(keyButton("enter", "Enter", "wide"));

    [...letters].forEach((letter) => {
      const button = keyButton(letter, letter);
      if (state.keyboard[letter]) button.classList.add(state.keyboard[letter]);
      row.appendChild(button);
    });

    if (rowIndex === 2) row.appendChild(keyButton("backspace", "⌫", "wide"));
    keyboard.appendChild(row);
  });
}

function keyButton(value, label, extra = "") {
  const button = document.createElement("button");
  button.className = ("key " + extra).trim();
  button.type = "button";
  button.dataset.key = value;
  button.textContent = label;
  button.setAttribute("aria-label", value);
  return button;
}

function renderStats() {
  const stats = loadStats();
  document.querySelector("#playedStat").textContent = stats.played;
  document.querySelector("#winStat").textContent = stats.played
    ? Math.round((stats.wins / stats.played) * 100) + "%"
    : "0%";
  document.querySelector("#streakStat").textContent = stats.streak;
  document.querySelector("#bestStat").textContent = stats.best;
}

function renderMessage() {
  if (state.status === "won") {
    message.textContent = "Banked it in " + state.guesses.length + ".";
    shareButton.hidden = false;
    return;
  }
  if (state.status === "lost") {
    message.textContent = puzzle.answer.toUpperCase() + " was worth " + cents(puzzle.target) + ".";
    shareButton.hidden = false;
    return;
  }
  const remaining = puzzle.length - state.current.length;
  message.textContent = state.current
    ? cents(wordValue(state.current)) + " so far, " + remaining + " letters left."
    : "Make the word match the money.";
}

function render() {
  targetValue.textContent = cents(puzzle.target);
  letterCount.textContent = puzzle.length;
  puzzleNumber.textContent = "#" + String(puzzle.id).padStart(3, "0");
  renderBoard();
  renderKeyboard();
  renderMessage();
  renderStats();
}

function setMessage(text) {
  message.textContent = text;
}

function submitGuess() {
  if (state.status !== "playing") return;
  if (state.current.length !== puzzle.length) {
    setMessage("Need " + puzzle.length + " letters.");
    return;
  }

  const guess = state.current.toLowerCase();
  const result = evaluateGuess(guess);
  const value = wordValue(guess);

  state.guesses.push({ word: guess, value });
  updateKeyboard(guess, result);
  state.current = "";

  if (guess === puzzle.answer) {
    state.status = "won";
    commitStats(true);
  } else if (state.guesses.length >= MAX_GUESSES) {
    state.status = "lost";
    commitStats(false);
  } else {
    const diff = value - puzzle.target;
    setMessage(cents(value) + " is " + Math.abs(diff) + (diff < 0 ? " low." : " high."));
  }

  saveState();
  render();
}

function pressKey(key) {
  if (key === "Enter") {
    submitGuess();
    return;
  }

  if (key === "Backspace") {
    if (state.status === "playing") {
      state.current = state.current.slice(0, -1);
      saveState();
      render();
    }
    return;
  }

  const letter = key.toLowerCase();
  if (state.status !== "playing" || !ALPHABET.includes(letter)) return;
  if (state.current.length >= puzzle.length) return;
  state.current += letter;
  saveState();
  render();
}

function shareText() {
  const lines = state.guesses.map(({ word }) => {
    const result = evaluateGuess(word);
    return result
      .map((status) => status === "correct" ? "🟩" : status === "present" ? "🟨" : "⬜")
      .join("");
  });
  return [
    "Worthle #" + puzzle.id + " " + (state.status === "won" ? state.guesses.length : "X") + "/" + MAX_GUESSES,
    "Target " + cents(puzzle.target),
    ...lines
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

function bindEvents() {
  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    pressKey(event.key);
  });

  keyboard.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const key = button.dataset.key;
    if (key === "enter") pressKey("Enter");
    else if (key === "backspace") pressKey("Backspace");
    else pressKey(key);
  });

  shareButton.addEventListener("click", shareResult);
  statsButton.addEventListener("click", () => statsDialog.showModal());
}

function init() {
  puzzle = getPuzzle();
  state = loadState();
  bindEvents();
  render();
}

init();
