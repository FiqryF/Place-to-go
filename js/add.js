(function () {
  function init() {
    const links = window.PlaceToGoData.getRepoLinks();
    const button = document.getElementById("openIssueForm");
    const status = document.getElementById("addStatus");

    button.href = links.newIssueUrl || "#";

    if (!links.issuesApi) {
      status.hidden = false;
      status.textContent = "Before publishing, set githubOwner and githubRepo in js/config.js. After that, this button will open the GitHub Issue Form.";
      button.setAttribute("aria-disabled", "true");
      button.addEventListener("click", (event) => event.preventDefault());
    }

    if (window.lucide) window.lucide.createIcons();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
