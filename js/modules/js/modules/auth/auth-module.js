
/* =====================================================
   MEXA SMART — AUTH MODULE
   Auth Service + Lifecycle + Registry
   Version: 1.0.3
   ===================================================== */

(function (window, document) {
  "use strict";

  const VERSION = "1.0.3";
  const MODULE_NAME = "auth";

  /*
   * 1. PERIKSA LIFECYCLE
   */
  function getLifecycle() {
    const lifecycle = window.MEXA_LIFECYCLE;

    if (
      !lifecycle ||
      typeof lifecycle.register !== "function" ||
      typeof lifecycle.get !== "function"
    ) {
      throw new Error(
        "MEXA LIFECYCLE belum tersedia. " +
        "Periksa urutan script di index.html."
      );
    }

    return lifecycle;
  }

  /*
   * 2. PERIKSA AUTH SERVICE
   */
  function getAuthService() {
    const auth = window.MEXA_AUTH;

    if (!auth) {
      throw new Error(
        "MEXA AUTH SERVICE belum dimuat. " +
        "Periksa auth-service.js."
      );
    }

    return auth;
  }

  /*
   * 3. SISTEM EVENT
   */
  function emit(eventName, detail) {
    const payload = detail || {};
    const bus = window.MEXA_EVENT_BUS;

    if (bus && typeof bus.emit === "function") {
      bus.emit(eventName, payload);
    }

    document.dispatchEvent(
      new CustomEvent("mexa:" + eventName, {
        detail: payload
      })
    );
  }

  /*
   * 4. PULIHKAN PENDAFTARAN JIKA API SUDAH ADA
   */
  const existingModule = window.MEXA_AUTH_MODULE;

  if (existingModule) {
    try {
      const lifecycle = getLifecycle();

      if (!lifecycle.get(MODULE_NAME)) {
        lifecycle.register(MODULE_NAME, {
          version: existingModule.version || VERSION,
          init: existingModule.init || existingModule.start,
          destroy:
            existingModule.destroy || existingModule.stop
        });

        console.info(
          "[MEXA AUTH] Pendaftaran Lifecycle dipulihkan."
        );
      }
    } catch (error) {
      console.error(
        "[MEXA AUTH] Pemulihan pendaftaran gagal:",
        error
      );
    }

    return;
  }

  let initialized = false;
  let authSubscription = null;
  let initPromise = null;

  /*
   * 5. PENGAMBILAN USER
   */
  async function getCurrentUser() {
    return getAuthService().getUser();
  }

  /*
   * 6. LOGIN
   */
  async function login(email, password) {
    const data = await getAuthService()
      .signInWithPassword(email, password);

    emit("auth:login", {
      user: data.user || null
    });

    return data;
  }

  /*
   * 7. REGISTRASI
   */
  async function register(
    email,
    password,
    displayName,
    username
  ) {
    if (String(password || "").length < 6) {
      throw new Error(
        "Kata sandi minimal 6 karakter."
      );
    }

    const options = {
      data: {}
    };

    if (displayName && displayName.trim()) {
      options.data.display_name = displayName.trim();
    }

    if (username && username.trim()) {
      options.data.username =
        username.trim().toLowerCase();
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

  /*
   * 8. LOGOUT
   */
  async function logout() {
    await getAuthService().signOut();

    emit("auth:logout", {});

    return true;
  }

  /*
   * 9. RESET PASSWORD
   */
  async function sendPasswordReset(email, redirectTo) {
    const data = await getAuthService()
      .resetPasswordForEmail(email, redirectTo);

    emit("auth:password-reset-requested", {
      email: String(email).trim()
    });

    return data;
  }

  /*
   * 10. PEMANTAUAN SESI
   */
  function watchSession(callback) {
    if (typeof callback !== "function") {
      throw new TypeError(
        "Callback pemantauan sesi tidak valid."
      );
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

  /*
   * 11. INISIALISASI MODUL
   */
  async function init() {
    if (initialized) return;

    if (initPromise) {
      return initPromise;
    }

    initPromise = (async function () {
      const auth = getAuthService();

      let subscriptionResult = null;

      try {
        subscriptionResult = watchSession(
          function (state) {
            emit("auth:session-changed", state);
          }
        );

        authSubscription = subscriptionResult;

        const user = await auth.getUser();

        initialized = true;

        emit("auth:ready", {
          user: user || null
        });

        console.info(
          "[MEXA AUTH] Modul berhasil diinisialisasi."
        );
      } catch (error) {
        if (
          subscriptionResult &&
          subscriptionResult.data &&
          subscriptionResult.data.subscription
        ) {
          subscriptionResult.data.subscription.unsubscribe();
        }

        authSubscription = null;
        initialized = false;

        throw error;
      } finally {
        initPromise = null;
      }
    })();

    return initPromise;
  }

  /*
   * 12. MENGHENTIKAN MODUL
   */
  async function destroy() {
    if (authSubscription && authSubscription.data) {
      const subscription =
        authSubscription.data.subscription;

      if (subscription) {
        subscription.unsubscribe();
      }
    }

    authSubscription = null;
    initialized = false;
    initPromise = null;

    console.info(
      "[MEXA AUTH] Modul dihentikan."
    );
  }

  /*
   * 13. STATUS MODUL
   */
  function getStatus() {
    return {
      name: MODULE_NAME,
      version: VERSION,
      initialized: initialized
    };
  }

  /*
   * 14. API PUBLIK AUTH
   */
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

  /*
   * 15. DAFTARKAN KE LIFECYCLE
   */
  try {
    const lifecycle = getLifecycle();

    if (!lifecycle.get(MODULE_NAME)) {
      lifecycle.register(MODULE_NAME, {
        version: VERSION,
        init: init,
        destroy: destroy
      });
    }

    /*
     * 16. PASTIKAN REGISTRY MENCATAT AUTH
     */
    const registry = window.MEXA_MODULE_REGISTRY;

    if (
      registry &&
      typeof registry.has === "function" &&
      typeof registry.register === "function" &&
      !registry.has(MODULE_NAME)
    ) {
      registry.register(MODULE_NAME, {
        version: VERSION
      });
    }

    console.info(
      "[MEXA AUTH] API tersedia; pendaftaran diperiksa."
    );
  } catch (error) {
    console.error(
      "[MEXA AUTH] Pendaftaran modul gagal:",
      error
    );
  }
})(window, document);
