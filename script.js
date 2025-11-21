// --- VARIABLES ---
let coins = 0;
let price = 50;
let myCards = []; 

// --- CONFIGURATION ---
// Set actuel : Étincelles Déferlantes (SV8)
let currentSetId = 'sv8'; 

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

// Changement de set (Prêt pour le futur)
setSelector.addEventListener('change', (e) => {
    currentSetId = e.target.value;
});

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

// --- ACHAT BOOSTER OPTIMISÉ (RAPIDE) ---
async function buyBooster() {
    if (coins < price) return;

    // 1. Paiement
    coins -= price;
    updateUI();
    saveGame();

    shopBtn.innerText = "Ouverture...";
    shopBtn.classList.remove('active');

    try {
        // OPTIMISATION VITESSE :
        // Le set SV8 a environ 190-200 cartes.
        // 5 cartes par page = env 40 pages.
        // Pour éviter de tomber sur une page vide (ce qui prend du temps), on limite à 35.
        const maxPageSafe = 35; 
        const randomPage = Math.floor(Math.random() * maxPageSafe) + 1;

        // On lance la requête
        // On utilise Promise.race pour limiter le temps d'attente à 5 secondes max
        const fetchPromise = fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${currentSetId}&page=${randomPage}&pageSize=5`);
        
        // Timer de sécurité (si ça bug, on annule au bout de 5s)
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
        );

        const req = await Promise.race([fetchPromise, timeoutPromise]);
        const res = await req.json();
        
        if (res.data && res.data.length > 0) {
            let newPack = res.data;

            // Tri pour mettre la plus forte à la fin (la Rare)
            newPack.sort((a, b) => {
                const hpA = parseInt(a.hp) || 0;
                const hpB = parseInt(b.hp) || 0;
                return hpA - hpB;
            });

            startRevealSession(newPack);
        } else {
            // Si la page est vide (très rare maintenant), on rembourse
            alert("Erreur technique (Page vide), réessaie !");
            coins += price; // Remboursement
            updateUI();
        }

    } catch (e) {
        console.error(e);
        feedback.innerText = "Trop lent...";
        alert("La connexion est trop lente. Réessaie !");
        coins += price; // Remboursement
        updateUI();
    }
}

// --- RÉVÉLATION ---
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
        // Animation
        cardEl.classList.add('slide-up');
        
        // Ajout collection
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
        }, 250); // Transition un peu plus rapide (0.25s)
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
