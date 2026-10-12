/* =====================================================
   MEXA SMART — MEDIA MODULE
   Modul dasar foto dan video
   Version: 1.0.0
   ===================================================== */

(function (window, document) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "media";

  if (window.MEXA_MEDIA_MODULE) {
    console.warn("[MEXA MEDIA] Modul sudah dimuat.");
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
      console.error("[MEXA MEDIA]", error);
    }
  }

  async function init() {
    if (initialized) return;

    try {
      if (!window.MEXA_SMART) {
        throw new Error(
          "Pusat MEXA SMART belum tersedia."
        );
      }

      if (!window.MEXA_STORAGE) {
        console.warn(
          "[MEXA MEDIA] Layanan penyimpanan belum tersedia."
        );
      }

      initialized = true;

      const eventBus = window.MEXA_EVENT_BUS;

      if (eventBus && typeof eventBus.emit === "function") {
        eventBus.emit("media:ready", {
          name: MODULE_NAME,
          version: VERSION,
          timestamp: new Date().toISOString(),
          supportedTypes: ["image", "video"]
        });
      }

      console.log(
        "[MEXA MEDIA] Modul berhasil diinisialisasi."
      );
    } catch (error) {
      reportError(error, "init");
      throw error;
    }
  }

  async function destroy() {
    if (!initialized) return;

    initialized = false;

    console.log("[MEXA MEDIA] Modul dihentikan.");
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

  window.MEXA_MEDIA_MODULE = api;

  const lifecycle = window.MEXA_LIFECYCLE;

  if (lifecycle && typeof lifecycle.register === "function") {
    lifecycle.register(MODULE_NAME, {
      version: VERSION,
      init: init,
      destroy: destroy
    });
  } else {
    console.warn(
      "[MEXA MEDIA] Lifecycle belum tersedia."
    );
  }
})(window, document);
