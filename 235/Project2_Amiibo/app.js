const FAV_KEY = "amiibo_favs";
const SEARCH_KEY = "amiibo_last_search";
const FILTER_KEY = "amiibo_last_filter";
const SORT_KEY = "amiibo_last_sort";

let allAmiibo = [];
let currentResults = [];
let favourites = JSON.parse(localStorage.getItem(FAV_KEY)) || [];

const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const showAllBtn = document.getElementById("show-all-btn");
const resultsGrid = document.getElementById("results-grid");
const favGrid = document.getElementById("favourites-grid");
const filterSelect = document.getElementById("filter");
const sortSelect = document.getElementById("sort");
const statusEl = document.getElementById("status");

// Status message setup
function setStatus(msg) {
    statusEl.textContent = msg || "";
}

window.addEventListener("DOMContentLoaded", function () {
    const savedSearch = localStorage.getItem(SEARCH_KEY) || "";
    const savedFilter = localStorage.getItem(FILTER_KEY) || "";
    const savedSort = localStorage.getItem(SORT_KEY) || "";

    searchInput.value = savedSearch;
    filterSelect.value = savedFilter;
    sortSelect.value = savedSort;

    setStatus("Loading Amiibo…");

    fetch("https://amiiboapi.com/api/amiibo/")
        .then(r => r.json())
        .then(data => {
            allAmiibo = data.amiibo || [];
            populateGameSeriesDropdown();
            renderFavourites();

            if (savedSearch !== "") doSearch(savedSearch);
            else applyFiltersAndSort();

            setStatus("");
        })
        .catch(() => setStatus("Failed to load data"));
});

function populateGameSeriesDropdown() {
    let seriesSet = new Set();
    for (let a of allAmiibo) if (a.gameSeries) seriesSet.add(a.gameSeries);

    for (let series of Array.from(seriesSet).sort()) {
        let opt = document.createElement("option");
        opt.value = series;
        opt.textContent = series;
        filterSelect.appendChild(opt);
    }
}

searchBtn.addEventListener("click", function (e) {
    e.preventDefault();
    const term = searchInput.value.trim();
    if (term === "") {
        setStatus("Please enter a search term.");
        return;
    }
    localStorage.setItem(SEARCH_KEY, term);
    doSearch(term);
});

showAllBtn.addEventListener("click", function (e) {
    e.preventDefault();
    searchInput.value = "";
    localStorage.setItem(SEARCH_KEY, "");
    currentResults = [];
    applyFiltersAndSort();
});

function doSearch(term) {
    setStatus("Searching…");
    fetch("https://amiiboapi.com/api/amiibo/?name=" + encodeURIComponent(term))
        .then(r => r.json())
        .then(data => {
            currentResults = data.amiibo || [];
            setStatus(currentResults.length ? `Found ${currentResults.length} result(s).` : "No results found.");
            applyFiltersAndSort();
        })
        .catch(() => setStatus("Search failed."));
}

filterSelect.addEventListener("change", function () {
    localStorage.setItem(FILTER_KEY, filterSelect.value);
    applyFiltersAndSort();
});

sortSelect.addEventListener("change", function () {
    localStorage.setItem(SORT_KEY, sortSelect.value);
    applyFiltersAndSort();
});

function applyFiltersAndSort() {
    let list = currentResults.length ? currentResults.slice() : allAmiibo.slice();

    if (filterSelect.value !== "") {
        list = list.filter(a => a.gameSeries === filterSelect.value);
    }

    if (sortSelect.value === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortSelect.value === "name-desc") list.sort((a, b) => b.name.localeCompare(a.name));

    renderResults(list);
}

function renderResults(list) {
    resultsGrid.innerHTML = "";

    if (!list.length) {
        resultsGrid.innerHTML = "<p>No results.</p>";
        return;
    }

    for (let item of list) {
        const id = item.head + item.tail;
        const inFavs = favourites.includes(id);

        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>${item.gameSeries} — ${item.type}</p>
            <button class="fav-btn" data-id="${id}">
                ${inFavs ? "Remove Favourite" : "Add to Favourites"}
            </button>
        `;
        resultsGrid.appendChild(card);
    }
}

document.addEventListener("click", function (e) {
    if (!e.target.classList.contains("fav-btn")) return;
    const id = e.target.dataset.id;

    if (favourites.includes(id)) favourites = favourites.filter(f => f !== id);
    else favourites.push(id);

    localStorage.setItem(FAV_KEY, JSON.stringify(favourites));
    renderFavourites();
    applyFiltersAndSort();
});

function renderFavourites() {
    favGrid.innerHTML = "";
    if (!favourites.length) {
        favGrid.innerHTML = "<p>No favourites yet.</p>";
        return;
    }

    for (let id of favourites) {
        const item = allAmiibo.find(a => a.head + a.tail === id);
        if (!item) continue;

        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>${item.gameSeries} — ${item.type}</p>
            <button class="fav-btn" data-id="${id}">Remove Favourite</button>
        `;
        favGrid.appendChild(card);
    }
}
