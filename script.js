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
const revealedCard = document.getElementById('revealed-card');

// --- EVENTS ---
pokeballBtn.addEventListener('click', clickBall);
shopBtn.addEventListener('click', buyBooster);

// Au clic sur l'overlay, on le ferme si une carte est affichée
overlay.addEventListener('click', () => {
    if (revealedCard.style.display === 'block') {
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
        myCards.forEach(url => createCardElement(url, false)); // False = pas d'anim au chargement
    }
    updateUI();
}

// --- LOGIQUE ---
function updateUI() {
    walletEl.innerText = `💰 ${coins}`;
    countEl.innerText = `🃏 ${myCards.length}`;
    
    if (coins >= price) {
        shopBtn.classList.add('active');
        shopBtn.innerText = `Ouvrir Booster (${price} 💰)`;
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

// --- LA FONCTION D'ANIMATION ---
async function buyBooster() {
    if (coins < price) return;

    // 1. Payer
    coins -= price;
    price += 10; // Inflation
    updateUI();
    saveGame();

    // 2. Lancer l'animation (Écran noir + Booster qui tremble)
    overlay.classList.remove('hidden');
    overlay.style.pointerEvents = 'all';
    boosterPack.style.display = 'block';
    boosterPack.classList.add('shaking');
    revealedCard.style.display = 'none'; // Cacher la vieille carte
    
    feedback.innerText = "Ouverture en cours...";

    try {
        // 3. Pendant l'animation, on cherche la carte (2 secondes de délai pour le suspense)
        const randomPage = Math.floor(Math.random() * 50) + 1;
        const req = await fetch(`https://api.pokemontcg.io/v2/cards?page=${randomPage}&pageSize=1`);
        const res = await req.json();
        
        // Petite pause forcée pour profiter de l'animation (2s)
        await new Promise(r => setTimeout(r, 2000));

        if (res.data && res.data.length > 0) {
            const cardData = res.data[0];
            const imageUrl = cardData.images.large; // On prend la grande image pour l'anim

            // 4. REVELATION !
            boosterPack.style.display = 'none'; // Cacher le booster
            boosterPack.classList.remove('shaking');
            
            revealedCard.style.backgroundImage = `url('${imageUrl}')`;
            revealedCard.style.display = 'block'; // Afficher la carte
            
            // Ajouter à la collection (sauvegarde)
            myCards.unshift(cardData.images.small);
            createCardElement(cardData.images.small, true);
            saveGame();
            
            feedback.innerText = `Tu as eu : ${cardData.name} !`;
            
        } else {
            closeOverlay();
            alert("Erreur: Booster vide !");
        }

    } catch (e) {
        console.error(e);
        closeOverlay();
        alert("Erreur de connexion !");
    }
}

function closeOverlay() {
    overlay.classList.add('hidden');
    setTimeout(() => {
        boosterPack.style.display = 'none';
        revealedCard.style.display = 'none';
    }, 300);
    updateUI();
}

function createCardElement(url, animate) {
    const div = document.createElement('div');
    div.className = 'card';
    div.style.backgroundImage = `url('${url}')`;
    if(!animate) div.style.animation = "none"; // Pas d'anim au rechargement de page
    
    if (grid.firstChild) grid.insertBefore(div, grid.firstChild);
    else grid.appendChild(div);
}

// Démarrage
loadGame();
