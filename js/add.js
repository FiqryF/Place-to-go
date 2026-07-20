(function () {
  const params = new URLSearchParams(window.location.search);
  const editingId = params.get("id");

  const els = {
    form: document.getElementById("placeForm"),
    title: document.getElementById("formTitle"),
    status: document.getElementById("addStatus"),
    save: document.getElementById("savePlaceButton"),
    name: document.getElementById("nameInput"),
    location: document.getElementById("locationInput"),
    category: document.getElementById("categoryInput"),
    description: document.getElementById("descriptionInput"),
    maps: document.getElementById("mapsInput"),
    targetDate: document.getElementById("targetDateInput"),
    placeStatus: document.getElementById("statusInput"),
    image: document.getElementById("imageInput")
  };

  async function init() {
    if (!window.PlaceToGoData.isSupabaseConfigured()) {
      showStatus("Set your Supabase URL and anon key in js/config.js before adding places.");
      els.form.hidden = true;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const user = await window.PlaceToGoData.requireUser();
    if (!user) return;

    if (editingId) {
      els.title.textContent = "Edit this place.";
      els.save.querySelector("span").textContent = "Update Place";
      await loadExistingPlace();
    }

    els.form.addEventListener("submit", savePlace);

    if (window.lucide) window.lucide.createIcons();
  }

  async function loadExistingPlace() {
    showStatus("Loading place...");
    try {
      const place = await window.PlaceToGoData.fetchPlace(editingId);
      if (!place) {
        showStatus("Place not found.");
        els.form.hidden = true;
        return;
      }

      els.name.value = place.name;
      els.location.value = place.location;
      els.category.value = place.category;
      els.description.value = place.description;
      els.maps.value = place.mapsUrl;
      els.targetDate.value = place.targetDate || "";
      els.placeStatus.value = place.status;
      hideStatus();
    } catch (error) {
      showStatus(error.message || "Could not load this place.");
    }
  }

  async function savePlace(event) {
    event.preventDefault();
    els.save.disabled = true;
    showStatus(editingId ? "Updating place..." : "Saving place...");

    const payload = {
      name: els.name.value.trim(),
      location: els.location.value.trim(),
      category: els.category.value,
      description: els.description.value.trim(),
      maps_url: els.maps.value.trim(),
      target_date: els.targetDate.value,
      status: els.placeStatus.value
    };

    try {
      const place = await window.PlaceToGoData.savePlace(payload, els.image.files[0], editingId);
      window.location.href = `details.html?id=${encodeURIComponent(place.id)}`;
    } catch (error) {
      showStatus(error.message || "Could not save this place.");
      els.save.disabled = false;
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
