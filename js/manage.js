(function () {
  const els = {
    status: document.getElementById("manageStatus"),
    refresh: document.getElementById("refreshManageButton"),
    list: document.getElementById("manageList")
  };

  let places = [];

  async function init() {
    if (!window.PlaceToGoData.isSupabaseConfigured()) {
      showStatus("Set supabaseUrl and supabaseAnonKey in js/config.js before using this page.");
      return;
    }

    const user = await window.PlaceToGoData.requireUser();
    if (!user) return;

    els.refresh.addEventListener("click", loadPlaces);
    await loadPlaces();

    if (window.lucide) window.lucide.createIcons();
  }

  async function loadPlaces() {
    showStatus("Loading places...");
    try {
      places = await window.PlaceToGoData.fetchPlaces();
      hideStatus();
      renderPlaces();
    } catch (error) {
      showStatus(error.message || "Could not load places.");
    }
  }

  function renderPlaces() {
    els.list.innerHTML = "";

    if (!places.length) {
      const empty = document.createElement("section");
      empty.className = "status-message";
      empty.textContent = "No places yet. Add the first place above.";
      els.list.appendChild(empty);
      return;
    }

    places.forEach((place) => {
      const item = document.createElement("article");
      item.className = "admin-place";
      item.innerHTML = `
        <img src="${escapeAttribute(place.imageUrl)}" alt="${escapeAttribute(place.title)} cover image" loading="lazy">
        <div class="admin-place-body">
          <div class="place-meta">
            <span class="category-pill">${escapeHtml(place.category)}</span>
            <span class="location-text"><i data-lucide="map-pin"></i><span>${escapeHtml(place.location)}</span></span>
          </div>
          <h3>${escapeHtml(place.title)}</h3>
          <p>${escapeHtml(place.status === "visited" ? "Visited" : "Wishlist")}</p>
          <div class="admin-actions">
            <a class="button secondary" href="details.html?id=${encodeURIComponent(place.id)}" aria-label="Open detail for ${escapeAttribute(place.title)}">
              <i data-lucide="eye"></i>
            </a>
            <a class="button primary" href="add.html?id=${encodeURIComponent(place.id)}" aria-label="Edit ${escapeAttribute(place.title)}">
              <i data-lucide="pencil"></i>
            </a>
            <button class="button danger" type="button" data-action="delete" data-id="${escapeAttribute(place.id)}" aria-label="Delete ${escapeAttribute(place.title)}">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      `;
      els.list.appendChild(item);
    });

    els.list.querySelectorAll("[data-action='delete']").forEach((button) => {
      button.addEventListener("click", removePlace);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  async function removePlace(event) {
    const id = event.currentTarget.dataset.id;
    const place = places.find((item) => item.id === id);
    if (!place) return;

    const confirmed = window.confirm(`Delete ${place.title}?`);
    if (!confirmed) return;

    showStatus("Deleting place...");
    try {
      await window.PlaceToGoData.deletePlace(place.id);
      await loadPlaces();
    } catch (error) {
      showStatus(error.message || "Could not delete this place.");
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
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
