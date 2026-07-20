(function () {
  const fallbackImages = [
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=900&q=80"
  ];

  const samplePlaces = [
    {
      id: "sample-ubud",
      issueNumber: 0,
      title: "Ubud Art Market",
      location: "Ubud, Bali",
      category: "Culture",
      description: "A slow morning walk for handmade pieces, coffee, and small streets around central Ubud.",
      status: "wishlist",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ubud%20Art%20Market",
      imageUrl: fallbackImages[0],
      notes: "Sample data. Connect GitHub Issues in js/config.js to show your real places.",
      issueUrl: "#"
    },
    {
      id: "sample-lombok",
      issueNumber: 0,
      title: "Kuta Lombok",
      location: "Lombok, Indonesia",
      category: "Beach",
      description: "Bright water, open roads, and a weekend that should probably include sunset seafood.",
      status: "wishlist",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Kuta%20Lombok",
      imageUrl: fallbackImages[1],
      notes: "",
      issueUrl: "#"
    },
    {
      id: "sample-bandung",
      issueNumber: 0,
      title: "Braga Street",
      location: "Bandung, Indonesia",
      category: "City Walk",
      description: "Old buildings, cafes, and an easy afternoon route for photos and snacks.",
      status: "visited",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Braga%20Street%20Bandung",
      imageUrl: fallbackImages[2],
      notes: "Closed GitHub issues will appear as visited places.",
      issueUrl: "#"
    }
  ];

  function getConfig() {
    return window.PLACE_TO_GO_CONFIG || {};
  }

  function inferRepo() {
    const config = getConfig();
    if (config.githubOwner && config.githubRepo) {
      return { owner: config.githubOwner, repo: config.githubRepo };
    }

    const host = window.location.hostname;
    const pathRepo = window.location.pathname.split("/").filter(Boolean)[0];
    if (host.endsWith(".github.io") && pathRepo) {
      return { owner: host.replace(".github.io", ""), repo: pathRepo };
    }

    return null;
  }

  function getRepoLinks() {
    const repo = inferRepo();
    const config = getConfig();
    if (!repo) {
      return {
        issuesApi: "",
        newIssueUrl: "#",
        repoUrl: "#"
      };
    }

    const label = encodeURIComponent(config.issueLabel || "place");
    const template = encodeURIComponent(config.issueTemplate || "place.yml");
    const base = `https://github.com/${repo.owner}/${repo.repo}`;
    return {
      issuesApi: `https://api.github.com/repos/${repo.owner}/${repo.repo}/issues?state=all&labels=${label}&per_page=100`,
      newIssueUrl: `${base}/issues/new?template=${template}`,
      repoUrl: base
    };
  }

  function parseIssueBody(body) {
    const normalized = body || "";
    const fields = {};
    const headingPattern = /^###\s+(.+?)\s*$/gm;
    const headings = [];
    let match;

    while ((match = headingPattern.exec(normalized)) !== null) {
      headings.push({
        label: normalizeLabel(match[1]),
        headingStart: match.index,
        start: headingPattern.lastIndex
      });
    }

    headings.forEach((heading, index) => {
      const end = headings[index + 1] ? headings[index + 1].headingStart : normalized.length;
      fields[heading.label] = cleanField(normalized.slice(heading.start, end));
    });

    return fields;
  }

  function normalizeLabel(label) {
    return String(label).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  }

  function cleanField(value) {
    return String(value)
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/^\s*_\s*No response\s*_\s*$/gim, "")
      .trim();
  }

  function pick(fields, keys, fallback) {
    for (const key of keys) {
      if (fields[key]) return fields[key];
    }
    return fallback;
  }

  function issueToPlace(issue, index) {
    const fields = parseIssueBody(issue.body);
    const title = pick(fields, ["place_name", "name", "nama_tempat"], issue.title.replace(/^\[Place\]\s*/i, ""));
    const location = pick(fields, ["location", "lokasi", "city"], "Unknown location");
    const category = pick(fields, ["category", "kategori"], "Place");
    const description = pick(fields, ["short_description", "description", "deskripsi_singkat", "deskripsi"], "A place saved for later.");
    const mapsUrl = pick(fields, ["google_maps_url", "maps_url", "google_maps_link"], `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title} ${location}`)}`);
    const imageUrl = pick(fields, ["cover_image_url", "image_url", "cover_url", "photo_url"], fallbackImages[index % fallbackImages.length]);
    const notes = pick(fields, ["notes", "catatan"], "");

    return {
      id: String(issue.number),
      issueNumber: issue.number,
      title,
      location,
      category,
      description,
      status: issue.state === "closed" ? "visited" : "wishlist",
      mapsUrl,
      imageUrl,
      notes,
      issueUrl: issue.html_url
    };
  }

  async function fetchPlaces() {
    const links = getRepoLinks();
    const config = getConfig();

    if (!links.issuesApi) {
      return config.useSampleDataWhenEmpty ? samplePlaces : [];
    }

    const response = await fetch(links.issuesApi, {
      headers: { Accept: "application/vnd.github+json" }
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const issues = await response.json();
    const places = issues
      .filter((issue) => !issue.pull_request)
      .map(issueToPlace)
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "wishlist" ? -1 : 1;
        return Number(b.issueNumber) - Number(a.issueNumber);
      });

    return places.length || config.useSampleDataWhenEmpty ? places.length ? places : samplePlaces : [];
  }

  function findPlaceById(places, id) {
    return places.find((place) => place.id === id) || places[0];
  }

  window.PlaceToGoData = {
    fetchPlaces,
    findPlaceById,
    getRepoLinks,
    samplePlaces
  };
})();
