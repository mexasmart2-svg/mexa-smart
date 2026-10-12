/* =====================================================
   MEXA SMART — CENTRAL CORE
   Pusat koordinasi aplikasi
   Version: 1.0.0
   ===================================================== */

(function (window) {
  "use strict";

  const VERSION = "1.0.0";

  if (window.MEXA_SMART) {
    console.warn("[MEXA SMART] Core sudah tersedia.");
    return;
  }

  let started = false;
  let starting = false;
  let startPromise = null;
  let lastError = null;

  function log(...args) {
    const config = window.MEXA_CONFIG;

    if (config && config.CORE && config.CORE.DEBUG) {
      console.log("[MEXA SMART CORE]", ...args);
    }
  }

  function getClientService() {
    return window.MEXA_SUPABASE_CLIENT || null;
  }

  async function start() {
    if (started) {
      return getStatus();
    }

    if (starting && startPromise) {
      return startPromise;
    }

    starting = true;

    startPromise = (async function () {
      try {
        const config = window.MEXA_CONFIG;

        if (!config) {
          throw new Error(
            "Konfigurasi MEXA belum dimuat."
          );
        }

        if (!window.supabase) {
          throw new Error(
            "Supabase SDK belum dimuat."
          );
        }

        const clientService = getClientService();

        if (
          !clientService ||
          typeof clientService.getClient !== "function"
        ) {
          throw new Error(
            "Layanan koneksi Supabase belum tersedia."
          );
        }

        let client = clientService.getClient();

        if (
          !client &&
          typeof clientService.init === "function"
        ) {
          await clientService.init();
          client = clientService.getClient();
        }

        if (!client) {
          throw new Error(
            "Koneksi Supabase belum berhasil diinisialisasi."
          );
        }

        started = true;
        lastError = null;

        log("Core berhasil dimulai.");

        const eventBus = window.MEXA_EVENT_BUS;

        if (eventBus) {
          eventBus.emit("core:ready", {
            version: VERSION,
            timestamp: new Date().toISOString()
          });
        }

        return getStatus();
      } catch (error) {
        lastError = error.message || String(error);

        const errorHandler = window.MEXA_ERROR_HANDLER;

        if (
          errorHandler &&
          typeof errorHandler.report === "function"
        ) {
          errorHandler.report(error, {
            source: "mexa-smart-core",
            operation: "start"
          });
        } else {
          console.error("[MEXA SMART CORE]", error);
        }

        throw error;
      } finally {
        starting = false;
        startPromise = null;
      }
    })();

    return startPromise;
  }

  function getStatus() {
    const clientService = getClientService();

    return {
      name: "MEXA SMART",
      version: VERSION,
      started: started,
      starting: starting,
      supabaseReady: Boolean(
        clientService &&
        typeof clientService.getClient === "function" &&
        clientService.getClient()
      ),
      services: {
        auth: Boolean(window.MEXA_AUTH),
        database: Boolean(window.MEXA_DATABASE),
        storage: Boolean(window.MEXA_STORAGE),
        profile: Boolean(window.MEXA_PROFILE)
      },
      lastError: lastError
    };
  }

  window.MEXA_SMART = Object.freeze({
    version: VERSION,
    start: start,
    getStatus: getStatus
  });

  log("Core berhasil dimuat.");
})(window);
