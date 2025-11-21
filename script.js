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
const debugBtn = document.getElementById('debug-btn');

// Éléments d'animation
const overlay = document.getElementById('overlay');
const boosterPack = document.getElementById('booster-pack');
const revealContainer = document.getElementById('reveal-container');
const tapHint = document.getElementById('tap-hint');

// --- EVENTS ---
pokeballBtn.addEventListener('click', clickBall);
shopBtn.addEventListener('click', buyBooster);

// TRICHE
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

// --- OUVERTURE BOOSTER (INSTANTANÉE) ---
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
        // ON NE MET PLUS AUCUNE PAUSE ARTIFICIELLE
        // Le booster s'ouvrira dès que l'internet a récupéré les images
        const randomPage = Math.floor(Math.random() * 100) + 1;
        
        const [commonReq, rareReq] = await Promise.all([
            fetch(`https://api.pokemontcg.io/v2/cards?page=${randomPage}&pageSize=4`),
            fetch(`https://api.pokemontcg.io/v2/cards?pageSize=1&q=rarity:"Rare Holo" OR rarity:"Rare Ultra" OR rarity:V OR rarity:VMAX`)
        ]);

        const commonData = await commonReq.json();
        const rareData = await rareReq.json();
        
        let newCards = [];
        if (commonData.data) newCards = [...commonData.data];
        if (rareData.data) newCards.push(rareData.data[0]);

        // BOUM : Ouverture immédiate
        boosterPack.className = 'opening';
        
        // Juste 0.1s pour voir l'effet d'explosion
        await new Promise(r => setTimeout(r, 100));
        boosterPack.style.display = 'none';

        if (newCards.length > 0) {
            displayRevealCards(newCards);
        } else {
            closeOverlay();
        }

    } catch (e) {
        console.error(e);
        closeOverlay();
        feedback.innerText = "Erreur connexion";
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
        
        // L'intervalle entre les cartes reste normal (0.1s) pour qu'on les distingue
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
