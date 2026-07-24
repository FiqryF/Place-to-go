(function () {
  const fallbackImages = [
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=900&q=80"
  ];

  const samplePlaces = [
    {
      id: "sample-ubud",
      title: "Ubud Art Market",
      name: "Ubud Art Market",
      location: "Ubud, Bali",
      category: "Culture",
      description: "A slow morning walk for handmade pieces, coffee, and small streets around central Ubud.",
      status: "wishlist",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ubud%20Art%20Market",
      maps_url: "https://www.google.com/maps/search/?api=1&query=Ubud%20Art%20Market",
      imageUrl: fallbackImages[0],
      image_url: fallbackImages[0],
      targetDate: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "sample-lombok",
      title: "Kuta Lombok",
      name: "Kuta Lombok",
      location: "Lombok, Indonesia",
      category: "Beach",
      description: "Bright water, open roads, and a weekend that should probably include sunset seafood.",
      status: "wishlist",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Kuta%20Lombok",
      maps_url: "https://www.google.com/maps/search/?api=1&query=Kuta%20Lombok",
      imageUrl: fallbackImages[1],
      image_url: fallbackImages[1],
      targetDate: "",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: "sample-bandung",
      title: "Braga Street",
      name: "Braga Street",
      location: "Bandung, Indonesia",
      category: "City Walk",
      description: "Old buildings, cafes, and an easy afternoon route for photos and snacks.",
      status: "visited",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Braga%20Street%20Bandung",
      maps_url: "https://www.google.com/maps/search/?api=1&query=Braga%20Street%20Bandung",
      imageUrl: fallbackImages[2],
      image_url: fallbackImages[2],
      targetDate: "",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString()
    }
  ];

  let cachedClient = null;
  const authTimeoutMs = 30 * 60 * 1000;
  const rememberKey = "placeToGoRememberMe";
  const activeSessionKey = "placeToGoSessionActive";
  const lastActiveKey = "placeToGoLastActiveAt";
  let authTrackingStarted = false;

  function getConfig() {
    return window.PLACE_TO_GO_CONFIG || {};
  }

  function isSupabaseConfigured() {
    const config = getConfig();
    return Boolean(
      config.supabaseUrl &&
      config.supabaseAnonKey &&
      !String(config.supabaseUrl).includes("YOUR_") &&
      !String(config.supabaseAnonKey).includes("YOUR_")
    );
  }

  function getClient() {
    if (!isSupabaseConfigured()) return null;
    if (!window.supabase) {
      throw new Error("Supabase JS could not be loaded.");
    }
    if (!cachedClient) {
      cachedClient = window.supabase.createClient(getConfig().supabaseUrl, getConfig().supabaseAnonKey);
    }
    return cachedClient;
  }

  function normalizePlace(row) {
    const title = row.name || row.title || "Untitled place";
    const mapQuery = encodeURIComponent([title, row.location || ""].join(" ").trim());
    const mapsUrl = row.maps_url || row.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
    const imageUrl = row.image_url || row.imageUrl || fallbackImages[0];

    return {
      ...row,
      id: String(row.id),
      title,
      name: title,
      location: row.location || "Unknown location",
      category: row.category || "Place",
      description: row.description || "A place saved for later.",
      status: row.status === "visited" ? "visited" : "wishlist",
      mapsUrl,
      maps_url: mapsUrl,
      imageUrl,
      image_url: imageUrl,
      targetDate: row.target_date || row.targetDate || "",
      visitedAt: row.visited_at || row.visitedAt || "",
      fiqryRating: row.bf_score || row.fiqry_rating || row.fiqryRating || "",
      isyanaRating: row.gf_score || row.isyana_rating || row.isyanaRating || "",
      fiqryNote: row.bf_note || row.fiqry_note || row.fiqryNote || "",
      isyanaNote: row.gf_note || row.isyana_note || row.isyanaNote || "",
      createdAt: row.created_at || row.createdAt || "",
      updatedAt: row.updated_at || row.updatedAt || ""
    };
  }

  async function fetchPlaces() {
    const client = getClient();
    const config = getConfig();

    if (!client) {
      return config.useSampleDataWhenEmpty ? samplePlaces : [];
    }

    const { data, error } = await client
      .from("places")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    const places = (data || []).map(normalizePlace);
    return places;
  }

  async function fetchPlace(id) {
    if (!id) return null;
    const client = getClient();
    if (!client) {
      return samplePlaces.find((place) => place.id === id) || samplePlaces[0] || null;
    }

    const { data, error } = await client
      .from("places")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data ? normalizePlace(data) : null;
  }

  function findPlaceById(places, id) {
    return places.find((place) => place.id === id) || places[0];
  }

  async function getCurrentUser() {
    const client = getClient();
    if (!client) return null;
    const { data, error } = await client.auth.getUser();
    if (error) return null;
    return data.user || null;
  }

  function getRememberEnabled() {
    return localStorage.getItem(rememberKey) === "true";
  }

  function getAuthStorage() {
    return getRememberEnabled() ? localStorage : sessionStorage;
  }

  function setAuthState(remember) {
    localStorage.setItem(rememberKey, remember ? "true" : "false");
    sessionStorage.setItem(activeSessionKey, "true");
    localStorage.removeItem(lastActiveKey);
    sessionStorage.removeItem(lastActiveKey);
    getAuthStorage().setItem(lastActiveKey, String(Date.now()));
  }

  function clearAuthState() {
    localStorage.removeItem(rememberKey);
    localStorage.removeItem(lastActiveKey);
    sessionStorage.removeItem(activeSessionKey);
    sessionStorage.removeItem(lastActiveKey);
  }

  function touchAuthSession() {
    const hasKnownSession = getRememberEnabled() || sessionStorage.getItem(activeSessionKey) === "true";
    if (!hasKnownSession) return;
    getAuthStorage().setItem(lastActiveKey, String(Date.now()));
  }

  function isSessionExpired() {
    if (!getRememberEnabled() && sessionStorage.getItem(activeSessionKey) !== "true") return true;

    const lastActiveAt = Number(getAuthStorage().getItem(lastActiveKey) || 0);
    if (!lastActiveAt) return true;
    return Date.now() - lastActiveAt > authTimeoutMs;
  }

  function startAuthTracking() {
    if (authTrackingStarted) return;
    authTrackingStarted = true;

    let lastTouch = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastTouch < 30000) return;
      lastTouch = now;
      touchAuthSession();
    };

    ["click", "keydown", "touchstart", "scroll"].forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") touchAuthSession();
    });
  }

  async function getSession() {
    const client = getClient();
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    if (error) return null;
    if (data.session && isSessionExpired()) {
      await signOut();
      return null;
    }
    if (data.session) {
      touchAuthSession();
      startAuthTracking();
    }
    return data.session || null;
  }

  async function signIn(email, password, options = {}) {
    const client = getClient();
    if (!client) throw new Error("Supabase is not configured yet.");
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setAuthState(Boolean(options.remember));
    startAuthTracking();
    return data.user;
  }

  async function signOut() {
    const client = getClient();
    clearAuthState();
    if (!client) return;
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) throw error;
  }

  async function requireUser() {
    const session = await getSession();
    if (!session?.user) {
      const next = encodeURIComponent(`${window.location.pathname.split("/").pop() || "index.html"}${window.location.search}`);
      window.location.replace(`login.html?next=${next}`);
      return null;
    }
    return session.user;
  }

  async function uploadImage(file) {
    if (!file?.size) return "";
    const client = getClient();
    if (!client) throw new Error("Supabase is not configured yet.");

    const bucket = getConfig().supabaseStorageBucket || "place-images";
    const extension = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error } = await client.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

    if (error) throw error;
    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function savePlace(payload, file, id) {
    const client = getClient();
    if (!client) throw new Error("Supabase is not configured yet.");

    const imageUrl = await uploadImage(file);
    const row = {
      name: payload.name,
      location: payload.location,
      category: payload.category,
      description: payload.description,
      maps_url: payload.maps_url,
      status: payload.status,
      target_date: payload.target_date || null,
      updated_at: new Date().toISOString()
    };

    if (imageUrl) row.image_url = imageUrl;
    if (!id && !row.image_url) row.image_url = payload.image_url || "";

    const query = id
      ? client.from("places").update(row).eq("id", id).select("*").single()
      : client.from("places").insert(row).select("*").single();

    const { data, error } = await query;
    if (error) throw error;
    return normalizePlace(data);
  }

  async function updateStatus(id, status) {
    const client = getClient();
    if (!client) throw new Error("Supabase is not configured yet.");
    const { data, error } = await client
      .from("places")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return normalizePlace(data);
  }

  async function markPlaceVisited(id, visitDetails) {
    const client = getClient();
    if (!client) throw new Error("Supabase is not configured yet.");

    const { data, error } = await client.rpc("mark_place_visited", {
      place_id: id,
      visited_date: visitDetails.visited_at,
      bf_score: visitDetails.fiqry_rating,
      gf_score: visitDetails.isyana_rating,
      bf_note: visitDetails.fiqry_note || "",
      gf_note: visitDetails.isyana_note || ""
    });

    if (error) throw error;
    return normalizePlace(Array.isArray(data) ? data[0] : data);
  }

  async function savePlaceReview(id, reviewDetails) {
    const client = getClient();
    if (!client) throw new Error("Supabase is not configured yet.");

    const { data, error } = await client.rpc("save_place_review", {
      place_id: id,
      visited_date: reviewDetails.visited_at,
      reviewer_name: reviewDetails.reviewer,
      reviewer_score: reviewDetails.rating,
      reviewer_note: reviewDetails.note || ""
    });

    if (error) {
      const message = String(error.message || "").toLowerCase();
      const isMissingRpc = message.includes("save_place_review") || message.includes("function");
      if (!isMissingRpc) throw error;

      const reviewer = reviewDetails.reviewer;
      const row = {
        status: "visited",
        updated_at: new Date().toISOString()
      };

      if (reviewDetails.visited_at) row.visited_at = reviewDetails.visited_at;
      if (reviewer === "fiqry") {
        row.fiqry_rating = reviewDetails.rating;
        row.fiqry_note = reviewDetails.note || null;
      }
      if (reviewer === "isyana") {
        row.isyana_rating = reviewDetails.rating;
        row.isyana_note = reviewDetails.note || null;
      }

      const fallback = await client
        .from("places")
        .update(row)
        .eq("id", id)
        .select("*")
        .single();

      if (fallback.error) throw fallback.error;
      return normalizePlace(fallback.data);
    }
    return normalizePlace(Array.isArray(data) ? data[0] : data);
  }

  async function deletePlace(id) {
    const client = getClient();
    if (!client) throw new Error("Supabase is not configured yet.");
    const { error } = await client.from("places").delete().eq("id", id);
    if (error) throw error;
  }

  window.PlaceToGoData = {
    fetchPlaces,
    fetchPlace,
    findPlaceById,
    getClient,
    getCurrentUser,
    getSession,
    isSupabaseConfigured,
    requireUser,
    savePlace,
    signIn,
    signOut,
    updateStatus,
    markPlaceVisited,
    savePlaceReview,
    deletePlace,
    samplePlaces
  };
})();
