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
    visitFacts: document.getElementById("visitFacts"),
    visitedDate: document.getElementById("detailVisitedDate"),
    ratings: document.getElementById("detailRatings"),
    bfMoodText: document.getElementById("bfMoodText"),
    bfMoodScore: document.getElementById("bfMoodScore"),
    gfMoodText: document.getElementById("gfMoodText"),
    gfMoodScore: document.getElementById("gfMoodScore"),
    maps: document.getElementById("detailMaps"),
    visited: document.getElementById("detailVisitedButton"),
    visitSheet: document.getElementById("visitSheet"),
    visitSheetBackdrop: document.getElementById("visitSheetBackdrop"),
    visitForm: document.getElementById("visitForm"),
    visitedDateInput: document.getElementById("visitedDateInput"),
    ratingPickers: Array.from(document.querySelectorAll(".rating-picker")),
    cancelVisit: document.getElementById("cancelVisitButton"),
    saveVisit: document.getElementById("saveVisitButton"),
    celebration: document.getElementById("visitedCelebration"),
    celebrationName: document.getElementById("celebrationPlaceName")
  };

  let currentPlace = null;
  const selectedRatings = {
    fiqry: 0,
    isyana: 0
  };

  async function init() {
    const user = await window.PlaceToGoData.requireUser();
    if (!user) return;

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
    } catch (error) {
      showStatus(error.message || "Could not load this place.");
    }

    els.visited.addEventListener("click", openVisitForm);
    els.visitForm.addEventListener("submit", markVisited);
    els.visitSheetBackdrop.addEventListener("click", closeVisitForm);
    els.cancelVisit.addEventListener("click", closeVisitForm);
    els.ratingPickers.forEach(registerRatingPicker);

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
    els.visited.hidden = place.status === "visited";
    closeVisitForm();

    els.visitFacts.hidden = false;
    els.visitedDate.textContent = formatDate(place.visitedAt);
    els.ratings.innerHTML = formatRatings(place);
    renderMoodChecklist(place);
    if (window.lucide) window.lucide.createIcons();
  }

  function openVisitForm() {
    selectedRatings.fiqry = 0;
    selectedRatings.isyana = 0;
    els.ratingPickers.forEach((picker) => {
      picker.querySelectorAll("[data-rating]").forEach((button) => button.classList.remove("selected"));
    });
    els.saveVisit.disabled = false;
    els.visitedDateInput.value = new Date().toISOString().slice(0, 10);
    els.visitSheet.hidden = false;
    window.requestAnimationFrame(() => {
      els.visitSheet.classList.add("show");
    });
  }

  function closeVisitForm() {
    if (!els.visitSheet || els.visitSheet.hidden) return;
    els.visitSheet.classList.remove("show");
    window.setTimeout(() => {
      els.visitSheet.hidden = true;
    }, 220);
  }

  function selectRating(picker, selectedButton) {
    const person = picker.dataset.person;
    selectedRatings[person] = Number(selectedButton.dataset.rating);
    picker.querySelectorAll("[data-rating]").forEach((button) => {
      button.classList.toggle("selected", Number(button.dataset.rating) <= selectedRatings[person]);
    });
  }

  async function markVisited(event) {
    event.preventDefault();
    if (!currentPlace) return;
    els.saveVisit.disabled = true;
    showStatus("Updating visited status...");

    try {
      if (!selectedRatings.fiqry || !selectedRatings.isyana) {
        throw new Error("Pilih rating Fiqry dan Isyana dulu.");
      }

      currentPlace = await window.PlaceToGoData.markPlaceVisited(currentPlace.id, {
        visited_at: els.visitedDateInput.value,
        fiqry_rating: selectedRatings.fiqry,
        isyana_rating: selectedRatings.isyana
      });
      render(currentPlace);
      showVisitedCelebration(currentPlace);
      hideStatus();
      if (window.lucide) window.lucide.createIcons();
    } catch (error) {
      els.saveVisit.disabled = false;
      els.visited.hidden = false;
      els.visitForm.hidden = false;
      showStatus(error.message || "Could not mark this place as visited.");
    }
  }

  function showVisitedCelebration(place) {
    els.celebrationName.textContent = place.title;
    els.celebration.hidden = false;
    els.celebration.classList.remove("show");

    window.requestAnimationFrame(() => {
      els.celebration.classList.add("show");
      if (window.lucide) window.lucide.createIcons();
    });

    window.setTimeout(() => {
      els.celebration.classList.remove("show");
      window.setTimeout(() => {
        els.celebration.hidden = true;
      }, 240);
    }, 3800);
  }

  function formatDate(value) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(new Date(value));
  }


  function formatRatings(place) {
    const bfRating = Number(place.fiqryRating);
    const gfRating = Number(place.isyanaRating);
    if (!bfRating || !gfRating) return "-";

    const average = (bfRating + gfRating) / 2;
    const formattedAverage = average
      .toFixed(1)
      .replace(".", ",")
      .replace(",0", "");

    return `<span class="rating-average">${formattedAverage}</span><i data-lucide="star"></i>`;
  }

  function registerRatingPicker(picker) {
    picker.addEventListener("click", handleRatingPickerClick);
  }

  function handleRatingPickerClick(event) {
    const button = event.target.closest("[data-rating]");
    if (!button) return;
    selectRating(event.currentTarget, button);
  }

  function renderMoodChecklist(place) {
    renderMoodSide(els.bfMoodText, els.bfMoodScore, Number(place.fiqryRating), place.status);
    renderMoodSide(els.gfMoodText, els.gfMoodScore, Number(place.isyanaRating), place.status);
  }

  function renderMoodSide(textEl, scoreEl, rating, status) {
    if (rating) {
      textEl.textContent = getMoodText(rating);
      scoreEl.innerHTML = `${rating}/5 <i data-lucide="star"></i>`;
      return;
    }

    textEl.textContent = status === "visited" ? "Memory saved" : "Ready for next trip";
    scoreEl.textContent = status === "visited" ? "Visited together" : "Waiting list";
  }

  function getMoodText(rating) {
    if (rating >= 5) return "Perfect moment";
    if (rating >= 4) return "Worth visiting";
    if (rating >= 3) return "Sweet little stop";
    return "Tiny adventure";
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

