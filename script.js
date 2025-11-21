// --- VARIABLES DU JEU ---
let coins = 0;
let price = 50;
let myCards = []; // On stocke les cartes ici pour la sauvegarde

// --- ÉLÉMENTS HTML ---
const walletEl = document.getElementById('wallet');
const countEl = document.getElementById('count');
const shopBtn = document.getElementById('shop-btn');
const grid = document.getElementById('grid');
const feedback = document.getElementById('feedback');
const pokeballBtn = document.getElementById('pokeball-btn');

// --- ÉCOUTEURS D'ÉVÉNEMENTS ---
pokeballBtn.addEventListener('click', clickBall);
shopBtn.addEventListener('click', buyBooster);

// --- FONCTIONS DE SAUVEGARDE (Le Cerveau) ---

function saveGame() {
    const gameData = {
        coins: coins,
        price: price,
        cards: myCards
    };
    // On transforme l'objet en texte pour le navigateur
    localStorage.setItem('pokeClickerSave', JSON.stringify(gameData));
}

function loadGame() {
    const saved = localStorage.getItem('pokeClickerSave');
    if (saved) {
        const data = JSON.parse(saved);
        
        // On remet les valeurs
        coins = data.coins;
        price = data.price;
        myCards = data.cards || []; // Sécurité si vide

        // On réaffiche toutes les cartes sauvegardées
        myCards.forEach(cardImage => {
            createCardElement(cardImage);
        });
    }
    updateUI();
}

// --- LOGIQUE DU JEU ---

function updateUI() {
    walletEl.innerText = `💰 ${coins}`;
    countEl.innerText = `🃏 ${myCards.length}`;
    
    if (coins >= price) {
        shopBtn.classList.add('active');
        shopBtn.innerText = `Ouvrir un Booster (${price} 💰)`;
    } else {
        shopBtn.classList.remove('active');
        shopBtn.innerText = `Besoin de ${price} 💰`;
    }
}

function clickBall() {
    const gain = Math.floor(Math.random() * 3) + 1; 
    coins += gain;
    
    // Feedback visuel
    feedback.style.color = '#3b4cca';
    feedback.innerText = `+${gain}`;
    setTimeout(() => feedback.innerText = "", 500);

    updateUI();
    saveGame(); // Sauvegarde auto
}

async function buyBooster() {
    if (coins < price) return;

    coins -= price;
    price += 15; 
    updateUI();
    saveGame(); // Sauvegarde l'achat tout de suite

    shopBtn.classList.remove('active');
    shopBtn.innerText = "Chargement...";
    feedback.innerText = "Appel au Centre Pokémon...";

    try {
        const randomPage = Math.floor(Math.random() * 50) + 1;
        const req = await fetch(`https://api.pokemontcg.io/v2/cards?page=${randomPage}&pageSize=1`);
        const res = await req.json();
        
        if (res.data && res.data.length > 0) {
            const cardData = res.data[0];
            const imageUrl = cardData.images.small;
            
            // 1. Ajouter à la liste de sauvegarde
            myCards.unshift(imageUrl); // Ajoute au début de la liste
            
            // 2. Créer l'élément visuel
            createCardElement(imageUrl);
            
            feedback.innerText = `Obtenu : ${cardData.name}`;
            saveGame(); // Sauvegarde la nouvelle carte
        } else {
            feedback.innerText = "Booster vide (Bug API)";
            // On rembourse si bug ? Allez, soyons gentils
            coins += price - 15; 
            price -= 15;
        }

    } catch (e) {
        console.error(e);
        feedback.innerText = "Erreur connexion";
        // Remboursement en cas d'erreur
        coins += price - 15;
        price -= 15;
    }
    updateUI();
}

// Fonction qui crée juste le visuel (utilisée par Load et Buy)
function createCardElement(imageUrl) {
    const div = document.createElement('div');
    div.className = 'card';
    div.style.backgroundImage = `url('${imageUrl}')`;
    
    // Si c'est un chargement (pas d'animation souhaitée ? Si, on garde l'anim)
    // On insère toujours au début (comme myCards.unshift)
    // Note : Si on charge tout d'un coup, l'ordre sera inversé si on fait append, 
    // mais comme on boucle sur myCards, l'ordre dépendra de la boucle.
    // Ici, pour simplifier, on insère avant le premier enfant pour garder l'effet "pile".
    
    if (grid.firstChild) {
        grid.insertBefore(div, grid.firstChild);
    } else {
        grid.appendChild(div);
    }
}

// --- DÉMARRAGE ---
loadGame(); // On lance le chargement au démarrage
