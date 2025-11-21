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

// Éléments d'animation
const overlay = document.getElementById('overlay');
const boosterPack = document.getElementById('booster-pack');
const revealContainer = document.getElementById('reveal-container');
const tapHint = document.getElementById('tap-hint');

// --- EVENTS ---
pokeballBtn.addEventListener('click', clickBall);
shopBtn.addEventListener('click', buyBooster);

// Clic pour fermer l'overlay une fois fini
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
        // Chargement inversé pour garder l'ordre récent en haut
        [...myCards].reverse().forEach(url => createCardElement(url, false)); 
    }
    updateUI();
}

// --- LOGIQUE ---
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

// --- SYSTÈME DE BOOSTER COMPLEXE ---
async function buyBooster() {
    if (coins < price) return;

    // 1. Paiement
    coins -= price;
    price += 15; // Augmente le prix
    updateUI();
    saveGame();

    // 2. Animation d'ouverture (Rapide !)
    overlay.classList.remove('hidden');
    revealContainer.innerHTML = ''; // Vider l'ancienne ouverture
    tapHint.style.display = 'none';
    
    boosterPack.style.display = 'flex';
    boosterPack.className = 'shaking'; // Ça tremble
    
    feedback.innerText = "Ouverture du paquet...";

    try {
        // 3. Récupération des cartes (4 Communes + 1 Rare)
        // On utilise Promise.all pour faire les 2 demandes en même temps (plus rapide)
        
        const randomPage = Math.floor(Math.random() * 100) + 1;
        
        const [commonReq, rareReq] = await Promise.all([
            // Demande A: 4 cartes "normales"
            fetch(`https://api.pokemontcg.io/v2/cards?page=${randomPage}&pageSize=4`),
            // Demande B: 1 carte "Rare" (Requête spécifique)
            fetch(`https://api.pokemontcg.io/v2/cards?pageSize=1&q=rarity:"Rare Holo" OR rarity:"Rare Ultra" OR rarity:V OR rarity:VMAX`)
        ]);

        const commonData = await commonReq.json();
        const rareData = await rareReq.json();
        
        // On combine les cartes
        let newCards = [];
        if (commonData.data) newCards = [...commonData.data];
        if (rareData.data) newCards.push(rareData.data[0]); // La rare en dernier

        // Pause courte pour l'effet "shaking"
        await new Promise(r => setTimeout(r, 800));

        // 4. Effet d'ouverture (Pop)
        boosterPack.className = 'opening';
        
        // Attendre la fin de l'anim d'ouverture (0.4s)
        await new Promise(r => setTimeout(r, 400));
        boosterPack.style.display = 'none';

        // 5. Afficher les cartes une par une
        if (newCards.length > 0) {
            displayRevealCards(newCards);
        } else {
            alert("Erreur API vide");
            closeOverlay();
        }

    } catch (e) {
        console.error(e);
        alert("Erreur de connexion Pokémon !");
        closeOverlay();
    }
}

// Fonction pour afficher les cartes style "Pocket"
async function displayRevealCards(cardsData) {
    for (let i = 0; i < cardsData.length; i++) {
        const card = cardsData[i];
        const imgUrl = card.images.large; // Grande image pour la révélation
        const isRare = (i === cardsData.length - 1); // La dernière est la rare

        const cardEl = document.createElement('div');
        cardEl.className = 'reveal-card-slot';
        if (isRare) cardEl.classList.add('rare');
        
        cardEl.style.backgroundImage = `url('${imgUrl}')`;
        cardEl.style.animationDelay = `${i * 0.2}s`; // Délai en cascade

        revealContainer.appendChild(cardEl);

        // Ajouter à la collection (sauvegarde)
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
    if (isNew) div.classList.add('new'); // Petit badge "New"
    div.style.backgroundImage = `url('${url}')`;
    
    if (grid.firstChild) grid.insertBefore(div, grid.firstChild);
    else grid.appendChild(div);
}

// Démarrage
loadGame();
