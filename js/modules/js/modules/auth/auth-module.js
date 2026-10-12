/* =====================================================
   MEXA SMART — AUTH MODULE
   Auth Service + Lifecycle Integration
   Version: 1.0.2
   ===================================================== */

(function (window, document) {
  "use strict";

  const VERSION = "1.0.2";
  const MODULE_NAME = "auth";

  if (window.MEXA_AUTH_MODULE) {
    console.warn("[MEXA AUTH] Modul sudah dimuat.");
    return;
  }

  let initialized = false;
  let authSubscription = null;

  function getAuthService() {
    if (!window.MEXA_AUTH) {
      throw new Error(
        "MEXA AUTH SERVICE belum dimuat. Periksa auth-service.js."
      );
    }

    return window.MEXA_AUTH;
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

  async function getCurrentUser() {
    return getAuthService().getUser();
  }

  async function login(email, password) {
    const data = await getAuthService().signInWithPassword(
      email,
      password
    );

    emit("auth:login", {
      user: data.user || null
    });

    return data;
  }

  async function register(
    email,
    password,
    displayName,
    username
  ) {
    if (String(password || "").length < 6) {
      throw new Error("Kata sandi minimal 6 karakter.");
    }

    const options = {
      data: {}
    };

    if (displayName && displayName.trim()) {
      options.data.display_name = displayName.trim();
    }

    if (username && username.trim()) {
      options.data.username = username.trim().toLowerCase();
    }

    const data = await getAuthService().signUp(
      email,
      password,
      options
    );

    emit("auth:register", {
      user: data.user || null,
      session: data.session || null
    });

    return data;
  }

  async function logout() {
    await getAuthService().signOut();
    emit("auth:logout", {});
    return true;
  }

  async function sendPasswordReset(email, redirectTo) {
    const data = await getAuthService().resetPasswordForEmail(
      email,
      redirectTo
    );

    emit("auth:password-reset-requested", {
      email: String(email).trim()
    });

    return data;
  }

  function watchSession(callback) {
    if (typeof callback !== "function") {
      throw new TypeError("Callback pemantauan sesi tidak valid.");
    }

    return getAuthService().onAuthStateChange(
      function (event, session) {
        callback({
          event: event,
          session: session,
          user: session ? session.user : null
        });
      }
    );
  }

  async function init() {
    if (initialized) return;

    const auth = getAuthService();

    // Daftarkan listener sekali saat modul dimulai.
    authSubscription = watchSession(function (state) {
      emit("auth:session-changed", state);
    });

    try {
      const user = await auth.getUser();

      initialized = true;

      emit("auth:ready", {
        user: user
      });

      console.info("[MEXA AUTH] Modul berhasil diinisialisasi.");
    } catch (error) {
      if (
        authSubscription &&
        authSubscription.data &&
        authSubscription.data.subscription
      ) {
        authSubscription.data.subscription.unsubscribe();
      }

      authSubscription = null;
      throw error;
    }
  }

  async function destroy() {
    if (authSubscription && authSubscription.data) {
      const subscription = authSubscription.data.subscription;

      if (subscription) {
        subscription.unsubscribe();
      }
    }

    authSubscription = null;
    initialized = false;

    console.info("[MEXA AUTH] Modul dihentikan.");
  }

  function getStatus() {
    return {
      name: MODULE_NAME,
      version: VERSION,
      initialized: initialized
    };
  }

  const api = Object.freeze({
    version: VERSION,
    init: init,
    destroy: destroy,
    start: init,
    stop: destroy,
    getStatus: getStatus,
    getCurrentUser: getCurrentUser,
    login: login,
    register: register,
    logout: logout,
    sendPasswordReset: sendPasswordReset,
    watchSession: watchSession
  });

  window.MEXA_AUTH_MODULE = api;

  // Ikuti pola pendaftaran Home.
  const lifecycle = window.MEXA_LIFECYCLE;

  if (lifecycle) {
    lifecycle.register(MODULE_NAME, {
      version: VERSION,
      init: init,
      destroy: destroy
    });
  } else {
    console.warn(
      "[MEXA AUTH] Lifecycle belum tersedia saat modul dimuat."
    );
  }
})(window, document);
