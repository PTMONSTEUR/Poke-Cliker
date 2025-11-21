// --- VARIABLES DU JEU ---
let coins = 0;
let price = 50;
let myCards = []; // Stockage de la collection

// --- RÉCUPÉRATION DES ÉLÉMENTS HTML ---
const walletEl = document.getElementById('wallet');
const countEl = document.getElementById('count');
const shopBtn = document.getElementById('shop-btn');
const grid = document.getElementById('grid');
const feedback = document.getElementById('feedback');
const pokeballBtn = document.getElementById('pokeball-btn');
const debugBtn = document.getElementById('debug-btn');

// Éléments d'animation (Overlay & Booster)
const overlay = document.getElementById('overlay');
const boosterPack = document.getElementById('booster-pack');
const revealContainer = document.getElementById('reveal-container');
const tapHint = document.getElementById('tap-hint');

// --- ÉCOUTEURS D'ÉVÉNEMENTS ---
pokeballBtn.addEventListener('click', clickBall);
shopBtn.addEventListener('click', buyBooster);

// --- FONCTION DE TRICHE (DEBUG) ---
if(debugBtn) {
    debugBtn.addEventListener('click', () => {
        coins += 10000; 
        updateUI();
        saveGame();
        
        feedback.innerText = "TRICHE ACTIVÉE ! 🤑";
        feedback.style.color = "red";
        
        // Remet la couleur normale après 2 secondes
        setTimeout(() => feedback.style.color = "#666", 2000);
    });
}

// Fermer l'overlay quand on clique dessus (si le booster est ouvert)
overlay.addEventListener('click', () => {
    if (revealContainer.children.length > 0) {
        closeOverlay();
    }
});

// --- SYSTÈME DE SAUVEGARDE ---
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
        
        // On affiche les cartes (inversé pour voir les plus récentes en haut)
        [...myCards].reverse().forEach(url => createCardElement(url, false)); 
    }
    updateUI();
}

// --- INTERFACE UTILISATEUR (UI) ---
function updateUI() {
    walletEl.innerText = `💰 ${coins}`;
    countEl.innerText = `🃏 ${myCards.length}`;
    
    // Gestion du bouton d'achat
    if (coins >= price) {
        shopBtn.classList.add('active');
        shopBtn.innerText = `OUVRIR BOOSTER\n(5 Cartes - ${price} 💰)`;
    } else {
        shopBtn.classList.remove('active');
        const missing = price - coins;
        shopBtn.innerText = `Manque ${missing} 💰\n(Prix: ${price})`;
    }
}

// --- CLIC SUR LA POKÉBALL ---
function clickBall() {
    const gain = Math.floor(Math.random() * 3) + 1; // Gain entre 1 et 3
    coins += gain;
    
    feedback.style.color = '#3b4cca';
    feedback.innerText = `+${gain}`;
    
    // Efface le message après 0.5s
    setTimeout(() => feedback.innerText = "Clique !", 500);
    
    updateUI();
    saveGame();
}

// --- OUVERTURE DE BOOSTER (LOGIQUE PRINCIPALE) ---
async function buyBooster() {
    if (coins < price) return;

    // 1. Paiement
    coins -= price;
    price += 15; // Inflation
    updateUI();
    saveGame();

    // 2. Initialisation de l'animation
    overlay.classList.remove('hidden');
    revealContainer.innerHTML = ''; // Vide l'ancienne ouverture
    tapHint.style.display = 'none';
    
    boosterPack.style.display = 'flex';
    boosterPack.className = 'shaking'; // Le booster tremble
    
    feedback.innerText = "Connexion au réseau Pokémon...";

    try {
        // 3. Appel API (Double requête pour garantir une rare à la fin)
        const randomPage = Math.floor(Math.random() * 100) + 1;
        
        // On lance les deux requêtes en parallèle pour aller plus vite
        const [commonReq, rareReq] = await Promise.all([
            // 4 cartes communes/peu communes
            fetch(`https://api.pokemontcg.io/v2/cards?page=${randomPage}&pageSize=4`),
            // 1 carte Rare (Holo, V, VMAX, etc.)
            fetch(`https://api.pokemontcg.io/v2/cards?pageSize=1&q=rarity:"Rare Holo" OR rarity:"Rare Ultra" OR rarity:V OR rarity:VMAX`)
        ]);

        const commonData = await commonReq.json();
        const rareData = await rareReq.json();
        
        // On fusionne les résultats
        let newCards = [];
        if (commonData.data) newCards = [...commonData.data];
        if (rareData.data) newCards.push(rareData.data[0]);

        // 4. BOUM ! Ouverture immédiate dès que les données sont là
        boosterPack.className = 'opening'; // Animation d'éclatement
        
        // On attend juste 0.15s pour voir l'éclatement
        await new Promise(r => setTimeout(r, 150));
        boosterPack.style.display = 'none';

        // 5. Affichage des cartes
        if (newCards.length > 0) {
            displayRevealCards(newCards);
        } else {
            closeOverlay(); // Sécurité si l'API échoue
        }

    } catch (e) {
        console.error(e);
        closeOverlay();
        feedback.innerText = "Erreur de connexion internet";
        alert("Impossible de contacter le serveur Pokémon !");
    }
}

// Fonction qui affiche les cartes "révélées" au centre de l'écran
async function displayRevealCards(cardsData) {
    for (let i = 0; i < cardsData.length; i++) {
        const card = cardsData[i];
        const imgUrl = card.images.large; // Grande image HD
        const isRare = (i === cardsData.length - 1); // La dernière est la rare

        const cardEl = document.createElement('div');
        cardEl.className = 'reveal-card-slot';
        if (isRare) cardEl.classList.add('rare');
        
        cardEl.style.backgroundImage = `url('${imgUrl}')`;
        
        // Délai d'apparition en cascade (0.1s entre chaque carte)
        cardEl.style.animationDelay = `${i * 0.1}s`; 

        revealContainer.appendChild(cardEl);

        // Ajout à la collection (sauvegarde)
        myCards.unshift(card.images.small);
        createCardElement(card.images.small, true);
    }
    
    saveGame();
    tapHint.style.display = 'block'; // Affiche "Touche pour fermer"
    feedback.innerText = "Booster ouvert !";
}

// Fermer l'écran d'ouverture
function closeOverlay() {
    overlay.classList.add('hidden');
    updateUI();
}

// Créer l'élément visuel dans la collection (en bas)
function createCardElement(url, isNew) {
    const div = document.createElement('div');
    div.className = 'card';
    if (isNew) div.classList.add('new'); // Badge "NEW"
    div.style.backgroundImage = `url('${url}')`;
    
    // Ajout au début de la grille
    if (grid.firstChild) {
        grid.insertBefore(div, grid.firstChild);
    } else {
        grid.appendChild(div);
    }
}

// --- LANCEMENT DU JEU ---
loadGame();
