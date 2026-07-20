(function () {
  const form = document.getElementById("loginForm");
  const status = document.getElementById("loginStatus");

  async function init() {
    if (!window.PlaceToGoData.isSupabaseConfigured()) {
      showStatus("Set supabaseUrl and supabaseAnonKey in js/config.js before logging in.");
      form.hidden = true;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    await redirectIfLoggedIn();

    window.addEventListener("pageshow", () => {
      redirectIfLoggedIn();
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      showStatus("Logging in...");
      form.querySelector("button[type='submit']").disabled = true;
      const email = document.getElementById("emailInput").value.trim();
      const password = document.getElementById("passwordInput").value;

      try {
        await window.PlaceToGoData.signIn(email, password);
        showStatus("Anda berhasil login.", "success");
        window.setTimeout(goNext, 900);
      } catch (error) {
        showStatus(error.message || "Login failed.");
        form.querySelector("button[type='submit']").disabled = false;
      }
    });

    if (window.lucide) window.lucide.createIcons();
  }

  async function redirectIfLoggedIn() {
    const session = await window.PlaceToGoData.getSession();
    if (session) goNext();
  }

  function goNext() {
    const next = new URLSearchParams(window.location.search).get("next") || "home.html";
    window.location.replace(next);
  }

  function showStatus(message, tone) {
    status.hidden = false;
    status.textContent = message;
    status.classList.toggle("success", tone === "success");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
