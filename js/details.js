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
    bfMoodNote: document.getElementById("bfMoodNote"),
    gfMoodText: document.getElementById("gfMoodText"),
    gfMoodScore: document.getElementById("gfMoodScore"),
    gfMoodNote: document.getElementById("gfMoodNote"),
    maps: document.getElementById("detailMaps"),
    visited: document.getElementById("detailVisitedButton"),
    visitSheet: document.getElementById("visitSheet"),
    visitSheetBackdrop: document.getElementById("visitSheetBackdrop"),
    visitForm: document.getElementById("visitForm"),
    visitSheetStatus: document.getElementById("visitSheetStatus"),
    visitedDateInput: document.getElementById("visitedDateInput"),
    fiqryNoteInput: document.getElementById("fiqryNoteInput"),
    isyanaNoteInput: document.getElementById("isyanaNoteInput"),
    ratingPickers: Array.from(document.querySelectorAll(".rating-picker")),
    reviewerSaves: Array.from(document.querySelectorAll(".reviewer-save")),
    cancelVisit: document.getElementById("cancelVisitButton"),
    celebration: document.getElementById("visitedCelebration"),
    celebrationName: document.getElementById("celebrationPlaceName")
  };

  let currentPlace = null;
  const selectedRatings = {
    fiqry: 0,
    isyana: 0
  };
  let statusTimer = 0;

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
      showStatus(error.message || "Could not load this place.", "error");
    }

    els.visited.addEventListener("click", openVisitForm);
    els.visitSheetBackdrop.addEventListener("click", closeVisitForm);
    els.cancelVisit.addEventListener("click", closeVisitForm);
    els.ratingPickers.forEach(registerRatingPicker);
    els.reviewerSaves.forEach((button) => button.addEventListener("click", saveSingleReview));

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
    els.visited.hidden = place.status === "visited" && place.fiqryRating && place.isyanaRating;
    els.visited.querySelector("span").textContent = place.status === "visited" ? "Add Review" : "Visited";
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
    restoreVisitFormState();
    hideSheetStatus();
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
    renderMoodSide(els.bfMoodText, els.bfMoodScore, els.bfMoodNote, Number(place.fiqryRating), place.status, place.fiqryNote);
    renderMoodSide(els.gfMoodText, els.gfMoodScore, els.gfMoodNote, Number(place.isyanaRating), place.status, place.isyanaNote);
  }

  async function saveSingleReview(event) {
    if (!currentPlace) return;
    const reviewer = event.currentTarget.dataset.reviewer;
    const rating = selectedRatings[reviewer];
    const noteInput = reviewer === "fiqry" ? els.fiqryNoteInput : els.isyanaNoteInput;
    const saveButton = event.currentTarget;

    saveButton.disabled = true;
    showSheetStatus(`Saving ${reviewer === "fiqry" ? "Fiqry" : "Isyana"} review...`);

    try {
      if (!rating) {
        throw new Error(`Pilih rating ${reviewer === "fiqry" ? "Fiqry" : "Isyana"} dulu.`);
      }

      currentPlace = await window.PlaceToGoData.savePlaceReview(currentPlace.id, {
        visited_at: els.visitedDateInput.value,
        reviewer,
        rating,
        note: noteInput.value.trim()
      });

      render(currentPlace);
      closeVisitForm();
      showStatus(`${reviewer === "fiqry" ? "Fiqry" : "Isyana"} review berhasil disimpan.`, "success");
      if (window.lucide) window.lucide.createIcons();
    } catch (error) {
      saveButton.disabled = false;
      showSheetStatus(getReviewErrorMessage(error));
    }
  }

  function getReviewErrorMessage(error) {
    const message = String(error?.message || "");
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes("schema cache") && (lowerMessage.includes("fiqry_note") || lowerMessage.includes("isyana_note"))) {
      return "Kolom review belum ada di Supabase. Jalankan SQL terbaru dulu, lalu coba save lagi.";
    }
    return message || "Could not save this review.";
  }

  function restoreVisitFormState() {
    els.visitedDateInput.value = currentPlace?.visitedAt || els.visitedDateInput.value || new Date().toISOString().slice(0, 10);
    els.fiqryNoteInput.value = currentPlace?.fiqryNote || "";
    els.isyanaNoteInput.value = currentPlace?.isyanaNote || "";
    selectedRatings.fiqry = Number(currentPlace?.fiqryRating) || 0;
    selectedRatings.isyana = Number(currentPlace?.isyanaRating) || 0;
    els.ratingPickers.forEach((picker) => {
      const person = picker.dataset.person;
      picker.querySelectorAll("[data-rating]").forEach((button) => {
        button.classList.toggle("selected", Number(button.dataset.rating) <= selectedRatings[person]);
      });
    });
    els.reviewerSaves.forEach((button) => {
      button.disabled = false;
    });
  }

  function renderMoodSide(textEl, scoreEl, noteEl, rating, status, note) {
    if (rating) {
      textEl.textContent = getMoodText(rating);
      scoreEl.innerHTML = `${rating}/5 <i data-lucide="star"></i>`;
      renderNote(noteEl, note);
      return;
    }

    textEl.textContent = status === "visited" ? "Memory saved" : "Ready for next trip";
    scoreEl.textContent = status === "visited" ? "Visited together" : "Waiting list";
    renderNote(noteEl, note);
  }

  function renderNote(noteEl, note) {
    const cleanNote = String(note || "").trim();
    noteEl.hidden = !cleanNote;
    const noteText = noteEl.querySelector("span");
    if (noteText) noteText.textContent = cleanNote;
  }

  function getMoodText(rating) {
    if (rating >= 5) return "Perfect moment";
    if (rating >= 4) return "Worth visiting";
    if (rating >= 3) return "Sweet little stop";
    return "Tiny adventure";
  }

  function showStatus(message, tone) {
    window.clearTimeout(statusTimer);
    els.status.hidden = false;
    els.status.innerHTML = `
      <span class="toast-icon"><i data-lucide="${tone === "success" ? "check-circle-2" : "info"}"></i></span>
      <span>${escapeHtml(message)}</span>
    `;
    els.status.classList.toggle("success", tone === "success");
    els.status.classList.toggle("error", tone === "error");
    if (window.lucide) window.lucide.createIcons();

    if (tone === "success") {
      statusTimer = window.setTimeout(hideStatus, 3200);
    }
  }

  function hideStatus() {
    window.clearTimeout(statusTimer);
    els.status.hidden = true;
    els.status.innerHTML = "";
    els.status.classList.remove("success");
    els.status.classList.remove("error");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showSheetStatus(message, tone) {
    els.visitSheetStatus.hidden = false;
    els.visitSheetStatus.textContent = message;
    els.visitSheetStatus.classList.toggle("success", tone === "success");
  }

  function hideSheetStatus() {
    els.visitSheetStatus.hidden = true;
    els.visitSheetStatus.textContent = "";
    els.visitSheetStatus.classList.remove("success");
  }

  document.addEventListener("DOMContentLoaded", init);
})();

