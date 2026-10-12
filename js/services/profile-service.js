/* =====================================================
   MEXA SMART — PROFILE SERVICE
   Versi 1.0.0
   Layanan data profil pengguna
   ===================================================== */

(function (window) {
  "use strict";

  const VERSION = "1.0.0";

  if (window.MEXA_PROFILE_SERVICE_VERSION === VERSION) {
    console.warn("MEXA SMART: Profile Service sudah aktif.");
    return;
  }

  function getClient() {
    if (
      window.MEXA_SUPABASE_CLIENT &&
      typeof window.MEXA_SUPABASE_CLIENT.getClient === "function"
    ) {
      return window.MEXA_SUPABASE_CLIENT.getClient();
    }

    return window.mexaSupabase || null;
  }

  function requireClient() {
    const client = getClient();

    if (!client) {
      throw new Error(
        "Supabase belum siap. Periksa konfigurasi dan urutan script."
      );
    }

    return client;
  }

  function validateUserId(userId) {
    if (
      typeof userId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
    ) {
      throw new TypeError("ID pengguna tidak valid.");
    }

    return userId;
  }

  async function getMyProfile() {
    const client = requireClient();
    const { data: authData, error: authError } =
      await client.auth.getUser();

    if (authError) throw authError;

    const user = authData.user;

    if (!user) {
      throw new Error("Silakan login terlebih dahulu.");
    }

    return getProfileById(user.id);
  }

  async function getProfileById(userId) {
    validateUserId(userId);

    const client = requireClient();

    const { data, error } = await client
      .from("profiles")
      .select(
        "id, display_name, username, avatar_url, cover_url, bio, location, website"
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;

    return data;
  }

  async function updateMyProfile(profile) {
    if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
      throw new TypeError("Data profil tidak valid.");
    }

    const allowedFields = [
      "display_name",
      "username",
      "avatar_url",
      "cover_url",
      "bio",
      "location",
      "website"
    ];

    const values = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(profile, field)) {
        const value = profile[field];

        if (value !== null && typeof value !== "string") {
          throw new TypeError(
            "Nilai kolom profil harus berupa teks atau null."
          );
        }

        values[field] = value;
      }
    }

    if (Object.keys(values).length === 0) {
      throw new Error("Tidak ada perubahan profil yang diberikan.");
    }

    const client = requireClient();
    const { data: authData, error: authError } =
      await client.auth.getUser();

    if (authError) throw authError;

    const user = authData.user;

    if (!user) {
      throw new Error("Silakan login terlebih dahulu.");
    }

    const { data, error } = await client
      .from("profiles")
      .update(values)
      .eq("id", user.id)
      .select(
        "id, display_name, username, avatar_url, cover_url, bio, location, website"
      )
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error(
        "Profil tidak ditemukan atau perubahan ditolak oleh kebijakan akses."
      );
    }

    return data;
  }

  const api = Object.freeze({
    version: VERSION,
    getMyProfile,
    getProfileById,
    updateMyProfile
  });

  window.MEXA_PROFILE = api;
  window.MEXA_PROFILE_SERVICE_VERSION = VERSION;

  console.log("MEXA SMART: Profile Service berhasil dimuat.");
})(window);
