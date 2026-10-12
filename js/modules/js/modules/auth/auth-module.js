
/* =====================================================
   MEXA SMART — AUTH MODULE
   Login, Register, Logout, dan Pemantauan Sesi
   Versi: 1.0.0
   ===================================================== */

(function (window, document) {
  "use strict";

  if (window.MEXA_AUTH_MODULE) {
    console.warn("[MEXA AUTH] Modul sudah dimuat.");
    return;
  }

  const VERSION = "1.0.0";

  let started = false;
  let authSubscription = null;

  function getClient() {
    if (
      window.MEXA_SUPABASE_CLIENT &&
      typeof window.MEXA_SUPABASE_CLIENT.getClient === "function"
    ) {
      return window.MEXA_SUPABASE_CLIENT.getClient();
    }

    if (window.mexaSupabase) {
      return window.mexaSupabase;
    }

    throw new Error(
      "Koneksi Supabase belum tersedia. Periksa supabase-client.js."
    );
  }

  function getCurrentUser() {
    return getClient().auth.getUser().then(function (result) {
      if (result.error) throw result.error;
      return result.data.user || null;
    });
  }

  function emit(eventName, detail) {
    const bus = window.MEXA_EVENT_BUS;

    if (bus && typeof bus.emit === "function") {
      bus.emit(eventName, detail || {});
    }

    document.dispatchEvent(
      new CustomEvent("mexa:" + eventName, {
        detail: detail || {}
      })
    );
  }

  async function login(email, password) {
    if (!email || !password) {
      throw new Error("Email dan kata sandi wajib diisi.");
    }

    const result = await getClient().auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (result.error) throw result.error;

    emit("auth:login", {
      user: result.data.user
    });

    return result.data;
  }

  async function register(email, password, displayName, username) {
    if (!email || !password) {
      throw new Error("Email dan kata sandi wajib diisi.");
    }

    if (password.length < 6) {
      throw new Error("Kata sandi minimal 6 karakter.");
    }

    const metadata = {};

    if (displayName && displayName.trim()) {
      metadata.display_name = displayName.trim();
    }

    if (username && username.trim()) {
      metadata.username = username.trim().toLowerCase();
    }

    const result = await getClient().auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: metadata
      }
    });

    if (result.error) throw result.error;

    emit("auth:register", {
      user: result.data.user,
      session: result.data.session
    });

    return result.data;
  }

  async function logout() {
    const result = await getClient().auth.signOut();

    if (result.error) throw result.error;

    emit("auth:logout", {});

    return true;
  }

  async function sendPasswordReset(email, redirectTo) {
    if (!email) {
      throw new Error("Masukkan email akun terlebih dahulu.");
    }

    const options = {};

    if (redirectTo) {
      options.redirectTo = redirectTo;
    }

    const result = await getClient().auth.resetPasswordForEmail(
      email.trim(),
      options
    );

    if (result.error) throw result.error;

    emit("auth:password-reset-requested", {
      email: email.trim()
    });

    return true;
  }

  function watchSession(callback) {
    if (typeof callback !== "function") {
      throw new Error("Callback pemantauan sesi tidak valid.");
    }

    const result = getClient().auth.onAuthStateChange(
      function (event, session) {
        callback({
          event: event,
          session: session,
          user: session ? session.user : null
        });
      }
    );

    return result.data.subscription;
  }

  async function start() {
    if (started) {
      return {
        success: true,
        version: VERSION,
        alreadyStarted: true
      };
    }

    const client = getClient();

    if (!client.auth) {
      throw new Error("Layanan autentikasi Supabase tidak tersedia.");
    }

    authSubscription = watchSession(function (state) {
      emit("auth:session-changed", state);
    });

    const user = await getCurrentUser();

    started = true;

    emit("auth:ready", {
      user: user
    });

    console.info("[MEXA AUTH] Modul autentikasi siap.");

    return {
      success: true,
      version: VERSION,
      user: user
    };
  }

  function stop() {
    if (authSubscription) {
      authSubscription.unsubscribe();
      authSubscription = null;
    }

    started = false;

    return true;
  }

  window.MEXA_AUTH_MODULE = {
    version: VERSION,
    start: start,
    stop: stop,
    getCurrentUser: getCurrentUser,
    login: login,
    register: register,
    logout: logout,
    sendPasswordReset: sendPasswordReset,
    watchSession: watchSession
  };

})(window, document);
