
/* =====================================================
   MEXA SMART — AUTH MODULE
   Penghubung Auth Service dengan MEXA SMART
   Versi 1.0.1
   ===================================================== */

(function (window, document) {
  "use strict";

  if (window.MEXA_AUTH_MODULE) {
    console.warn("[MEXA AUTH] Modul sudah dimuat.");
    return;
  }

  const VERSION = "1.0.1";

  let started = false;
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

  async function start() {
    if (started) {
      return {
        success: true,
        version: VERSION,
        alreadyStarted: true
      };
    }

    const auth = getAuthService();

    authSubscription = watchSession(function (state) {
      emit("auth:session-changed", state);
    });

    try {
      const user = await auth.getUser();

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
    } catch (error) {
      if (authSubscription) {
        authSubscription.data.subscription.unsubscribe();
        authSubscription = null;
      }

      throw error;
    }
  }

  function stop() {
    if (authSubscription && authSubscription.data &&
        authSubscription.data.subscription) {
      authSubscription.data.subscription.unsubscribe();
    }

    authSubscription = null;
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
