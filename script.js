// --- VARIABLES ---
let coins = 0;
let price = 50;
let myCards = []; // Ta collection

// Variables temporaires pour l'ouverture
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

// Zone d'animation
const overlay = document.getElementById('overlay');
const activeCardContainer = document.getElementById('active-card-container');
const tapHint = document.getElementById('tap-hint');

// --- EVENTS ---
pokeballBtn.addEventListener('click', clickBall);
shopBtn.addEventListener('click', buyBooster);

// Debug / Triche
if(debugBtn) {
    debugBtn.addEventListener('click', () => {
        coins += 10000;
        updateUI();
        saveGame();
        feedback.innerText = "TRICHE ACTIVÉE ! 🤑";
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
        shopBtn.innerText = `OUVRIR BOOSTER\n(5 Cartes - ${price} 💰)`;
    } else {
        shopBtn.classList.remove('active');
        const missing = price - coins;
        shopBtn.innerText = `Manque ${missing} 💰\n(Prix: ${price})`;
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

// --- OUVERTURE BOOSTER (NOUVELLE LOGIQUE) ---
async function buyBooster() {
    if (coins < price) return;

    // 1. Payer
    coins -= price;
    price += 15;
    updateUI();
    saveGame();

    shopBtn.innerText = "Recherche des cartes...";
    shopBtn.classList.remove('active');

    try {
        // 2. Récupérer les 5 cartes (4 communes + 1 rare)
        const randomPage = Math.floor(Math.random() * 100) + 1;
        
        const [commonReq, rareReq] = await Promise.all([
            fetch(`https://api.pokemontcg.io/v2/cards?page=${randomPage}&pageSize=4`),
            fetch(`https://api.pokemontcg.io/v2/cards?pageSize=1&q=rarity:"Rare Holo" OR rarity:"Rare Ultra" OR rarity:V OR rarity:VMAX`)
        ]);

        const commonData = await commonReq.json();
        const rareData = await rareReq.json();
        
        let newPack = [];
        if (commonData.data) newPack = [...commonData.data];
        if (rareData.data) newPack.push(rareData.data[0]);

        if (newPack.length > 0) {
            // 3. Lancer la session de révélation
            startRevealSession(newPack);
        } else {
            alert("Erreur: Paquet vide");
        }

    } catch (e) {
        console.error(e);
        feedback.innerText = "Erreur réseau";
        updateUI(); // Remet le bouton normal
    }
}

// --- GESTION DE LA RÉVÉLATION (UNE PAR UNE) ---
function startRevealSession(cards) {
    cardsToReveal = cards;
    currentCardIndex = 0;
    
    // Ouvrir l'overlay
    overlay.classList.remove('hidden');
    activeCardContainer.innerHTML = ''; // Nettoyer
    tapHint.innerText = "Touche la carte pour voir la suivante";
    
    // Afficher la première carte
    showNextCard();
}

function showNextCard() {
    // Si on a tout montré, on ferme
    if (currentCardIndex >= cardsToReveal.length) {
        closeOverlay();
        feedback.innerText = "Toutes les cartes collectées !";
        return;
    }

    const cardData = cardsToReveal[currentCardIndex];
    const isRare = (currentCardIndex === cardsToReveal.length - 1); // La dernière est rare

    // Créer l'élément visuel GRANDE carte
    const cardEl = document.createElement('div');
    cardEl.className = 'large-reveal-card';
    if (isRare) cardEl.classList.add('rare');
    
    // On utilise l'image HD pour le gros plan
    cardEl.style.backgroundImage = `url('${cardData.images.large}')`;

    // Événement : Quand on clique sur la carte
    cardEl.onclick = function() {
        // 1. Animation de sortie (vers le haut)
        cardEl.classList.add('slide-up');
        
        // 2. Ajouter la carte à la collection (sauvegarde)
        myCards.unshift(cardData.images.small);
        createCardElement(cardData.images.small, true);
        saveGame();

        // 3. Attendre la fin de l'anim (0.4s) puis passer à la suivante
        setTimeout(() => {
            activeCardContainer.removeChild(cardEl); // Supprimer l'ancienne
            currentCardIndex++; // Passer à la suivante
            showNextCard(); // Afficher la suivante
        }, 350); 
    };

    activeCardContainer.appendChild(cardEl);
}

function closeOverlay() {
    overlay.classList.add('hidden');
    updateUI();
}

// Création visuelle dans la collection (en bas)
function createCardElement(url, isNew) {
    const div = document.createElement('div');
    div.className = 'card';
    if (isNew) div.classList.add('new');
    div.style.backgroundImage = `url('${url}')`;
    
    if (grid.firstChild) grid.insertBefore(div, grid.firstChild);
    else grid.appendChild(div);
}

// Lancer le jeu
loadGame();
