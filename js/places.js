(function () {
  const state = {
    places: [],
    query: "",
    view: "wishlist"
  };

  const els = {
    status: document.getElementById("placesStatus"),
    empty: document.getElementById("placesEmpty"),
    search: document.getElementById("placesSearchInput"),
    viewButtons: Array.from(document.querySelectorAll("[data-view]")),
    template: document.getElementById("fullPlaceCardTemplate"),
    wishlistSection: document.getElementById("wishlistSection"),
    wishlistList: document.getElementById("wishlistList"),
    visitedSection: document.getElementById("visitedSection"),
    visitedList: document.getElementById("visitedList"),
    wishlistTotal: document.getElementById("wishlistTotal"),
    visitedTotal: document.getElementById("visitedTotal")
  };

  async function init() {
    const session = await window.PlaceToGoData.getSession();
    if (!session) {
      window.location.replace("login.html?next=places.html");
      return;
    }

    els.search.addEventListener("input", (event) => {
      state.query = event.target.value.trim().toLowerCase();
      render();
    });
    els.viewButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.view = button.dataset.view;
        render();
      });
    });

    await loadPlaces();
  }

  async function loadPlaces() {
    showStatus("Loading places...");
    try {
      state.places = await window.PlaceToGoData.fetchPlaces();
      hideStatus();
    } catch (error) {
      console.warn("Could not load all saved places.", error);
      state.places = window.PlaceToGoData.samplePlaces;
      showStatus(error.message || "Could not reach Supabase. Sample places are shown for now.");
    }
    render();
  }

  function getPlacesByStatus(status) {
    return state.places.filter((place) => {
      const haystack = `${place.title} ${place.location} ${place.category} ${place.description}`.toLowerCase();
      return place.status === status && haystack.includes(state.query);
    });
  }

  function render() {
    const wishlistPlaces = getPlacesByStatus("wishlist");
    const visitedPlaces = getPlacesByStatus("visited");

    els.wishlistTotal.textContent = wishlistPlaces.length;
    els.visitedTotal.textContent = visitedPlaces.length;
    renderViewButtons();
    renderSection(els.wishlistSection, els.wishlistList, wishlistPlaces, state.view === "wishlist");
    renderSection(els.visitedSection, els.visitedList, visitedPlaces, state.view === "visited");
    els.empty.hidden = getActivePlaces(wishlistPlaces, visitedPlaces).length > 0;

    if (window.lucide) window.lucide.createIcons();
  }

  function renderViewButtons() {
    els.viewButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.view === state.view);
    });
  }

  function getActivePlaces(wishlistPlaces, visitedPlaces) {
    return state.view === "visited" ? visitedPlaces : wishlistPlaces;
  }

  function renderSection(sectionEl, listEl, places, isActive) {
    sectionEl.hidden = !isActive || !places.length;
    if (!isActive || !places.length) {
      listEl.innerHTML = "";
      return;
    }
    renderList(listEl, places);
  }

  function renderList(listEl, places) {
    listEl.innerHTML = "";
    places.forEach((place) => {
      listEl.appendChild(createPlaceCard(place));
    });
  }

  function createPlaceCard(place) {
    const card = els.template.content.firstElementChild.cloneNode(true);
    const detailUrl = `details.html?id=${encodeURIComponent(place.id)}`;
    const badge = card.querySelector(".status-badge");

    card.querySelector(".cover-link").href = detailUrl;
    card.querySelector(".place-cover").src = place.imageUrl;
    card.querySelector(".place-cover").alt = `${place.title} cover image`;
    badge.textContent = place.status === "visited" ? "Visited" : "Wishlist";
    badge.classList.toggle("visited", place.status === "visited");
    card.querySelector(".category-pill").textContent = place.category;
    card.querySelector(".location-text span").textContent = place.location;
    card.querySelector("h3").textContent = place.title;
    card.querySelector(".description").textContent = place.description;
    card.querySelector(".maps-link").href = place.mapsUrl;
    card.querySelector(".detail-link").href = detailUrl;
    return card;
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
