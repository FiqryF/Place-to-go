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
    maps: document.getElementById("detailMaps"),
    issue: document.getElementById("detailIssue"),
    notesWrap: document.getElementById("detailNotesWrap"),
    notes: document.getElementById("detailNotes")
  };

  async function init() {
    showStatus("Loading place...");
    try {
      const places = await window.PlaceToGoData.fetchPlaces();
      const id = new URLSearchParams(window.location.search).get("id");
      const place = window.PlaceToGoData.findPlaceById(places, id);
      if (!place) {
        showStatus("Place not found.");
        return;
      }
      render(place);
      hideStatus();
    } catch (error) {
      showStatus("Could not load this place from GitHub Issues.");
    }

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
    els.maps.href = place.mapsUrl;
    els.issue.href = place.issueUrl || "#";
    els.issue.hidden = !place.issueUrl || place.issueUrl === "#";

    if (place.notes) {
      els.notesWrap.hidden = false;
      els.notes.textContent = place.notes;
    } else {
      els.notesWrap.hidden = true;
    }
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
