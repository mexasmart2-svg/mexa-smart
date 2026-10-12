/* =====================================================
   MEXA SMART — AUTH SERVICE
   Versi 1.0.0
   Layanan autentikasi dan sesi terpusat
   ===================================================== */

(function (window) {
  "use strict";

  const VERSION = "1.0.0";

  if (window.MEXA_AUTH_SERVICE_VERSION === VERSION) {
    console.warn("MEXA SMART: Auth Service sudah aktif.");
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

  async function getSession() {
    const client = requireClient();
    const { data, error } = await client.auth.getSession();

    if (error) throw error;

    return data.session || null;
  }

  async function getUser() {
    const client = requireClient();
    const { data, error } = await client.auth.getUser();

    if (error) {
      if (error.name === "AuthSessionMissingError") {
        return null;
      }

      throw error;
    }

    return data.user || null;
  }

  async function signInWithPassword(email, password) {
    if (!email || !password) {
      throw new Error("Email dan kata sandi wajib diisi.");
    }

    const client = requireClient();

    const { data, error } = await client.auth.signInWithPassword({
      email: String(email).trim(),
      password
    });

    if (error) throw error;

    return data;
  }

  async function signUp(email, password, options = {}) {
    if (!email || !password) {
      throw new Error("Email dan kata sandi wajib diisi.");
    }

    const client = requireClient();

    const { data, error } = await client.auth.signUp({
      email: String(email).trim(),
      password,
      options
    });

    if (error) throw error;

    return data;
  }

  async function signOut() {
    const client = requireClient();
    const { error } = await client.auth.signOut();

    if (error) throw error;

    return true;
  }

  async function resetPasswordForEmail(email, redirectTo) {
    if (!email) {
      throw new Error("Email wajib diisi.");
    }

    const client = requireClient();

    const options = {};

    if (redirectTo) {
      options.redirectTo = redirectTo;
    }

    const { data, error } = await client.auth.resetPasswordForEmail(
      String(email).trim(),
      options
    );

    if (error) throw error;

    return data;
  }

  function onAuthStateChange(callback) {
    if (typeof callback !== "function") {
      throw new TypeError("Callback harus berupa fungsi.");
    }

    const client = requireClient();

    return client.auth.onAuthStateChange((event, session) => {
      try {
        callback(event, session);
      } catch (error) {
        console.error("[MEXA AUTH] Callback gagal:", error);
      }
    });
  }

  const api = Object.freeze({
    version: VERSION,
    getClient,
    getSession,
    getUser,
    signInWithPassword,
    signUp,
    signOut,
    resetPasswordForEmail,
    onAuthStateChange
  });

  window.MEXA_AUTH = api;
  window.MEXA_AUTH_SERVICE_VERSION = VERSION;

  console.log("MEXA SMART: Auth Service berhasil dimuat.");
})(window);
