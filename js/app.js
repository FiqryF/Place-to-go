(function () {
  const state = {
    places: [],
    filter: "all",
    query: ""
  };

  const els = {
    total: document.getElementById("totalCount"),
    wishlist: document.getElementById("wishlistCount"),
    visited: document.getElementById("visitedCount"),
    list: document.getElementById("placesList"),
    template: document.getElementById("placeCardTemplate"),
    search: document.getElementById("searchInput"),
    chips: Array.from(document.querySelectorAll(".filter-chip")),
    listTitle: document.getElementById("listTitle"),
    status: document.getElementById("statusMessage"),
    add: document.getElementById("addPlaceButton"),
    refresh: document.getElementById("refreshButton"),
    mapOverview: document.getElementById("mapOverviewLink")
  };

  function init() {
    const links = window.PlaceToGoData.getRepoLinks();
    els.add.href = "add.html";
    els.mapOverview.href = window.PLACE_TO_GO_CONFIG.mapsOverviewUrl || "https://www.google.com/maps";

    els.search.addEventListener("input", (event) => {
      state.query = event.target.value.trim().toLowerCase();
      render();
    });

    els.chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        state.filter = chip.dataset.filter;
        render();
      });
    });

    els.refresh.addEventListener("click", loadPlaces);
    loadPlaces();
  }

  async function loadPlaces() {
    showStatus("Loading places...");
    try {
      state.places = await window.PlaceToGoData.fetchPlaces();
      hideStatus();
    } catch (error) {
      state.places = window.PlaceToGoData.samplePlaces;
      showStatus("Could not reach GitHub Issues, so sample places are shown for now. Check js/config.js after publishing.");
    }
    render();
  }

  function getVisiblePlaces() {
    return state.places.filter((place) => {
      const matchesFilter = state.filter === "all" || place.status === state.filter;
      const haystack = `${place.title} ${place.location} ${place.category} ${place.description}`.toLowerCase();
      return matchesFilter && haystack.includes(state.query);
    });
  }

  function render() {
    renderStats();
    renderFilters();
    renderList();
    if (window.lucide) window.lucide.createIcons();
  }

  function renderStats() {
    els.total.textContent = state.places.length;
    els.wishlist.textContent = state.places.filter((place) => place.status === "wishlist").length;
    els.visited.textContent = state.places.filter((place) => place.status === "visited").length;
  }

  function renderFilters() {
    els.chips.forEach((chip) => chip.classList.toggle("active", chip.dataset.filter === state.filter));
    const labels = {
      all: "All places",
      wishlist: "Wishlist",
      visited: "Visited"
    };
    els.listTitle.textContent = labels[state.filter] || "All places";
  }

  function renderList() {
    const visiblePlaces = getVisiblePlaces();
    els.list.innerHTML = "";

    if (!visiblePlaces.length) {
      const empty = document.createElement("section");
      empty.className = "status-message";
      empty.textContent = "No places match the current search or filter.";
      els.list.appendChild(empty);
      return;
    }

    visiblePlaces.forEach((place) => {
      const card = els.template.content.firstElementChild.cloneNode(true);
      const coverLink = card.querySelector(".cover-link");
      const image = card.querySelector(".place-cover");
      const badge = card.querySelector(".status-badge");
      const category = card.querySelector(".category-pill");
      const location = card.querySelector(".location-text span");
      const title = card.querySelector("h3");
      const description = card.querySelector(".description");
      const maps = card.querySelector(".maps-link");
      const detail = card.querySelector(".detail-link");
      const detailUrl = `details.html?id=${encodeURIComponent(place.id)}`;

      coverLink.href = detailUrl;
      image.src = place.imageUrl;
      image.alt = `${place.title} cover image`;
      badge.textContent = place.status === "visited" ? "Visited" : "Wishlist";
      badge.classList.toggle("visited", place.status === "visited");
      category.textContent = place.category;
      location.textContent = place.location;
      title.textContent = place.title;
      description.textContent = place.description;
      maps.href = place.mapsUrl;
      detail.href = detailUrl;
      els.list.appendChild(card);
    });
  }

  function showStatus(message) {
    els.status.hidden = false;
    els.status.textContent = message;
  }

  function hideStatus() {
    els.status.hidden = true;
    els.status.textContent = "";
  }

  document.addEventListener("DOMContentLoaded", init);
})();
