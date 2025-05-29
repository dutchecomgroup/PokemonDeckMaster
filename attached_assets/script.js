// SCRIPT.JS (v7.1 - Set Viewer Filters & Logo)
document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'caba87e4-c0fd-435e-b7e4-d01f58760d99';
    const apiUrlBase = 'https://api.pokemontcg.io/v2';
    console.log("TCG DeckMaster Script Initializing (v7.1)");

    // --- DOM Elementen ---
    let openCreateCollectionModalBtn, createCollectionModal, closeModalBtn, newCollectionNameInput,
        newCollectionLanguageSelect, createCollectionBtn, activeCollectionSelect, deleteCollectionButton,
        setListContainerElement, setListFilterInputElement, generalSearchInput, generalTypeFilterSelect,
        generalRarityFilterSelect, generalSearchButton, resetGeneralSearchButton, setProgressionSidebarDiv,
        setViewerSection, setSelectedSetNameSpan, setSelectedSetSymbolImg, setSelectedSetLogo, // Nieuw: setSelectedSetLogo
        searchInSetInput, setViewerTypeFilter, setViewerRarityFilter, // Nieuw: set-specifieke filters
        toggleCardViewBtn, sortSetCardsBtn, setCardGrid, setLoadingMessageSetViewer,
        myCollectedCardsViewerSection, myCollectedCardsCountSpan, searchInMyCollectionInput,
        filterMyCollectionBySetSelect, sortMyCollectedCardsBtn, myCollectedCardsGrid,
        myCollectedCardsLoadingMessage, generalSearchResultsSection, generalSearchLoadingMessage,
        generalSearchResultsGrid, welcomeMessageSection, viewMyCollectedCardsBtn, cardDetailModal,
        closeCardDetailModalBtn, modalCardImage, modalCardName, modalCardSet, modalCardNumber,
        modalCardRarity, modalCardTypes, modalCardHp, modalCardAttacks, modalQuantityDecrease,
        modalQuantityDisplay, modalQuantityIncrease, modalTcgPlayerLink, modalCardCollectionNameSpan,
        toastNotificationElement, toastMessageElement, activeViewIndicatorName,
        activeCollectionGlobalIndicator, activeCollectionNameGlobalSpan;

    // --- Applicatie State ---
    let allCollections = [];
    let activeCollectionId = null;
    let cachedAPIData = { sets: null, types: null, rarities: null, setCards: {}, cardDetails: {}, setCodeMap: {} };
    let currentSetCards = [];
    let myCurrentCollectedCardsData = [];
    let isFullImageView = false;
    let currentSetSortOrder = 'number_asc';
    let myCollectionSortOrder = 'name_asc';
    let currentlyDetailedCardId = null;
    let searchDebounceTimeout;
    let currentlySelectedSetIdInList = null;

    function assignDOMElements() {
        console.log("Assigning DOM elements...");
        openCreateCollectionModalBtn = document.getElementById('openCreateCollectionModalBtn');
        createCollectionModal = document.getElementById('createCollectionModal');
        closeModalBtn = createCollectionModal?.querySelector('.close-modal-btn');
        newCollectionNameInput = document.getElementById('newCollectionName');
        newCollectionLanguageSelect = document.getElementById('newCollectionLanguage');
        createCollectionBtn = document.getElementById('createCollectionBtn');
        activeCollectionSelect = document.getElementById('activeCollectionSelect');
        deleteCollectionButton = document.getElementById('deleteCollectionButton');
        setListContainerElement = document.getElementById('setListContainer');
        setListFilterInputElement = document.getElementById('setListFilterInput');
        generalSearchInput = document.getElementById('generalSearchInput');
        generalTypeFilterSelect = document.getElementById('generalTypeFilter');
        generalRarityFilterSelect = document.getElementById('generalRarityFilter');
        generalSearchButton = document.getElementById('generalSearchButton');
        resetGeneralSearchButton = document.getElementById('resetGeneralSearchButton');
        const setProgressionContainer = document.getElementById('setProgressionSidebar');
        setProgressionSidebarDiv = setProgressionContainer?.querySelector('.progress-content');
        setViewerSection = document.getElementById('setViewerSection');
        setSelectedSetNameSpan = document.getElementById('setSelectedSetName')?.querySelector('span');
        setSelectedSetSymbolImg = document.getElementById('setSelectedSetSymbol'); // Dit is nu het kleine symbool
        setSelectedSetLogo = document.getElementById('setSelectedSetLogo'); // Nieuw voor het grotere logo
        searchInSetInput = document.getElementById('searchInSetInput');
        setViewerTypeFilter = document.getElementById('setViewerTypeFilter'); // Nieuw
        setViewerRarityFilter = document.getElementById('setViewerRarityFilter'); // Nieuw
        toggleCardViewBtn = document.getElementById('toggleCardViewBtn');
        sortSetCardsBtn = document.getElementById('sortSetCardsBtn');
        setCardGrid = document.getElementById('setCardGrid');
        setLoadingMessageSetViewer = document.getElementById('setLoadingMessage');
        myCollectedCardsViewerSection = document.getElementById('myCollectedCardsViewerSection');
        myCollectedCardsCountSpan = document.getElementById('myCollectedCardsCount');
        searchInMyCollectionInput = document.getElementById('searchInMyCollectionInput');
        filterMyCollectionBySetSelect = document.getElementById('filterMyCollectionBySet');
        sortMyCollectedCardsBtn = document.getElementById('sortMyCollectedCardsBtn');
        myCollectedCardsGrid = document.getElementById('myCollectedCardsGrid');
        myCollectedCardsLoadingMessage = document.getElementById('myCollectedCardsLoadingMessage');
        generalSearchResultsSection = document.getElementById('generalSearchResultsSection');
        generalSearchLoadingMessage = document.getElementById('generalSearchLoadingMessage');
        generalSearchResultsGrid = document.getElementById('generalSearchResultsGrid');
        welcomeMessageSection = document.getElementById('welcomeMessageSection');
        viewMyCollectedCardsBtn = document.getElementById('viewMyCollectedCardsBtn');
        cardDetailModal = document.getElementById('cardDetailModal');
        closeCardDetailModalBtn = cardDetailModal?.querySelector('.close-modal-btn');
        modalCardImage = document.getElementById('modalCardImage');
        modalCardName = document.getElementById('modalCardName');
        modalCardSet = document.getElementById('modalCardSet');
        modalCardNumber = document.getElementById('modalCardNumber');
        modalCardRarity = document.getElementById('modalCardRarity');
        modalCardTypes = document.getElementById('modalCardTypes');
        modalCardHp = document.getElementById('modalCardHp');
        modalCardAttacks = document.getElementById('modalCardAttacks');
        modalQuantityDecrease = document.getElementById('modalQuantityDecrease');
        modalQuantityDisplay = document.getElementById('modalQuantityDisplay');
        modalQuantityIncrease = document.getElementById('modalQuantityIncrease');
        modalTcgPlayerLink = document.getElementById('modalTcgPlayerLink');
        modalCardCollectionNameSpan = document.getElementById('modalCardCollectionName');
        toastNotificationElement = document.getElementById('toastNotification');
        toastMessageElement = document.getElementById('toastMessage');
        activeViewIndicatorName = document.getElementById('currentViewName');
        activeCollectionGlobalIndicator = document.getElementById('activeCollectionIndicator');
        activeCollectionNameGlobalSpan = document.getElementById('activeCollectionNameGlobal');
        console.log("DOM elements assigned.");
    }

    // --- Hulpfuncties (onveranderd t.o.v. v7) ---
    function generateUUID() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); }); }
    function showLoading(element, text = "Laden...") { if (element) { element.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`; element.style.display = 'flex'; } }
    function hideLoading(element) { if (element) { element.style.display = 'none'; } }
    function showToast(message, type = 'info', duration = 3000) { if (!toastNotificationElement || !toastMessageElement) return; toastMessageElement.textContent = message; toastNotificationElement.className = 'toast-notification'; toastNotificationElement.classList.add(type, 'show'); setTimeout(() => { toastNotificationElement.classList.remove('show'); }, duration); }
    function debounce(func, delay) { return function(...args) { clearTimeout(searchDebounceTimeout); searchDebounceTimeout = setTimeout(() => func.apply(this, args), delay); }; }
    function updateActiveViewIndicator(viewName) { if(activeViewIndicatorName) activeViewIndicatorName.textContent = viewName; const activeCol = allCollections.find(c => c.id === activeCollectionId); if(activeCollectionGlobalIndicator && activeCollectionNameGlobalSpan){ if(activeCol) { activeCollectionNameGlobalSpan.textContent = activeCol.name; activeCollectionGlobalIndicator.style.display = 'inline'; } else { activeCollectionNameGlobalSpan.textContent = '-'; activeCollectionGlobalIndicator.style.display = 'none'; } } }
    function displaySection(sectionToShow, viewName = "Onbekend") { const sections = [setViewerSection, generalSearchResultsSection, welcomeMessageSection, myCollectedCardsViewerSection]; sections.forEach(section => { if(section) section.style.display = 'none'; }); if (sectionToShow && document.getElementById(sectionToShow.id)) { sectionToShow.style.display = 'block'; updateActiveViewIndicator(viewName); } else if (welcomeMessageSection) { welcomeMessageSection.style.display = 'block'; updateActiveViewIndicator("Welkom"); } else { console.error("Fallback welcomeMessageSection niet gevonden."); } }

    // --- API Communicatie (onveranderd t.o.v. v7) ---
    async function fetchAPIData(endpoint, params = {}, cacheKey = null, forceRefresh = false) { if (!forceRefresh && cacheKey) { if (endpoint.startsWith('cards/') && cachedAPIData.cardDetails[cacheKey]) return cachedAPIData.cardDetails[cacheKey]; if (!endpoint.startsWith('cards/') && cachedAPIData[cacheKey]) return cachedAPIData[cacheKey]; } const url = new URL(`${apiUrlBase}/${endpoint}`); Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value)); let loadingEl; if (endpoint === 'sets') loadingEl = setListContainerElement?.querySelector('.loading-indicator'); else if (endpoint.startsWith('cards') && params.q?.includes('set.id:')) loadingEl = setLoadingMessageSetViewer; else if (endpoint.startsWith('cards')) loadingEl = generalSearchLoadingMessage; if (loadingEl && endpoint !== 'sets') showLoading(loadingEl); try { const response = await fetch(url, { headers: { 'X-Api-Key': apiKey } }); if (!response.ok) { const errorData = await response.json().catch(() => ({ error: { message: "Kon error response niet parsen" }})); throw new Error(`API Error ${response.status}: ${errorData.error?.message || `Kon data voor ${endpoint} niet ophalen`}`); } const data = await response.json(); if (cacheKey) { if (endpoint.startsWith('cards/')) cachedAPIData.cardDetails[cacheKey] = data; else cachedAPIData[cacheKey] = data; } return data; } catch (error) { console.error(`Fout bij ophalen van ${endpoint}:`, error); showToast(`API Fout: ${error.message}`, 'error'); if (endpoint === 'sets' && setListContainerElement) setListContainerElement.innerHTML = `<p>API Fout bij laden sets. Probeer later opnieuw.</p>`; return null; } finally { if (loadingEl && endpoint !== 'sets') hideLoading(loadingEl); } }


    // --- Initialisatie ---
    async function initializePrimaryData() {
        console.log("Initializing primary data (sets, types, rarities)...");
        if (setListContainerElement) {
             setListContainerElement.innerHTML = '<p class="loading-indicator small-indicator"><i class="fas fa-spinner fa-spin"></i> Sets laden...</p>';
        }

        const [setsData, typesData, raritiesData] = await Promise.all([
            fetchAPIData('sets', { orderBy: "releaseDate_desc" }, 'sets'),
            fetchAPIData('types', {}, 'types'),
            fetchAPIData('rarities', {}, 'rarities')
        ]);

        if (setListContainerElement) setListContainerElement.innerHTML = '';

        if (setsData && setsData.data) {
            cachedAPIData.sets = setsData;
            cachedAPIData.setCodeMap = {};
            const setsByYear = setsData.data.reduce((acc, set) => {
                let year = 'Unknown Year';
                if (set?.releaseDate) { try { year = new Date(set.releaseDate).getFullYear() || 'Unknown Year'; } catch (e) {/* default */} }
                if (!acc[year]) acc[year] = [];
                acc[year].push(set);
                return acc;
            }, {});
            const sortedYears = Object.keys(setsByYear).sort((a, b) => (a === 'Unknown Year') ? 1 : (b === 'Unknown Year') ? -1 : b - a);
            sortedYears.forEach(year => {
                const yearGroupDiv = document.createElement('div');
                yearGroupDiv.classList.add('year-group');
                const yearHeader = document.createElement('h4');
                yearHeader.classList.add('year-header');
                yearHeader.textContent = year;
                yearGroupDiv.appendChild(yearHeader);
                setsByYear[year].forEach(set => {
                    if (!set?.id || !set?.name) return;
                    const setItem = document.createElement('a');
                    setItem.href = `#set-${set.id}`; setItem.classList.add('set-item');
                    setItem.dataset.setId = set.id; setItem.dataset.setName = set.name.toLowerCase();
                    const symbol = document.createElement('img');
                    symbol.classList.add('set-item-symbol'); symbol.src = set.images?.symbol || 'https://via.placeholder.com/20?text=?'; symbol.alt = "";
                    const nameSpan = document.createElement('span');
                    nameSpan.classList.add('set-item-name'); nameSpan.textContent = set.name;
                    const dateSpan = document.createElement('span');
                    dateSpan.classList.add('set-item-date');
                    let displayDate = 'N/A';
                    if (set.releaseDate) try { displayDate = new Date(set.releaseDate).toLocaleDateString('nl-NL', {day:'2-digit', month:'2-digit'}); } catch(e) {}
                    dateSpan.textContent = `(${displayDate})`;
                    setItem.append(symbol, nameSpan, dateSpan);
                    setItem.addEventListener('click', (e) => { e.preventDefault(); currentlySelectedSetIdInList = set.id; loadAndDisplaySetCards(set.id); updateSetListActiveState(); });
                    yearGroupDiv.appendChild(setItem);
                    if (set.ptcgoCode) cachedAPIData.setCodeMap[set.ptcgoCode.toUpperCase()] = set.id;
                    const abbr = set.name.replace(/[^A-Z0-9]/ig, "").substring(0, 3).toUpperCase();
                    if (abbr && !cachedAPIData.setCodeMap[abbr]) cachedAPIData.setCodeMap[abbr] = set.id;
                });
                setListContainerElement?.appendChild(yearGroupDiv);
            });
        } else if (setListContainerElement) {
            setListContainerElement.innerHTML = "<p>Kon sets niet laden.</p>";
        }

        if (typesData && typesData.data && generalTypeFilterSelect) {
            generalTypeFilterSelect.innerHTML = '<option value="">Alle Types</option>';
            typesData.data.sort().forEach(type => { const opt = document.createElement('option'); opt.value = type; opt.textContent = type; generalTypeFilterSelect.appendChild(opt); });
        }
        if (raritiesData && raritiesData.data && generalRarityFilterSelect) {
            generalRarityFilterSelect.innerHTML = '<option value="">Alle Zeldzaamheden</option>';
            raritiesData.data.sort().forEach(rarity => { const opt = document.createElement('option'); opt.value = rarity; opt.textContent = rarity; generalRarityFilterSelect.appendChild(opt); });
        }
        console.log("Primary data initialization complete.");
    }

    function updateSetListActiveState() { setListContainerElement?.querySelectorAll('.set-item').forEach(item => { item.classList.toggle('active', item.dataset.setId === currentlySelectedSetIdInList); }); }
    const debouncedFilterSetList = debounce(() => { if (!setListContainerElement || !setListFilterInputElement) return; const filterText = setListFilterInputElement.value.toLowerCase(); setListContainerElement.querySelectorAll('.set-item').forEach(item => { item.style.display = item.dataset.setName.includes(filterText) ? '' : 'none'; }); setListContainerElement.querySelectorAll('.year-group').forEach(group => { const visible = Array.from(group.querySelectorAll('.set-item')).some(it => it.style.display !== 'none'); group.style.display = visible ? '' : 'none'; }); }, 300);

    // --- Collectie Beheer (onveranderd t.o.v. v7) ---
    function openCollectionModal() { if(createCollectionModal) createCollectionModal.style.display = 'block'; if(newCollectionNameInput) newCollectionNameInput.focus(); }
    function closeCollectionModal() { if(createCollectionModal) createCollectionModal.style.display = 'none'; if(newCollectionNameInput) newCollectionNameInput.value = ''; if(newCollectionLanguageSelect) newCollectionLanguageSelect.value = ''; } // Was Engels, nu leeg.
    function handleCreateCollection() { const name = newCollectionNameInput?.value.trim(); const language = newCollectionLanguageSelect?.value; if (!name) { showToast('Geef de collectie een naam.', 'error'); newCollectionNameInput?.focus(); return; } if (allCollections.find(c => c.name.toLowerCase() === name.toLowerCase())) { showToast('Een collectie met deze naam bestaat al.', 'error'); newCollectionNameInput?.focus(); return; } const newCollection = { id: generateUUID(), name, language: language || null, cards: [], createdAt: new Date().toISOString() }; allCollections.push(newCollection); saveAllCollections(); renderActiveCollectionSelector(); setActiveCollection(newCollection.id); closeCollectionModal(); showToast(`Collectie "${name}" aangemaakt!`, 'success');}
    function renderActiveCollectionSelector() { if (!activeCollectionSelect) return; activeCollectionSelect.innerHTML = '<option value="">Kies een collectie...</option>'; allCollections.sort((a,b) => a.name.localeCompare(b.name)).forEach(c => { const option = document.createElement('option'); option.value = c.id; option.textContent = `${c.name}${c.language ? ` (${c.language})` : ''}`; if (c.id === activeCollectionId) option.selected = true; activeCollectionSelect.appendChild(option); }); }
    function setActiveCollection(collectionId) { console.log("Setting active collection to:", collectionId); activeCollectionId = collectionId; currentlySelectedSetIdInList = null; updateSetListActiveState(); const currentCollection = allCollections.find(c => c.id === activeCollectionId); if (deleteCollectionButton) deleteCollectionButton.style.display = currentCollection ? 'inline-flex' : 'none'; let currentView = "Welkom"; const visibleSection = [setViewerSection, myCollectedCardsViewerSection, generalSearchResultsSection, welcomeMessageSection].find(s => s?.style.display === 'block'); if (visibleSection) { if (visibleSection === setViewerSection && setSelectedSetNameSpan?.textContent !== '-') currentView = `Set: ${setSelectedSetNameSpan.textContent}`; else if (visibleSection === myCollectedCardsViewerSection) currentView = "Mijn Verzamelde Kaarten"; else if (visibleSection === generalSearchResultsSection) currentView = "Zoekresultaten"; } updateActiveViewIndicator(currentView); if (currentCollection) { if (myCollectedCardsViewerSection?.style.display === 'block') loadAndDisplayMyCollectedCards(); else if (setViewerSection?.style.display === 'block' && currentSetCards.length > 0) renderSetCards(currentSetCards); renderSetProgression(); } else { if (setViewerSection?.style.display === 'block') renderSetCards(currentSetCards); if (myCollectedCardsViewerSection?.style.display === 'block') loadAndDisplayMyCollectedCards(); if (setProgressionSidebarDiv) setProgressionSidebarDiv.innerHTML = '<p>Selecteer een collectie.</p>'; } saveActiveCollectionId(); }
    function handleDeleteCollection() { if (!activeCollectionId) return; const collectionToDelete = allCollections.find(c => c.id === activeCollectionId); if (!collectionToDelete) return; if (confirm(`Weet je zeker dat je de collectie "${collectionToDelete.name}" en alle kaarten daarin wilt verwijderen?`)) { const oldName = collectionToDelete.name; allCollections = allCollections.filter(c => c.id !== activeCollectionId); const newActiveId = allCollections.length > 0 ? allCollections.sort((a,b)=>a.name.localeCompare(b.name))[0].id : null; saveAllCollections(); renderActiveCollectionSelector(); setActiveCollection(newActiveId); showToast(`Collectie "${oldName}" verwijderd.`, 'info'); if (!newActiveId) displaySection(welcomeMessageSection, "Welkom"); } }
    function getCardInCollection(cardId) { if (!activeCollectionId) return null; const activeCollection = allCollections.find(c => c.id === activeCollectionId); return activeCollection?.cards.find(item => item.cardId === cardId); }
    function updateCardQuantityInCollection(cardDataObject, change, fromModal = false) { if (!activeCollectionId) { if (!fromModal) showToast('Selecteer eerst een actieve collectie.', 'error'); return; } const activeCollection = allCollections.find(c => c.id === activeCollectionId); if (!activeCollection) return; let collectionItem = activeCollection.cards.find(item => item.cardId === cardDataObject.id); const oldQuantity = collectionItem ? collectionItem.quantity : 0; let newQuantity = Math.max(0, oldQuantity + change); let actionTaken = ''; if (newQuantity > 0) { if (collectionItem) { collectionItem.quantity = newQuantity; } else { const fullCardData = cardDataObject.attacks ? cardDataObject : (cachedAPIData.cardDetails[cardDataObject.id]?.data || cardDataObject); activeCollection.cards.push({ cardId: fullCardData.id, quantity: newQuantity, cardDataSnapshot: { name: fullCardData.name, number: fullCardData.number, images: { small: fullCardData.images?.small, large: fullCardData.images?.large }, set: { id: fullCardData.set?.id, name: fullCardData.set?.name, series: fullCardData.set?.series, printedTotal: fullCardData.set?.printedTotal, images: fullCardData.set?.images }, rarity: fullCardData.rarity, types: fullCardData.types, hp: fullCardData.hp, attacks: fullCardData.attacks, abilities: fullCardData.abilities, tcgplayer: fullCardData.tcgplayer } }); } actionTaken = (change > 0 && oldQuantity === 0) ? 'toegevoegd' : (change > 0 ? 'verhoogd' : 'verminderd'); } else { if (oldQuantity > 0) { activeCollection.cards = activeCollection.cards.filter(item => item.cardId !== cardDataObject.id); actionTaken = 'verwijderd'; } } if (actionTaken) { saveAllCollections(); showToast(`Kaart "${cardDataObject.name}" ${actionTaken} (nu ${newQuantity}).`, 'success'); if (setViewerSection?.style.display === 'block') renderSetCards(currentSetCards); if (myCollectedCardsViewerSection?.style.display === 'block') loadAndDisplayMyCollectedCards(); if (generalSearchResultsGrid?.querySelector(`.card-item[data-card-id="${cardDataObject.id}"]`)) { const generalCardEl = generalSearchResultsGrid.querySelector(`.card-item[data-card-id="${cardDataObject.id}"]`); if(generalCardEl) updateCardElementQuantity(generalCardEl, newQuantity); } renderSetProgression(); if (fromModal && cardDetailModal?.style.display === 'block' && currentlyDetailedCardId === cardDataObject.id) { if(modalQuantityDisplay) modalQuantityDisplay.textContent = newQuantity.toString(); if(modalQuantityDecrease) modalQuantityDecrease.disabled = (newQuantity === 0 || !activeCollectionId); if(modalQuantityIncrease) modalQuantityIncrease.disabled = !activeCollectionId; } } }
    function updateCardElementQuantity(cardElement, quantity) { const quantityDisplay = cardElement.querySelector('.quantity-display'); const decreaseBtn = cardElement.querySelector('.quantity-decrease'); if (quantityDisplay) quantityDisplay.textContent = quantity; if (decreaseBtn) decreaseBtn.disabled = (quantity <= 0); }

    // --- Set Viewer ---
    function populateSetSpecificFilters(cardsInSet) { // << NIEUWE FUNCTIE
        if (!setViewerTypeFilter || !setViewerRarityFilter) return;

        const uniqueTypes = new Set();
        const uniqueRarities = new Set();

        cardsInSet.forEach(card => {
            card.types?.forEach(type => uniqueTypes.add(type));
            if (card.rarity) uniqueRarities.add(card.rarity);
        });

        setViewerTypeFilter.innerHTML = '<option value="">Alle Types</option>';
        Array.from(uniqueTypes).sort().forEach(type => {
            const opt = document.createElement('option'); opt.value = type; opt.textContent = type;
            setViewerTypeFilter.appendChild(opt);
        });

        setViewerRarityFilter.innerHTML = '<option value="">Alle Zeldzaamheden</option>';
        Array.from(uniqueRarities).sort((a,b) => a.localeCompare(b)).forEach(rarity => { // Standaard alfabetisch
            const opt = document.createElement('option'); opt.value = rarity; opt.textContent = rarity;
            setViewerRarityFilter.appendChild(opt);
        });
    }

    async function loadAndDisplaySetCards(setId) {
        console.log(`Loading and displaying set cards for: ${setId}`);
        currentlySelectedSetIdInList = setId;
        updateSetListActiveState();

        if (!setViewerSection || !setSelectedSetNameSpan || !setCardGrid || !setLoadingMessageSetViewer || !setSelectedSetSymbolImg || !setSelectedSetLogo) {
            console.error("Set viewer DOM elements ontbreken."); return;
        }
        if (!setId) {
            currentSetCards = []; setCardGrid.innerHTML = ""; setSelectedSetNameSpan.textContent = "-";
            setSelectedSetSymbolImg.style.display = 'none'; setSelectedSetLogo.style.display = 'none';
            displaySection(welcomeMessageSection, "Welkom"); return;
        }

        const selectedSetObject = cachedAPIData.sets?.data.find(s => s.id === setId);
        displaySection(setViewerSection, selectedSetObject ? `Set: ${selectedSetObject.name}` : "Set Browser");
        showLoading(setLoadingMessageSetViewer, "Set kaarten laden...");

        setSelectedSetNameSpan.textContent = selectedSetObject?.name || setId;
        if (selectedSetObject?.images?.logo && setSelectedSetLogo) { // Voor groot logo
            setSelectedSetLogo.src = selectedSetObject.images.logo;
            setSelectedSetLogo.alt = `${selectedSetObject.name} Logo`;
            setSelectedSetLogo.style.display = 'block';
        } else if (setSelectedSetLogo) {
            setSelectedSetLogo.style.display = 'none';
        }
        if (selectedSetObject?.images?.symbol && setSelectedSetSymbolImg) { // Voor klein symbool
            setSelectedSetSymbolImg.src = selectedSetObject.images.symbol;
            setSelectedSetSymbolImg.alt = `${selectedSetObject.name} Symbool`;
            setSelectedSetSymbolImg.style.display = 'inline';
        } else if (setSelectedSetSymbolImg) {
            setSelectedSetSymbolImg.style.display = 'none';
        }

        if(searchInSetInput) searchInSetInput.value = "";
        if(setViewerTypeFilter) setViewerTypeFilter.value = "";
        if(setViewerRarityFilter) setViewerRarityFilter.value = "";

        currentSetCards = [];
        const cached = cachedAPIData.setCards[setId];
        if (cached) {
            currentSetCards = cached;
        } else {
            const response = await fetchAPIData('cards', { q: `set.id:${setId}`, pageSize: 250, orderBy: 'number' });
            if (response && response.data) {
                currentSetCards = response.data.sort(sortByCardNumber);
                cachedAPIData.setCards[setId] = currentSetCards;
            } else {
                showToast(`Kon kaarten voor set ${selectedSetObject?.name || setId} niet laden.`, 'error');
            }
        }

        populateSetSpecificFilters(currentSetCards); // << Vul filters NAdat kaarten geladen zijn

        hideLoading(setLoadingMessageSetViewer);
        renderSetCards(currentSetCards);
        if (activeCollectionId) renderSetProgression();
    }

    function sortByCardNumber(a, b) { const numA = (a.number || "").toString(); const numB = (b.number || "").toString(); const matchA = numA.match(/^([a-zA-Z-]*)(\d+)([a-zA-Z]*)$/); const matchB = numB.match(/^([a-zA-Z-]*)(\d+)([a-zA-Z]*)$/); if (matchA && matchB) { if (matchA[1] !== matchB[1]) return matchA[1].localeCompare(matchB[1]); if (parseInt(matchA[2]) !== parseInt(matchB[2])) return parseInt(matchA[2]) - parseInt(matchB[2]); return matchA[3].localeCompare(matchB[3]); } return numA.localeCompare(numB, "en", { numeric: true }); }

    // Aangepast om de extra set-specifieke filters mee te nemen
    function sortAndFilterCards(cards, sortOrder, searchTerm, filterType, filterRarity) {
        let processed = [...cards];

        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            processed = processed.filter(c => c.name.toLowerCase().includes(s) || (c.number && c.number.toString().toLowerCase().includes(s)));
        }
        if (filterType) {
            processed = processed.filter(c => c.types?.includes(filterType));
        }
        if (filterRarity) {
            processed = processed.filter(c => c.rarity === filterRarity);
        }

        switch (sortOrder) {
            case 'number_asc': processed.sort(sortByCardNumber); break;
            case 'number_desc': processed.sort((a, b) => sortByCardNumber(b, a)); break;
            case 'name_asc': processed.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'name_desc': processed.sort((a, b) => b.name.localeCompare(a.name)); break;
            case 'set_asc': processed.sort((a, b) => { const sa = a.set?.name||''; const sb = b.set?.name||''; const sc = sa.localeCompare(sb); return sc !== 0 ? sc : sortByCardNumber(a,b); }); break;
            default: console.warn("Onbekende sorteervolgorde:", sortOrder);
        }
        return processed;
    }

    function renderSetCards(cardsToRender) { // cardsToRender is currentSetCards
        if (!setCardGrid) return;
        setCardGrid.innerHTML = "";

        const filteredAndSorted = sortAndFilterCards(
            cardsToRender,
            currentSetSortOrder,
            searchInSetInput?.value || "",
            setViewerTypeFilter?.value || "", // Gebruik set-specifieke filters
            setViewerRarityFilter?.value || ""  // Gebruik set-specifieke filters
        );

        if (filteredAndSorted.length === 0) {
            setCardGrid.innerHTML = currentlySelectedSetIdInList ? "<p>Geen kaarten gevonden die voldoen aan de filters.</p>" : "<p>Selecteer een set om kaarten te zien.</p>";
            return;
        }
        const fragment = document.createDocumentFragment();
        filteredAndSorted.forEach(card => fragment.appendChild(createVisualCardElement(card)));
        setCardGrid.appendChild(fragment);
    }
    const debouncedFilterSetCards = debounce(() => renderSetCards(currentSetCards), 300); // Voor naam/nummer input


    // --- "Mijn Verzamelde Kaarten" View (Logica voor filters blijft hier, los van set-viewer) ---
    function loadAndDisplayMyCollectedCards() { if (!myCollectedCardsViewerSection || !myCollectedCardsGrid) { displaySection(welcomeMessageSection, "Welkom"); return; } displaySection(myCollectedCardsViewerSection, "Mijn Verzamelde Kaarten"); if (!activeCollectionId) { myCurrentCollectedCardsData = []; myCollectedCardsGrid.innerHTML = "<p>Selecteer eerst een actieve collectie.</p>"; if(myCollectedCardsCountSpan) myCollectedCardsCountSpan.textContent = '0'; populateMyCollectionFilterDropdowns(null); return; } showLoading(myCollectedCardsLoadingMessage, "Mijn kaarten laden..."); const activeCollection = allCollections.find(c => c.id === activeCollectionId); if (!activeCollection || activeCollection.cards.length === 0) { myCurrentCollectedCardsData = []; myCollectedCardsGrid.innerHTML = "<p>Je hebt nog geen kaarten in deze collectie.</p>"; if(myCollectedCardsCountSpan) myCollectedCardsCountSpan.textContent = '0'; hideLoading(myCollectedCardsLoadingMessage); populateMyCollectionFilterDropdowns(activeCollection); return; } myCurrentCollectedCardsData = activeCollection.cards.map(item => ({ ...item.cardDataSnapshot, id: item.cardId, quantity: item.quantity })); hideLoading(myCollectedCardsLoadingMessage); renderMyCollectedCards(); populateMyCollectionFilterDropdowns(activeCollection); }
    function renderMyCollectedCards() { if (!myCollectedCardsGrid) return; myCollectedCardsGrid.innerHTML = ""; let cardsToDisplay = sortAndFilterCards(myCurrentCollectedCardsData, myCollectionSortOrder, searchInMyCollectionInput?.value || ""); const selectedSetFilter = filterMyCollectionBySetSelect?.value; if (selectedSetFilter) { cardsToDisplay = cardsToDisplay.filter(card => card.set?.id === selectedSetFilter); } if(myCollectedCardsCountSpan) myCollectedCardsCountSpan.textContent = cardsToDisplay.length.toString(); if (cardsToDisplay.length === 0) { myCollectedCardsGrid.innerHTML = "<p>Geen kaarten gevonden die voldoen aan de filters.</p>"; return; } const fragment = document.createDocumentFragment(); cardsToDisplay.forEach(cardData => fragment.appendChild(createVisualCardElement(cardData))); myCollectedCardsGrid.appendChild(fragment); }
    const debouncedRenderMyCollectedCards = debounce(renderMyCollectedCards, 300);
    function populateMyCollectionFilterDropdowns(activeCollection) { if (!filterMyCollectionBySetSelect) return; filterMyCollectionBySetSelect.innerHTML = '<option value="">Alle Sets in Collectie</option>'; if (!activeCollection || activeCollection.cards.length === 0) return; const uniqueSets = new Map(); activeCollection.cards.forEach(item => { if (item.cardDataSnapshot?.set?.id && item.cardDataSnapshot?.set?.name) { uniqueSets.set(item.cardDataSnapshot.set.id, item.cardDataSnapshot.set.name); } }); Array.from(uniqueSets.entries()).sort((a, b) => a[1].localeCompare(b[1])).forEach(([setId, setName]) => { const option = document.createElement('option'); option.value = setId; option.textContent = setName; filterMyCollectionBySetSelect.appendChild(option); }); }

    // --- Algemeen Zoeken (gebruikt *general* Type/Rarity filters) ---
    async function performGeneralSearch() { if (!generalSearchInput || !generalSearchResultsGrid) return; const query = generalSearchInput.value.trim(); const type = generalTypeFilterSelect?.value; const rarity = generalRarityFilterSelect?.value; let apiQueryParts = []; let viewName = "Zoekresultaten"; if (!query && !type && !rarity) { generalSearchResultsGrid.innerHTML = '<p>Voer een zoekterm of filters in.</p>'; displaySection(generalSearchResultsSection, viewName); return; } displaySection(generalSearchResultsSection, viewName); showLoading(generalSearchLoadingMessage); generalSearchResultsGrid.innerHTML = ''; const cardCodeRegex = /^([A-Z0-9]{2,5})\s*([A-Z0-9\/]+(?:[a-z])?)$/i; const codeMatch = query.match(cardCodeRegex); if (codeMatch) { const inputSetCode = codeMatch[1].toUpperCase(); const cardNumber = codeMatch[2]; let setId = cachedAPIData.setCodeMap[inputSetCode] || cachedAPIData.sets?.data.find(s => s.id.toUpperCase() === inputSetCode || s.ptcgoCode?.toUpperCase() === inputSetCode)?.id; if (setId) { apiQueryParts.push(`set.id:${setId} number:"${cardNumber}"`); viewName = `Resultaten voor: ${inputSetCode} ${cardNumber}`; if (generalTypeFilterSelect) generalTypeFilterSelect.value = ""; if (generalRarityFilterSelect) generalRarityFilterSelect.value = ""; } else { showToast(`Setcode "${inputSetCode}" niet herkend. Zoeken op naam.`, 'info'); apiQueryParts.push(`name:"*${query}*"`); } } else if (query) { apiQueryParts.push(query.includes(' ') ? `name:"${query}"` : `name:"*${query}*"`); } if (type) apiQueryParts.push(`types:${type}`); if (rarity) apiQueryParts.push(`rarity:"${rarity}"`); if (apiQueryParts.length === 0) { hideLoading(generalSearchLoadingMessage); generalSearchResultsGrid.innerHTML = '<p>Ongeldige zoekopdracht.</p>'; return; } const finalQuery = apiQueryParts.join(' '); updateActiveViewIndicator(viewName); const response = await fetchAPIData('cards', { q: finalQuery, pageSize: 50, orderBy: 'set.releaseDate,number,name' }); hideLoading(generalSearchLoadingMessage); if (response && response.data && response.data.length > 0) { response.data.forEach(card => generalSearchResultsGrid.appendChild(createVisualCardElement(card))); } else { generalSearchResultsGrid.innerHTML = '<p>Geen kaarten gevonden.</p>'; } }
    const debouncedPerformGeneralSearch = debounce(performGeneralSearch, 400);

    // --- Kaart Weergave Element & Details Modal (onveranderd t.o.v. v7) ---
    function createVisualCardElement(cardData) { const collectionEntry = getCardInCollection(cardData.id); const currentQuantity = collectionEntry ? collectionEntry.quantity : 0; const itemDiv = document.createElement('div'); itemDiv.classList.add('card-item'); itemDiv.dataset.cardId = cardData.id; itemDiv.dataset.cardName = cardData.name.toLowerCase(); itemDiv.dataset.cardNumber = (cardData.number || "").toString().toLowerCase(); const cardSet = cardData.set || { name: 'N/A' }; const rarityClass = cardData.rarity ? cardData.rarity.toLowerCase().replace(/[\s:]+/g, '-').replace(/[^a-z0-9-]/g, '') : 'unknown-rarity'; itemDiv.innerHTML = ` <div class="card-image-container"> <img src="${cardData.images?.small || 'https://via.placeholder.com/150?text=No+Image'}" alt="${cardData.name}" loading="lazy" title="Klik voor details: ${cardData.name} (Set: ${cardSet.name} - ${cardData.rarity || ''})"> </div> <div class="card-info"> <span class="card-number">#${cardData.number || 'N/A'}</span> <a href="#" class="card-name-link" title="${cardData.name}">${cardData.name}</a> <div class="card-icons"> <span class="rarity-icon rarity-${rarityClass}" title="${cardData.rarity || 'Onbekend'}">${cardData.rarity || '?'}</span> </div> <div class="quantity-controls"> <button class="quantity-decrease control-button" ${currentQuantity === 0 ? 'disabled' : ''} aria-label="Verminder"><i class="fas fa-minus"></i></button> <span class="quantity-display">${currentQuantity}</span> <button class="quantity-increase control-button" aria-label="Verhoog"><i class="fas fa-plus"></i></button> </div> </div>`; itemDiv.querySelector('img')?.addEventListener('click', () => openCardDetailModal(cardData.id)); itemDiv.querySelector('.card-name-link')?.addEventListener('click', (e) => { e.preventDefault(); openCardDetailModal(cardData.id); }); itemDiv.querySelector('.quantity-increase')?.addEventListener('click', () => updateCardQuantityInCollection(cardData, 1)); itemDiv.querySelector('.quantity-decrease')?.addEventListener('click', () => updateCardQuantityInCollection(cardData, -1)); return itemDiv; }
    async function openCardDetailModal(cardId) { if (!cardDetailModal) return; currentlyDetailedCardId = cardId; Object.values(document.querySelectorAll('#cardDetailModal [id^="modalCard"]')).forEach(el => { if (el.tagName === 'SPAN' || el.tagName === 'H2') el.textContent = '-'; }); if (modalCardImage) modalCardImage.src = ''; if (modalCardAttacks) modalCardAttacks.innerHTML = '<h3>Aanvallen/Abilities</h3><p>Laden...</p>'; if (modalTcgPlayerLink) modalTcgPlayerLink.style.display = 'none'; showLoading(modalCardName, "Details laden..."); cardDetailModal.style.display = 'block'; let cardData = cachedAPIData.cardDetails[cardId]?.data; if (!cardData || !cardData.attacks) { const response = await fetchAPIData(`cards/${cardId}`, {}, cardId, !cardData); cardData = response?.data; } hideLoading(modalCardName); if (cardData && modalCardImage && modalCardName && modalCardSet && modalCardNumber && modalCardRarity && modalCardTypes && modalCardHp && modalCardAttacks) { modalCardImage.src = cardData.images?.large || cardData.images?.small || ''; modalCardImage.alt = cardData.name || 'Kaart'; modalCardName.textContent = cardData.name || '-'; modalCardSet.textContent = cardData.set?.name || '-'; modalCardNumber.textContent = `${cardData.number || '-'}/${cardData.set?.printedTotal || '-'}`; modalCardRarity.textContent = cardData.rarity || '-'; modalCardTypes.textContent = cardData.types?.join(', ') || '-'; modalCardHp.textContent = cardData.hp || '-'; modalCardAttacks.innerHTML = '<h3>Aanvallen & Abilities</h3>'; if (cardData.abilities?.length) cardData.abilities.forEach(ab => { modalCardAttacks.innerHTML += `<div class="attack"><strong>Ability: ${ab.name}</strong><span class="attack-text">${ab.text}</span></div>`; }); if (cardData.attacks?.length) cardData.attacks.forEach(at => { modalCardAttacks.innerHTML += `<div class="attack"><strong class="attack-name">${at.name}</strong> <span class="attack-cost">${at.cost?.join('')||''}</span> <span class="attack-damage">${at.damage||''}</span><span class="attack-text">${at.text||''}</span></div>`; }); if (!cardData.abilities?.length && !cardData.attacks?.length) modalCardAttacks.innerHTML += '<p>Geen aanval/ability data.</p>'; const activeCol = allCollections.find(c => c.id === activeCollectionId); if(modalCardCollectionNameSpan) modalCardCollectionNameSpan.textContent = activeCol ? activeCol.name : "(Geen)"; const collectionEntry = getCardInCollection(cardId); const qty = collectionEntry ? collectionEntry.quantity : 0; if(modalQuantityDisplay) modalQuantityDisplay.textContent = qty.toString(); if(modalQuantityDecrease) modalQuantityDecrease.disabled = (qty === 0 || !activeCollectionId); if(modalQuantityIncrease) modalQuantityIncrease.disabled = !activeCollectionId; if (cardData.tcgplayer?.url && modalTcgPlayerLink) { modalTcgPlayerLink.href = cardData.tcgplayer.url; modalTcgPlayerLink.style.display = 'inline-block'; } } else { if(modalCardName) modalCardName.textContent = 'Details niet gevonden'; showToast('Kon kaartdetails niet laden.', 'error'); } }
    function closeCardDetailModal() { if (cardDetailModal) cardDetailModal.style.display = 'none'; currentlyDetailedCardId = null; }

    // --- Set Progressie (onveranderd t.o.v. v7) ---
    function renderSetProgression() { if (!setProgressionSidebarDiv) return; setProgressionSidebarDiv.innerHTML = ''; const activeCollection = allCollections.find(c => c.id === activeCollectionId); if (!activeCollection) { setProgressionSidebarDiv.innerHTML = '<p>Selecteer een collectie.</p>'; return; } if (activeCollection.cards.length === 0) { setProgressionSidebarDiv.innerHTML = '<p>Deze collectie is leeg.</p>'; return; } const cardsBySet = activeCollection.cards.reduce((acc, item) => { const set = item.cardDataSnapshot?.set; if (set?.id && set?.name) { if (!acc[set.id]) acc[set.id] = { name: set.name, id: set.id, ownedUnique: new Set(), totalInSet: parseInt(set.printedTotal) || 0 }; acc[set.id].ownedUnique.add(item.cardId); const globalSetData = cachedAPIData.sets?.data.find(s => s.id === set.id); if (globalSetData && globalSetData.printedTotal > acc[set.id].totalInSet) { acc[set.id].totalInSet = globalSetData.printedTotal; } } return acc; }, {}); if (Object.keys(cardsBySet).length === 0) { setProgressionSidebarDiv.innerHTML = '<p>Geen sets met bekende data in collectie.</p>'; return; } Object.values(cardsBySet).sort((a, b) => a.name.localeCompare(b.name)).forEach(setInfo => { const owned = setInfo.ownedUnique.size; const total = setInfo.totalInSet; const perc = total > 0 ? Math.min(100, (owned / total) * 100) : 0; const itemHTML = ` <div class="set-progress-item" data-set-id="${setInfo.id}" title="Klik om deze set te laden"> <p>${setInfo.name} (${owned} / ${total || 'N/A'})</p> <div class="progress-bar-container"> <div class="progress-bar ${perc >= 100 ? 'completed' : ''}" style="width: ${perc}%;"></div> </div> </div>`; setProgressionSidebarDiv.innerHTML += itemHTML; }); setProgressionSidebarDiv.querySelectorAll('.set-progress-item').forEach(item => { item.addEventListener('click', () => { const setId = item.dataset.setId; const targetSetItem = setListContainerElement?.querySelector(`.set-item[data-set-id="${setId}"]`); if (targetSetItem) { currentlySelectedSetIdInList = setId; updateSetListActiveState(); targetSetItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } loadAndDisplaySetCards(setId); }); }); }

    // --- View Toggle & Sorteren (onveranderd t.o.v. v7) ---
    function toggleCardView() { if (!setCardGrid || !toggleCardViewBtn) return; isFullImageView = !isFullImageView; const viewClass = isFullImageView ? 'full-image-view' : 'compact-image-view'; const otherClass = isFullImageView ? 'compact-image-view' : 'full-image-view'; setCardGrid.classList.add(viewClass); setCardGrid.classList.remove(otherClass); if (myCollectedCardsGrid) { myCollectedCardsGrid.classList.add(viewClass); myCollectedCardsGrid.classList.remove(otherClass); } const icon = toggleCardViewBtn.querySelector('i'); const text = toggleCardViewBtn.querySelector('.view-mode-text'); if (icon) icon.className = isFullImageView ? 'fas fa-th-list' : 'fas fa-th-large'; if (text) text.textContent = isFullImageView ? 'Compact' : 'Full'; localStorage.setItem('pokemonCardViewPreference_v7', isFullImageView ? 'full' : 'compact'); }
    function loadCardViewPreference() { if (!setCardGrid || !toggleCardViewBtn) return; const pref = localStorage.getItem('pokemonCardViewPreference_v7'); isFullImageView = (pref === 'full'); const viewClass = isFullImageView ? 'full-image-view' : 'compact-image-view'; const otherClass = isFullImageView ? 'compact-image-view' : 'full-image-view'; setCardGrid.classList.add(viewClass); setCardGrid.classList.remove(otherClass); if (myCollectedCardsGrid) { myCollectedCardsGrid.classList.add(viewClass); myCollectedCardsGrid.classList.remove(otherClass); } const icon = toggleCardViewBtn.querySelector('i'); const text = toggleCardViewBtn.querySelector('.view-mode-text'); if (icon) icon.className = isFullImageView ? 'fas fa-th-list' : 'fas fa-th-large'; if (text) text.textContent = isFullImageView ? 'Compact' : 'Full'; }
    function toggleSortOrder(viewType) { if (viewType === 'set' && sortSetCardsBtn) { if (currentSetSortOrder === 'number_asc') currentSetSortOrder = 'number_desc'; else if (currentSetSortOrder === 'number_desc') currentSetSortOrder = 'name_asc'; else if (currentSetSortOrder === 'name_asc') currentSetSortOrder = 'name_desc'; else currentSetSortOrder = 'number_asc'; const icon = sortSetCardsBtn.querySelector('i'); const text = sortSetCardsBtn.querySelector('.sort-mode-text'); if(icon && text) { if (currentSetSortOrder.includes('name')) { icon.className = `fas fa-sort-alpha-${currentSetSortOrder === 'name_asc' ? 'down' : 'up'}`; text.textContent = 'Naam'; } else { icon.className = `fas fa-sort-numeric-${currentSetSortOrder === 'number_asc' ? 'down' : 'up'}`; text.textContent = 'Nummer'; } } renderSetCards(currentSetCards); } else if (viewType === 'myCollection' && sortMyCollectedCardsBtn) { if (myCollectionSortOrder === 'name_asc') myCollectionSortOrder = 'name_desc'; else if (myCollectionSortOrder === 'name_desc') myCollectionSortOrder = 'set_asc'; else if (myCollectionSortOrder === 'set_asc') myCollectionSortOrder = 'number_asc'; else myCollectionSortOrder = 'name_asc'; const icon = sortMyCollectedCardsBtn.querySelector('i'); const text = sortMyCollectedCardsBtn.querySelector('.sort-mode-text'); if(icon && text) { if (myCollectionSortOrder.includes('name')) { icon.className = `fas fa-sort-alpha-${myCollectionSortOrder === 'name_asc' ? 'down' : 'up'}`; text.textContent = 'Naam'; } else if (myCollectionSortOrder.includes('set')) { icon.className = 'fas fa-layer-group'; text.textContent = 'Set'; } else { icon.className = `fas fa-sort-numeric-${myCollectionSortOrder === 'number_asc' ? 'down' : 'up'}`; text.textContent = 'Nummer'; } } renderMyCollectedCards(); } }

    // --- LocalStorage (onveranderd t.o.v. v7) ---
    const LS_COLLECTIONS_KEY = 'pokemonTCGDeckMaster_Collections_v7'; const LS_ACTIVE_ID_KEY = 'pokemonTCGDeckMaster_ActiveId_v7'; const LS_API_CACHE_KEY = 'pokemonTCGDeckMaster_APICache_v7';
    function saveAllCollections() { try { localStorage.setItem(LS_COLLECTIONS_KEY, JSON.stringify(allCollections)); } catch (e) { console.error("Error saving collections:", e); showToast("Kon collecties niet opslaan.", "error"); } }
    function loadAllCollections() { const s = localStorage.getItem(LS_COLLECTIONS_KEY); if (s) { try { allCollections = JSON.parse(s); } catch (e) { console.error("Error parsing collections:", e); allCollections = []; } } else allCollections = []; }
    function saveActiveCollectionId() { if (activeCollectionId) localStorage.setItem(LS_ACTIVE_ID_KEY, activeCollectionId); else localStorage.removeItem(LS_ACTIVE_ID_KEY); }
    function loadActiveCollectionId() { activeCollectionId = localStorage.getItem(LS_ACTIVE_ID_KEY); }
    function saveAPICache() { try { localStorage.setItem(LS_API_CACHE_KEY, JSON.stringify(cachedAPIData)); } catch (e) { console.error("Error saving API cache:", e); } }
    function loadAPICache() { const s = localStorage.getItem(LS_API_CACHE_KEY); if (s) { try { const loadedCache = JSON.parse(s); cachedAPIData.sets = loadedCache.sets || null; cachedAPIData.types = loadedCache.types || null; cachedAPIData.rarities = loadedCache.rarities || null; cachedAPIData.setCodeMap = loadedCache.setCodeMap || {}; cachedAPIData.setCards = {}; cachedAPIData.cardDetails = {}; } catch (e) { console.error("Error parsing API cache:", e); cachedAPIData = { sets: null, types: null, rarities: null, setCards: {}, cardDetails: {}, setCodeMap: {} }; } } }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        console.log("Setting up event listeners...");
        openCreateCollectionModalBtn?.addEventListener('click', openCollectionModal);
        closeModalBtn?.addEventListener('click', closeCollectionModal);
        createCollectionModal?.addEventListener('click', (event) => { if (event.target === createCollectionModal) closeCollectionModal(); });
        createCollectionBtn?.addEventListener('click', handleCreateCollection);
        activeCollectionSelect?.addEventListener('change', (event) => setActiveCollection(event.target.value));
        deleteCollectionButton?.addEventListener('click', handleDeleteCollection);
        setListFilterInputElement?.addEventListener('input', debouncedFilterSetList);
        searchInSetInput?.addEventListener('input', debouncedFilterSetCards); // Filter op naam/nummer in set
        setViewerTypeFilter?.addEventListener('change', () => renderSetCards(currentSetCards)); // NIEUW: filter op type in set
        setViewerRarityFilter?.addEventListener('change', () => renderSetCards(currentSetCards)); // NIEUW: filter op rarity in set
        toggleCardViewBtn?.addEventListener('click', toggleCardView);
        sortSetCardsBtn?.addEventListener('click', () => toggleSortOrder('set'));
        generalSearchButton?.addEventListener('click', performGeneralSearch);
        generalSearchInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') performGeneralSearch(); });
        generalSearchInput?.addEventListener('input', debouncedPerformGeneralSearch);
        resetGeneralSearchButton?.addEventListener('click', () => { if(generalSearchInput) generalSearchInput.value = ''; if(generalTypeFilterSelect) generalTypeFilterSelect.value = ''; if(generalRarityFilterSelect) generalRarityFilterSelect.value = ''; if(generalSearchResultsGrid) generalSearchResultsGrid.innerHTML = ''; displaySection(welcomeMessageSection, "Welkom"); });
        viewMyCollectedCardsBtn?.addEventListener('click', loadAndDisplayMyCollectedCards);
        searchInMyCollectionInput?.addEventListener('input', debouncedRenderMyCollectedCards);
        filterMyCollectionBySetSelect?.addEventListener('change', renderMyCollectedCards);
        sortMyCollectedCardsBtn?.addEventListener('click', () => toggleSortOrder('myCollection'));
        closeCardDetailModalBtn?.addEventListener('click', closeCardDetailModal);
        cardDetailModal?.addEventListener('click', (event) => { if (event.target === cardDetailModal) closeCardDetailModal(); });
        modalQuantityIncrease?.addEventListener('click', () => { if (currentlyDetailedCardId) { const cardData = cachedAPIData.cardDetails[currentlyDetailedCardId]?.data || currentSetCards.find(c => c.id === currentlyDetailedCardId) || myCurrentCollectedCardsData.find(c => c.id === currentlyDetailedCardId); if (cardData) updateCardQuantityInCollection(cardData, 1, true); } });
        modalQuantityDecrease?.addEventListener('click', () => { if (currentlyDetailedCardId) { const cardData = cachedAPIData.cardDetails[currentlyDetailedCardId]?.data || currentSetCards.find(c => c.id === currentlyDetailedCardId) || myCurrentCollectedCardsData.find(c => c.id === currentlyDetailedCardId); if (cardData) updateCardQuantityInCollection(cardData, -1, true); } });
        console.log("Event listeners set up.");
    }

    // --- Applicatie Initialisatie (onveranderd t.o.v. v7) ---
    async function initializeApp() { console.log("Initializing application (v7.1)..."); assignDOMElements(); loadAPICache(); loadAllCollections(); loadActiveCollectionId(); renderActiveCollectionSelector(); await initializePrimaryData(); loadCardViewPreference(); setupEventListeners(); window.addEventListener('beforeunload', saveAPICache); const hash = window.location.hash; let navigatedByHash = false; if (hash && hash.startsWith('#collection=')) { const collectionIdFromHash = hash.substring('#collection='.length); if (allCollections.find(c => c.id === collectionIdFromHash)) { setActiveCollection(collectionIdFromHash); if (activeCollectionSelect) activeCollectionSelect.value = collectionIdFromHash; loadAndDisplayMyCollectedCards(); navigatedByHash = true; } } if (!navigatedByHash) { let idToSet = activeCollectionId; if (!idToSet && allCollections.length > 0) { idToSet = allCollections.sort((a, b) => a.name.localeCompare(b.name))[0].id; } setActiveCollection(idToSet); if (!idToSet) { displaySection(welcomeMessageSection, "Welkom"); } else if (myCollectedCardsViewerSection && viewMyCollectedCardsBtn) { loadAndDisplayMyCollectedCards(); } else { displaySection(welcomeMessageSection, "Welkom"); } } console.log("Application initialized (v7.1)."); }
    initializeApp();
});