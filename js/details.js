(function () {
  const els = {
    status: document.getElementById("detailStatus"),
    view: document.getElementById("detailView"),
    cover: document.getElementById("detailCover"),
    badge: document.getElementById("detailBadge"),
    category: document.getElementById("detailCategory"),
    location: document.getElementById("detailLocation"),
    name: document.getElementById("detailName"),
    description: document.getElementById("detailDescription"),
    statusText: document.getElementById("detailStatusText"),
    created: document.getElementById("detailCreated"),
    maps: document.getElementById("detailMaps"),
    edit: document.getElementById("detailEdit"),
    adminPanel: document.getElementById("detailAdminPanel"),
    markVisited: document.getElementById("markVisitedButton"),
    deletePlace: document.getElementById("deletePlaceButton")
  };

  let currentPlace = null;

  async function init() {
    showStatus("Loading place...");
    try {
      const id = new URLSearchParams(window.location.search).get("id");
      currentPlace = await window.PlaceToGoData.fetchPlace(id);
      if (!currentPlace) {
        showStatus("Place not found.");
        return;
      }
      render(currentPlace);
      hideStatus();
      await renderAdminControls();
    } catch (error) {
      showStatus(error.message || "Could not load this place.");
    }

    els.markVisited.addEventListener("click", markAsVisited);
    els.deletePlace.addEventListener("click", removePlace);

    if (window.lucide) window.lucide.createIcons();
  }

  function render(place) {
    document.title = `${place.title} - Place To Go`;
    els.view.hidden = false;
    els.cover.src = place.imageUrl;
    els.cover.alt = `${place.title} cover image`;
    els.badge.textContent = place.status === "visited" ? "Visited" : "Wishlist";
    els.badge.classList.toggle("visited", place.status === "visited");
    els.category.textContent = place.category;
    els.location.textContent = place.location;
    els.name.textContent = place.title;
    els.description.textContent = place.description;
    els.statusText.textContent = place.status === "visited" ? "Visited" : "Wishlist";
    els.created.textContent = formatDate(place.createdAt);
    els.maps.href = place.mapsUrl;
    els.edit.href = `add.html?id=${encodeURIComponent(place.id)}`;
    els.markVisited.hidden = place.status === "visited";
  }

  async function renderAdminControls() {
    const user = await window.PlaceToGoData.getCurrentUser();
    els.edit.hidden = !user;
    els.adminPanel.hidden = !user;
  }

  async function markAsVisited() {
    if (!currentPlace) return;
    showStatus("Updating status...");
    try {
      currentPlace = await window.PlaceToGoData.updateStatus(currentPlace.id, "visited");
      render(currentPlace);
      hideStatus();
      if (window.lucide) window.lucide.createIcons();
    } catch (error) {
      showStatus(error.message || "Could not update status.");
    }
  }

  async function removePlace() {
    if (!currentPlace) return;
    const confirmed = window.confirm(`Delete ${currentPlace.title}?`);
    if (!confirmed) return;

    showStatus("Deleting place...");
    try {
      await window.PlaceToGoData.deletePlace(currentPlace.id);
      window.location.href = "index.html";
    } catch (error) {
      showStatus(error.message || "Could not delete this place.");
    }
  }

  function formatDate(value) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(new Date(value));
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
