// --- VARIABLES ---
let coins = 0;
let price = 50;
let myCards = []; 

// --- BASE DE DONNÉES LOCALE (GÉNÉRÉE AUTOMATIQUEMENT) ---
// Ceci crée la liste des 252 cartes du set SV8 instantanément
const sv8_database = [];

for (let i = 1; i <= 252; i++) {
    let rarity = "Common";
    let name = `Carte #${i}`;
    
    // Définition approximative des raretés selon le numéro
    if (i > 191) rarity = "Secret Rare"; 
    else if (i > 170) rarity = "Ultra Rare";
    else if (i > 150) rarity = "Rare Holo";

    // Quelques cartes Stars du set pour l'affichage
    if (i === 57 || i === 219 || i === 238 || i === 247) { name = "Pikachu ex"; rarity = "Double Rare"; }
    if (i === 240) name = "Hydreigon ex";
    if (i === 237) name = "Milotic ex";
    if (i === 239) name = "Latias ex";
    if (i === 242) name = "Alolan Exeggutor ex";

    sv8_database.push({
        id: `sv8-${i}`,
        name: name,
        rarity: rarity,
        // C'est ICI que l'on récupère l'image officielle HD
        images: {
            small: `https://images.pokemontcg.io/sv8/${i}.png`,
            large: `https://images.pokemontcg.io/sv8/${i}_hires.png`
        },
        // Simulation des PV pour le tri (Les rares à la fin)
        hp: (rarity.includes("Rare") ? 200 : 60)
    });
}

// Variables d'animation
let cardsToReveal = []; 
let currentCardIndex = 0;

// --- ÉLÉMENTS HTML ---
const walletEl = document.getElementById('wallet');
const countEl = document.getElementById('count');
const shopBtn = document.getElementById('shop-btn');
const grid = document.getElementById('grid');
const feedback = document.getElementById('feedback');
const pokeballBtn = document.getElementById('pokeball-btn');
const debugBtn = document.getElementById('debug-btn');
const overlay = document.getElementById('overlay');
const activeCardContainer = document.getElementById('active-card-container');
const tapHint = document.getElementById('tap-hint');
const setSelector = document.getElementById('set-selector');

// --- EVENTS ---
pokeballBtn.addEventListener('click', clickBall);
shopBtn.addEventListener('click', buyBooster);

// Bouton Triche
if(debugBtn) {
    debugBtn.addEventListener('click', () => {
        coins += 10000;
        updateUI();
        saveGame();
        feedback.innerText = "TRICHE: +10K 💰";
        feedback.style.color = "red";
        setTimeout(() => feedback.style.color = "#666", 2000);
    });
}

// --- SAUVEGARDE ---
function saveGame() {
    const data = { coins, price, cards: myCards };
    localStorage.setItem('pokeClickerSave', JSON.stringify(data));
}

function loadGame() {
    const saved = localStorage.getItem('pokeClickerSave');
    if (saved) {
        const data = JSON.parse(saved);
        coins = data.coins;
        price = data.price;
        myCards = data.cards || [];
        
        grid.innerHTML = '';
        [...myCards].reverse().forEach(url => createCardElement(url, false));
    }
    updateUI();
}

// --- UI ---
function updateUI() {
    walletEl.innerText = `💰 ${coins}`;
    countEl.innerText = `🃏 ${myCards.length}`;
    
    if (coins >= price) {
        shopBtn.classList.add('active');
        shopBtn.innerText = `ACHETER BOOSTER\n(SV8 - ${price} 💰)`;
    } else {
        shopBtn.classList.remove('active');
        shopBtn.innerText = `Manque ${price - coins} 💰`;
    }
}

function clickBall() {
    const gain = Math.floor(Math.random() * 3) + 1;
    coins += gain;
    feedback.style.color = '#3b4cca';
    feedback.innerText = `+${gain}`;
    setTimeout(() => feedback.innerText = "Clique !", 500);
    updateUI();
    saveGame();
}

// --- ACHAT BOOSTER (100% LOCAL & INSTANTANÉ) ---
function buyBooster() {
    if (coins < price) return;

    // 1. Paiement
    coins -= price;
    updateUI();
    saveGame();

    // 2. GÉNÉRATION DU BOOSTER (Sans internet)
    // On pioche 5 cartes au hasard dans notre base de données locale
    let newPack = [];
    for (let i = 0; i < 5; i++) {
        const randomIndex = Math.floor(Math.random() * sv8_database.length);
        newPack.push(sv8_database[randomIndex]);
    }

    // 3. TRI (Mise en scène)
    // On met les cartes "Rares" à la fin du paquet pour le suspense
    newPack.sort((a, b) => {
        let scoreA = (a.rarity.includes("Rare")) ? 10 : 1;
        let scoreB = (b.rarity.includes("Rare")) ? 10 : 1;
        return scoreA - scoreB;
    });

    // 4. Lancement immédiat de l'animation
    startRevealSession(newPack);
}

// --- RÉVÉLATION (Une par une) ---
function startRevealSession(cards) {
    cardsToReveal = cards;
    currentCardIndex = 0;
    
    overlay.classList.remove('hidden');
    activeCardContainer.innerHTML = '';
    tapHint.innerText = "Touche la carte pour découvrir la suivante";
    
    showNextCard();
}

function showNextCard() {
    if (currentCardIndex >= cardsToReveal.length) {
        closeOverlay();
        feedback.innerText = "Booster terminé !";
        return;
    }

    const cardData = cardsToReveal[currentCardIndex];
    const isLast = (currentCardIndex === cardsToReveal.length - 1);

    const cardEl = document.createElement('div');
    cardEl.className = 'large-reveal-card';
    if (isLast) cardEl.classList.add('rare');
    
    const imgUrl = cardData.images.large || cardData.images.small;
    cardEl.style.backgroundImage = `url('${imgUrl}')`;

    // Interaction au clic
    cardEl.onclick = function() {
        cardEl.classList.add('slide-up');
        
        myCards.unshift(cardData.images.small);
        createCardElement(cardData.images.small, true);
        saveGame();

        setTimeout(() => {
            if(cardEl.parentNode === activeCardContainer) {
                activeCardContainer.removeChild(cardEl);
            }
            currentCardIndex++;
            showNextCard();
        }, 250); 
    };

    activeCardContainer.appendChild(cardEl);
}

function closeOverlay() {
    overlay.classList.add('hidden');
    updateUI();
}

function createCardElement(url, isNew) {
    const div = document.createElement('div');
    div.className = 'card';
    if (isNew) div.classList.add('new');
    div.style.backgroundImage = `url('${url}')`;
    
    if (grid.firstChild) grid.insertBefore(div, grid.firstChild);
    else grid.appendChild(div);
}

loadGame();
