// homepage.js
document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'caba87e4-c0fd-435e-b7e4-d01f58760d99'; // Gebruik dezelfde API key
    const apiUrlBase = 'https://api.pokemontcg.io/v2';

    // --- Mobile Nav & Footer Year (bestaand) ---
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    if (mobileNavToggle && mainNav) {
        mobileNavToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            mobileNavToggle.setAttribute('aria-expanded', mainNav.classList.contains('active'));
        });
    }
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Smooth scroll voor links met class 'scroll-link'
    document.querySelectorAll('a.scroll-link').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });


    // --- Functies voor nieuwe kaartsecties ---

    // Hulpfunctie om een kaart-DOM-element te maken (vereenvoudigd voor homepage)
    function createHomepageCardElement(cardData, isFromCollection = false) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('card-item'); // Gebruik bestaande .card-item class
        // Als je een link naar de kaart detail pagina wilt maken:
        // itemDiv.addEventListener('click', () => window.location.href = `card-detail.html?id=${cardData.id}`);

        itemDiv.innerHTML = `
            <div class="card-image-container">
                <img src="${cardData.images?.small || 'https://via.placeholder.com/150?text=No+Image'}" alt="${cardData.name}" loading="lazy">
            </div>
            <div class="card-info">
                <span class="card-name-link">${cardData.name}</span>
                <span class="card-number">#${cardData.number || 'N/A'}</span>
                ${cardData.rarity ? `<div class="card-icons"><span class="rarity-icon rarity-${cardData.rarity.toLowerCase().replace(/\s+/g, '-')}">${cardData.rarity}</span></div>` : ''}
            </div>
        `;
        return itemDiv;
    }

    // 1. Uitgelichte kaarten uit gebruiker zijn collecties
    async function loadHighlightedCards() {
        const highlightedCardsSection = document.getElementById('highlightedCardsSection');
        const grid = document.getElementById('highlightedCardsGrid');
        const noCardsMessage = document.getElementById('noHighlightedCardsMessage');
        if (!grid || !highlightedCardsSection || !noCardsMessage) return;

        grid.innerHTML = '<p class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Jouw kaarten laden...</p>';

        const savedCollectionsData = localStorage.getItem('pokemonTCGDeckMaster_Collections_v7'); // Gebruik de juiste key
        let allUserCards = [];
        if (savedCollectionsData) {
            try {
                const collections = JSON.parse(savedCollectionsData);
                collections.forEach(collection => {
                    collection.cards?.forEach(cardItem => {
                        // Zorg dat we de cardId hebben voor uniekheid en de snapshot voor weergave
                        if (cardItem.cardDataSnapshot && cardItem.cardId) {
                            allUserCards.push({ ...cardItem.cardDataSnapshot, id: cardItem.cardId });
                        }
                    });
                });
            } catch (e) {
                console.error("Fout bij laden collecties voor highlighted cards:", e);
            }
        }

        if (allUserCards.length === 0) {
            grid.innerHTML = ''; // Leeg de loader
            noCardsMessage.style.display = 'block';
            highlightedCardsSection.style.display = 'block'; // Zorg dat sectie zichtbaar is voor bericht
            return;
        }

        // Shuffle en neem een paar (max 6-8)
        const shuffled = allUserCards.sort(() => 0.5 - Math.random());
        const selectedCards = shuffled.slice(0, 8); // Maximaal 8 kaarten

        grid.innerHTML = ''; // Leeg de loader
        selectedCards.forEach(card => {
            grid.appendChild(createHomepageCardElement(card, true));
        });
        highlightedCardsSection.style.display = 'block';
        noCardsMessage.style.display = 'none';
    }

    // 2. Ontdek Willekeurige Kaarten van API
    async function loadDiscoverCards() {
        const grid = document.getElementById('discoverCardsGrid');
        if (!grid) return;

        grid.innerHTML = '<p class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Willekeurige kaarten laden...</p>';

        try {
            // Probeer kaarten te halen die afbeeldingen hebben en enigszins populair/interessant zijn
            // De API heeft geen "random" endpoint, dus we doen een query die hopelijk gevarieerde resultaten geeft.
            // We kunnen sorteren op bv. releaseDate desc en een willekeurige pagina nemen, of een brede query.
            // Voorbeeld: recente kaarten met een zekere zeldzaamheid.
            const randomPage = Math.floor(Math.random() * 10) + 1; // Willekeurige pagina tussen 1-10
            const response = await fetch(`${apiUrlBase}/cards?q=rarity:"Amazing Rare" OR rarity:"Shiny Holo Rare" OR rarity:"Illustration Rare" OR rarity:"Ultra Rare"&pageSize=12&page=${randomPage}&orderBy=-set.releaseDate`, {
                headers: { 'X-Api-Key': apiKey }
            });

            if (!response.ok) {
                throw new Error(`API Error ${response.status}`);
            }
            const data = await response.json();

            grid.innerHTML = ''; // Leeg de loader
            if (data.data && data.data.length > 0) {
                // Neem max 4-8 willekeurige kaarten van de resultaten
                const shuffled = data.data.sort(() => 0.5 - Math.random());
                const selectedCards = shuffled.slice(0, 8);
                selectedCards.forEach(card => {
                    grid.appendChild(createHomepageCardElement(card));
                });
            } else {
                grid.innerHTML = '<p>Kon geen willekeurige kaarten vinden op dit moment.</p>';
            }
        } catch (error) {
            console.error("Fout bij laden discover cards:", error);
            grid.innerHTML = '<p>Fout bij het laden van willekeurige kaarten.</p>';
        }
    }


    // 3. Bestaande "Mijn Opgeslagen Collecties" functie (licht aangepast om de juiste key te gebruiken)
    function loadAndDisplayHomepageCollections() {
        const collectionsGrid = document.getElementById('homepageCollectionsGrid');
        const noCollectionsMessage = document.querySelector('#myCollectionsSection .no-collections-message'); // Specifieker maken
        if (!collectionsGrid || !noCollectionsMessage) {
            console.warn("Homepage collection grid of message element niet gevonden.");
            return;
        }

        const savedCollectionsData = localStorage.getItem('pokemonTCGDeckMaster_Collections_v7'); // << GEBRUIK DE JUISTE KEY
        let collections = [];
        if (savedCollectionsData) {
            try {
                collections = JSON.parse(savedCollectionsData);
            } catch (e) {
                console.error("Fout bij laden collecties voor homepage:", e);
                collections = [];
            }
        }

        collectionsGrid.innerHTML = '';

        if (collections.length > 0) {
            noCollectionsMessage.style.display = 'none';
            collections.sort((a, b) => a.name.localeCompare(b.name)).forEach(collection => {
                const collectionCard = document.createElement('a');
                collectionCard.href = `collection-manager.html#collection=${collection.id}`;
                collectionCard.classList.add('collection-card-homepage');

                const uniqueCardCount = new Set(collection.cards?.map(c => c.cardId) || []).size;
                let uniqueSets = new Set();
                collection.cards?.forEach(cardItem => {
                    if (cardItem.cardDataSnapshot?.set?.name) {
                        uniqueSets.add(cardItem.cardDataSnapshot.set.name);
                    }
                });

                collectionCard.innerHTML = `
                    <h4><i class="fas fa-box"></i> ${collection.name}</h4>
                    <p class="collection-meta">${collection.language ? `${collection.language}` : 'Taal onbekend'}</p>
                    <div class="collection-stats">
                        <span><i class="fas fa-clone"></i> ${uniqueCardCount} Uniek</span>
                        <span><i class="fas fa-layer-group"></i> ${uniqueSets.size} Set${uniqueSets.size !== 1 ? 's' : ''}</span>
                    </div>
                    <span class="open-collection-btn">Open Collectie <i class="fas fa-arrow-right"></i></span>
                `;
                collectionsGrid.appendChild(collectionCard);
            });
        } else {
            if (!collectionsGrid.contains(noCollectionsMessage)) { // Voorkom dubbel toevoegen
                 collectionsGrid.appendChild(noCollectionsMessage);
            }
            noCollectionsMessage.style.display = 'block';
        }
    }

    // --- Roep de functies aan ---
    loadHighlightedCards();
    loadDiscoverCards();
    loadAndDisplayHomepageCollections(); // Bestaande functie
});