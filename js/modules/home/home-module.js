/* =====================================================
   MEXA SMART — HOME MODULE
   Modul dasar halaman Home
   Version: 1.0.0
   ===================================================== */

(function (window, document) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "home";

  if (window.MEXA_HOME_MODULE) {
    console.warn("[MEXA HOME] Modul sudah dimuat.");
    return;
  }

  let initialized = false;
  let unsubscribeCoreReady = null;

  function getElement(id) {
    return document.getElementById(id);
  }

  function setMessage(message) {
    const element = getElement("mexa-core-message");

    if (element) {
      element.textContent = message;
    }
  }

  function reportError(error, operation) {
    const handler = window.MEXA_ERROR_HANDLER;

    if (handler && typeof handler.report === "function") {
      handler.report(error, {
        source: MODULE_NAME,
        operation: operation
      });
    } else {
      console.error("[MEXA HOME]", error);
    }
  }

  async function init() {
    if (initialized) {
      return;
    }

    try {
      const homeElement = getElement("mexa-home");

      if (!homeElement) {
        throw new Error(
          "Area Home #mexa-home tidak ditemukan di index.html."
        );
      }

      if (!window.MEXA_SMART) {
        throw new Error(
          "Pusat MEXA SMART belum tersedia."
        );
      }

      homeElement.dataset.module = MODULE_NAME;
      homeElement.dataset.moduleVersion = VERSION;

      setMessage(
        "Modul Home siap. Fitur sosial akan dihubungkan bertahap."
      );

      initialized = true;

      const eventBus = window.MEXA_EVENT_BUS;

      if (eventBus) {
        eventBus.emit("home:ready", {
          name: MODULE_NAME,
          version: VERSION,
          timestamp: new Date().toISOString()
        });
      }

      console.log("[MEXA HOME] Modul berhasil diinisialisasi.");
    } catch (error) {
      reportError(error, "init");
      throw error;
    }
  }

  async function destroy() {
    if (!initialized) {
      return;
    }

    if (typeof unsubscribeCoreReady === "function") {
      unsubscribeCoreReady();
      unsubscribeCoreReady = null;
    }

    const homeElement = getElement("mexa-home");

    if (homeElement) {
      delete homeElement.dataset.module;
      delete homeElement.dataset.moduleVersion;
    }

    initialized = false;

    setMessage("Modul Home sedang tidak aktif.");

    console.log("[MEXA HOME] Modul dihentikan.");
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
    getStatus: getStatus
  });

  window.MEXA_HOME_MODULE = api;

  // Daftarkan modul ke pengelola lifecycle jika tersedia.
  const lifecycle = window.MEXA_LIFECYCLE;

  if (lifecycle) {
    lifecycle.register(MODULE_NAME, {
      version: VERSION,
      init: init,
      destroy: destroy
    });
  } else {
    console.warn(
      "[MEXA HOME] Lifecycle belum tersedia. Modul belum didaftarkan."
    );
  }
})(window, document);
