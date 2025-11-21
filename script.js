let coins = 0;
let cardCount = 0;
let price = 50;

// Récupération des éléments HTML
const walletEl = document.getElementById('wallet');
const countEl = document.getElementById('count');
const shopBtn = document.getElementById('shop-btn');
const grid = document.getElementById('grid');
const feedback = document.getElementById('feedback');
const pokeballBtn = document.getElementById('pokeball-btn');

// Écouteurs d'événements (Clicks)
pokeballBtn.addEventListener('click', clickBall);
shopBtn.addEventListener('click', buyBooster);

// Fonction de mise à jour de l'interface
function updateUI() {
    walletEl.innerText = `💰 ${coins}`;
    countEl.innerText = `🃏 ${cardCount}`;
    
    if (coins >= price) {
        shopBtn.classList.add('active');
        shopBtn.innerText = `Ouvrir un Booster (${price} 💰)`;
    } else {
        shopBtn.classList.remove('active');
        shopBtn.innerText = `Besoin de ${price} 💰`;
    }
}

// Action: Clic sur la Pokéball
function clickBall() {
    const gain = Math.floor(Math.random() * 3) + 1; // Gain entre 1 et 3
    coins += gain;
    
    feedback.style.color = '#3b4cca';
    feedback.innerText = `+${gain}`;
    setTimeout(() => feedback.innerText = "", 500);

    updateUI();
}

// Action: Achat de booster
async function buyBooster() {
    if (coins < price) return;

    coins -= price;
    price += 15; // Augmentation du prix (Inflation)
    updateUI();

    shopBtn.classList.remove('active');
    shopBtn.innerText = "Chargement...";
    feedback.innerText = "Appel au Centre Pokémon...";

    try {
        // API Call
        const randomPage = Math.floor(Math.random() * 50) + 1;
        const req = await fetch(`https://api.pokemontcg.io/v2/cards?page=${randomPage}&pageSize=1`);
        const res = await req.json();
        
        if (res.data && res.data.length > 0) {
            addCard(res.data[0]);
            feedback.innerText = `Obtenu : ${res.data[0].name}`;
        } else {
            feedback.innerText = "Booster vide (Bug API)";
        }

    } catch (e) {
        console.error(e);
        feedback.innerText = "Erreur connexion";
    }
    updateUI();
}

// Ajout visuel de la carte
function addCard(data) {
    cardCount++;
    const div = document.createElement('div');
    div.className = 'card';
    div.style.backgroundImage = `url('${data.images.small}')`;
    
    // Insérer au début de la liste
    grid.insertBefore(div, grid.firstChild);
}

// Démarrage du jeu
updateUI();
