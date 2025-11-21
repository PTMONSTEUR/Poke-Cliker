// --- VARIABLES ---
let coins = 0;
let price = 50;
let myCards = [];

// --- ÉLÉMENTS ---
const walletEl = document.getElementById('wallet');
const countEl = document.getElementById('count');
const shopBtn = document.getElementById('shop-btn');
const grid = document.getElementById('grid');
const feedback = document.getElementById('feedback');
const pokeballBtn = document.getElementById('pokeball-btn');
const debugBtn = document.getElementById('debug-btn'); // Bouton Triche

// Éléments d'animation
const overlay = document.getElementById('overlay');
const boosterPack = document.getElementById('booster-pack');
const revealContainer = document.getElementById('reveal-container');
const tapHint = document.getElementById('tap-hint');

// --- EVENTS ---
pokeballBtn.addEventListener('click', clickBall);
shopBtn.addEventListener('click', buyBooster);

// Événement TRICHE
if(debugBtn) {
    debugBtn.addEventListener('click', () => {
        coins += 10000; // On ajoute 10 000 !
        updateUI();
        saveGame();
        feedback.innerText = "TRICHE ACTIVÉE ! 🤑";
        feedback.style.color = "red";
    });
}

overlay.addEventListener('click', () => {
    if (revealContainer.children.length > 0) {
        closeOverlay();
    }
});

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

// --- OUVERTURE BOOSTER (VERSION RAPIDE) ---
async function buyBooster() {
    if (coins < price) return;

    coins -= price;
    price += 15; 
    updateUI();
    saveGame();

    // Animation START
    overlay.classList.remove('hidden');
    revealContainer.innerHTML = '';
    tapHint.style.display = 'none';
    
    boosterPack.style.display = 'flex';
    boosterPack.className = 'shaking'; 
    
    feedback.innerText = "Ouverture...";

    try {
        // On lance l'appel réseau MAIS on affiche l'ouverture dès que possible
        // Astuce : Promise.all permet de faire trembler le booster PENDANT le chargement
        
        const randomPage = Math.floor(Math.random() * 100) + 1;
        
        // Temps minimal de secousse réduit à 400ms seulement
        const minShakeTime = new Promise(resolve => setTimeout(resolve, 400));
        
        const [commonReq, rareReq] = await Promise.all([
            fetch(`https://api.pokemontcg.io/v2/cards?page=${randomPage}&pageSize=4`),
            fetch(`https://api.pokemontcg.io/v2/cards?pageSize=1&q=rarity:"Rare Holo" OR rarity:"Rare Ultra" OR rarity:V OR rarity:VMAX`),
            minShakeTime // On attend que ce timer finisse aussi
        ]);

        const commonData = await commonReq.json();
        const rareData = await rareReq.json();
        
        let newCards = [];
        if (commonData.data) newCards = [...commonData.data];
        if (rareData.data) newCards.push(rareData.data[0]);

        // POP ! Le booster éclate
        boosterPack.className = 'opening';
        
        // On attend juste 0.2s le temps de l'anim "opening" du CSS
        await new Promise(r => setTimeout(r, 200));
        boosterPack.style.display = 'none';

        if (newCards.length > 0) {
            displayRevealCards(newCards);
        } else {
            closeOverlay();
        }

    } catch (e) {
        console.error(e);
        closeOverlay();
    }
}

async function displayRevealCards(cardsData) {
    for (let i = 0; i < cardsData.length; i++) {
        const card = cardsData[i];
        const imgUrl = card.images.large; 
        const isRare = (i === cardsData.length - 1); 

        const cardEl = document.createElement('div');
        cardEl.className = 'reveal-card-slot';
        if (isRare) cardEl.classList.add('rare');
        
        cardEl.style.backgroundImage = `url('${imgUrl}')`;
        // Apparition très rapide (0.1s entre chaque carte)
        cardEl.style.animationDelay = `${i * 0.1}s`; 

        revealContainer.appendChild(cardEl);

        myCards.unshift(card.images.small);
        createCardElement(card.images.small, true);
    }
    
    saveGame();
    tapHint.style.display = 'block';
    feedback.innerText = "Booster ouvert !";
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
