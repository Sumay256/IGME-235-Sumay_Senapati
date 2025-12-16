class Card {
    constructor(value, index) {
        this.value = value;
        this.index = index;
        this.revealed = false;
        this.matched = false;

        this.element = document.createElement("div");
        this.element.className = "card";
        this.element.textContent = "?";
        this.element.onclick = () => revealCard(this);
    }

    reveal() {
        this.revealed = true;
        this.element.classList.add("revealed");
        this.element.textContent = this.value;
    }

    hide() {
        this.revealed = false;
        this.element.classList.remove("revealed");
        this.element.textContent = "?";
    }

    match() {
        this.matched = true;
        this.element.classList.add("matched");
    }

    remove() {
        this.element.style.visibility = "hidden";
    }
}

let state = "start";
let maxHP = 20;
let hp = 20;
let shield = 0;
let shieldDmgReduction = 0;
let level = 1;
const flipSound = new Audio("Media/flip.mp3");

let firstCard = null;
let lock = false; //Lock to prevent clicking during animations

// All three states screens
const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const overScreen = document.getElementById("gameOverScreen");

// UI Elements and grid
const hpText = document.getElementById("hpText");
const levelText = document.getElementById("levelText");
const shieldText = document.getElementById("shieldText");
const hpFill = document.getElementById("hpFill");
const grid = document.getElementById("grid");
const buffs = document.getElementById("buffs");

// Buttons
document.getElementById("startButton").onclick = startGame;
document.getElementById("restartButton").onclick = restartGame;

function restartGame() {
    // Reset game state
    state = "start";
    maxHP = 20;
    hp = 20;
    shield = 0;
    level = 1;

    firstCard = null;
    lock = false;

    // Clear UI
    buffs.innerHTML = "";
    grid.innerHTML = "";

    // Reset screens by adding and removing the class from relevant state
    overScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");

    updateUI();
}

function startGame() {
    startScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    state = "play";
    setupLevel();
}

function createDeck() {
    let deck = [];

    // special card pairs
    deck.push("HP", "HP");
    deck.push("Shield", "Shield");

    deck.push("Grunt", "Grunt", "Grunt", "Grunt");
    deck.push("Brute", "Brute");

    // remaining inert (just matching required) pairs
    for (let i = 1; i <= 3; i++) {
        deck.push(i, i);
    }

    // randomly shuffle the deck
    for (let i = deck.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // convert to Card instances
    return deck.map((value, index) => new Card(value, index));
}

function setupLevel() {
    grid.innerHTML = "";
    let deck = createDeck();

    deck.forEach(card => grid.appendChild(card.element));

    updateUI();
}

function revealCard(card) {
    // Prevent clicking during lock or on already revealed/matched cards
    if (lock || card.matched || card.revealed) {
        return;
    }
    flipSound.currentTime = 0;
    flipSound.play();
    card.reveal();

    // first card is stored if empty and used for second card comparison
    if (!firstCard) {
        firstCard = card;
        return;
    }

    // second card
    lock = true;

    // Card match check
    if (card.value === firstCard.value) {
        handleMatch(card);
    } else {
        handleMismatch(card);
    }
}

function handleMatch(card) {
    // HP pair
    if (card.value == "HP") {
        maxHP += 5;
        hp = Math.min(maxHP, hp + 6);
        addBuff("HP+");
    }

    // Shield pair
    if (card.value == "Shield") {
        shield += 1;
        shieldDmgReduction += 1;
        addBuff("Shield+");
    }

    // Add matched class to pair
    card.match();
    firstCard.match();

    // delay to ensure a visual that cards matched before hiding (300ms)
    setTimeout(() => {
        card.remove();
        firstCard.remove();

        firstCard = null;
        lock = false;

        checkWin();
    }, 300);

    updateUI();
}

function handleMismatch(card) {
    const v1 = firstCard.value;
    const v2 = card.value;

    // Enemy damage
    if (v1 === "Grunt" || v2 === "Grunt" || v1 === "Brute" || v2 === "Brute") {
        let dmg;
        if (v1 === "Grunt" || v2 === "Grunt") {
            dmg = 2;
        }
        else {
            dmg = 5;
        }
        // Level scaling damage (set to 30% more damage per level)
        dmg = Math.floor(dmg * (1 + (level - 1) * 0.3));

        // Each shield stack reduces damage by 20% (max 50% reduction)
        if (shieldDmgReduction <= 5) {
            dmg = Math.floor(dmg * (1 - shieldDmgReduction * 0.1));
        }

        // Apply dmg negtion if shield is present
        if (shield > 0) {
            dmg = 0;
            shield = shield - 1;
        }

        // Apply damage to HP
        hp = hp - dmg;
        if (hp <= 0) {
            return gameOver();
        }
    }

    // flip back after a delay (600ms)
    setTimeout(() => {
        card.hide();
        firstCard.hide();

        firstCard = null;
        lock = false;

        updateUI();
    }, 600);
}

function updateUI() {
    hpText.textContent = `HP: ${hp} / ${maxHP}`;
    shieldText.textContent = `Shield: ${shield}`;
    levelText.textContent = `Level: ${level}`;

    let hpPercent = Math.max(0, hp / maxHP * 100);

    // Hp bar implementation (inner div width adjustment)
    hpFill.style.width = hpPercent + "%";
}

function addBuff(text) {
    let b = document.createElement("div");
    b.className = "buff";
    b.textContent = text;
    buffs.appendChild(b);
}

function checkWin() {
    let cards = document.querySelectorAll(".card");
    let unmatchedCount = 0;

    for (let card of cards) {
        if (!card.classList.contains("matched")) {
            unmatchedCount++;
        }
    }

    if (unmatchedCount === 0) {
        level++;
        setupLevel();
    }
}

function gameOver() {
    gameScreen.classList.add("hidden");
    overScreen.classList.remove("hidden");
    document.getElementById("finalLevelText").textContent =
        `You reached Level ${level}`;
}
