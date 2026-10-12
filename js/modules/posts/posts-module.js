/* =====================================================
   MEXA SMART — POSTS MODULE
   Modul dasar sistem postingan
   Version: 1.0.0
   ===================================================== */

(function (window, document) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "posts";

  if (window.MEXA_POSTS_MODULE) {
    console.warn("[MEXA POSTS] Modul sudah dimuat.");
    return;
  }

  let initialized = false;

  function reportError(error, operation) {
    const handler = window.MEXA_ERROR_HANDLER;

    if (handler && typeof handler.report === "function") {
      handler.report(error, {
        source: MODULE_NAME,
        operation: operation
      });
    } else {
      console.error("[MEXA POSTS]", error);
    }
  }

  async function init() {
    if (initialized) {
      return;
    }

    try {
      if (!window.MEXA_SMART) {
        throw new Error(
          "Pusat MEXA SMART belum tersedia."
        );
      }

      if (!window.MEXA_DATABASE) {
        console.warn(
          "[MEXA POSTS] Layanan database belum tersedia."
        );
      }

      initialized = true;

      const eventBus = window.MEXA_EVENT_BUS;

      if (
        eventBus &&
        typeof eventBus.emit === "function"
      ) {
        eventBus.emit("posts:ready", {
          name: MODULE_NAME,
          version: VERSION,
          timestamp: new Date().toISOString()
        });
      }

      console.log(
        "[MEXA POSTS] Modul dasar berhasil diinisialisasi."
      );
    } catch (error) {
      reportError(error, "init");
      throw error;
    }
  }

  async function destroy() {
    if (!initialized) {
      return;
    }

    initialized = false;

    console.log(
      "[MEXA POSTS] Modul dihentikan."
    );
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

  window.MEXA_POSTS_MODULE = api;

  const lifecycle = window.MEXA_LIFECYCLE;

  if (
    lifecycle &&
    typeof lifecycle.register === "function"
  ) {
    lifecycle.register(MODULE_NAME, {
      version: VERSION,
      init: init,
      destroy: destroy
    });
  } else {
    console.warn(
      "[MEXA POSTS] Lifecycle belum tersedia. " +
      "Modul belum didaftarkan."
    );
  }
})(window, document);
