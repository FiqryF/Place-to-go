(function () {
  const status = document.getElementById("adminStatus");
  const logoutButton = document.getElementById("logoutButton");

  async function init() {
    if (!window.PlaceToGoData.isSupabaseConfigured()) {
      showStatus("Set supabaseUrl and supabaseAnonKey in js/config.js before using admin.");
      return;
    }

    const user = await window.PlaceToGoData.requireAdmin();
    if (!user) return;

    logoutButton.addEventListener("click", async () => {
      await window.PlaceToGoData.signOut();
      window.location.href = "index.html";
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function showStatus(message) {
    status.hidden = false;
    status.textContent = message;
  }

  document.addEventListener("DOMContentLoaded", init);
})();
