(function () {
  const form = document.getElementById("loginForm");
  const status = document.getElementById("loginStatus");

  async function init() {
    if (!window.PlaceToGoData.isSupabaseConfigured()) {
      showStatus("Set supabaseUrl and supabaseAnonKey in js/config.js before logging in.");
      form.hidden = true;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      showStatus("Logging in...");
      const email = document.getElementById("emailInput").value.trim();
      const password = document.getElementById("passwordInput").value;

      try {
        await window.PlaceToGoData.signIn(email, password);
        const next = new URLSearchParams(window.location.search).get("next") || "admin.html";
        window.location.href = next;
      } catch (error) {
        showStatus(error.message || "Login failed.");
      }
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function showStatus(message) {
    status.hidden = false;
    status.textContent = message;
  }

  document.addEventListener("DOMContentLoaded", init);
})();
