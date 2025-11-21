// --- VARIABLES ---
let coins = 0;
let price = 50;
let myCards = []; 

// --- CONFIGURATION DES SETS ---
// On définit le set actuel sur 'sv8' (Surging Sparks / Étincelles Déferlantes)
let currentSetId = 'sv8'; 

// Variables temporaires
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

// Gestion du changement de set (Pour le futur)
setSelector.addEventListener('change', (e) => {
    currentSetId = e.target.value;
    // Ici on pourrait changer le visuel du booster en CSS
    alert("Set changé pour : " + currentSetId);
});

if(debugBtn) {
    debugBtn.addEventListener('click', () => {
        coins += 10000;
        updateUI();
        saveGame();
        feedback.innerText = "TRICHE: +10K 💰";
        feedback.style.color = "red";
    });
}

// --- SAUVEGARDE ---
function saveGame() {
    const data = { coins, price, cards: myCards };
    localStorage.setItem('pokeClickerSave', JSON.stringify(data));
}

function loadGame() {
    // --- RESET DEMANDÉ --- 
    // Si tu veux vraiment tout supprimer à chaque rechargement, laisse la ligne suivante.
    // Sinon, supprime la ligne 'localStorage.clear()' une fois le reset fait.
    
    // localStorage.clear(); // <--- LIGNE QUI RESET TOUT (À utiliser une fois)

    const saved = localStorage.getItem('pokeClickerSave');
    if (saved) {
        const data = JSON.parse(saved);
        coins = data.coins;
        price = data.price;
        myCards = data.cards || [];
        
        // Affichage
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
        shopBtn.innerText = `ACHETER BOOSTER\n(Set SV8 - ${price} 💰)`;
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

// --- ACHAT BOOSTER (CIBLÉ SUR LE SET SV8) ---
async function buyBooster() {
    if (coins < price) return;

    coins -= price;
    // Le prix n'augmente plus pour simplifier le test du nouveau set
    // price += 15; 
    updateUI();
    saveGame();

    shopBtn.innerText = "Génération du booster...";
    shopBtn.classList.remove('active');

    try {
        // ON CIBLE UNIQUEMENT LE SET 'sv8' (Surging Sparks)
        // Il y a environ 200+ cartes. On prend une page au hasard pour varier.
        // 250 cartes / 5 par page = 50 pages max.
        const randomPage = Math.floor(Math.random() * 40) + 1;

        // Requête ciblée sur le set
        const req = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${currentSetId}&page=${randomPage}&pageSize=5`);
        const res = await req.json();
        
        if (res.data && res.data.length > 0) {
            let newPack = res.data;

            // TRI STRATÉGIQUE :
            // On trie les cartes par PV (HP) pour mettre la plus forte à la fin (la Rare)
            newPack.sort((a, b) => {
                const hpA = parseInt(a.hp) || 0;
                const hpB = parseInt(b.hp) || 0;
                return hpA - hpB; // La plus forte sera la dernière
            });

            startRevealSession(newPack);
        } else {
            alert("Erreur: Pas de cartes trouvées dans ce set.");
            updateUI();
        }

    } catch (e) {
        console.error(e);
        feedback.innerText = "Erreur API";
        alert("Erreur de connexion au serveur Pokémon.");
        updateUI();
    }
}

// --- RÉVÉLATION (Focus une par une) ---
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
    
    // On essaie d'avoir l'image HD
    const imgUrl = cardData.images.large || cardData.images.small;
    cardEl.style.backgroundImage = `url('${imgUrl}')`;

    cardEl.onclick = function() {
        cardEl.classList.add('slide-up');
        
        // Sauvegarde
        myCards.unshift(cardData.images.small);
        createCardElement(cardData.images.small, true);
        saveGame();

        // Transition
        setTimeout(() => {
            if(cardEl.parentNode === activeCardContainer) {
                activeCardContainer.removeChild(cardEl);
            }
            currentCardIndex++;
            showNextCard();
        }, 300); 
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

// Pour forcer le reset au premier lancement de cette version :
// Décommente la ligne ci-dessous, lance le jeu une fois, puis recommente-la.
// localStorage.clear();

loadGame();
