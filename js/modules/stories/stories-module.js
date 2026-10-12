/* =====================================================
   MEXA SMART — STORIES MODULE
   Modul dasar sistem Cerita 24 jam
   Version: 1.0.0
   ===================================================== */

(function (window) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "stories";

  if (window.MEXA_STORIES_MODULE) {
    console.warn("[MEXA STORIES] Modul sudah dimuat.");
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
      console.error("[MEXA STORIES]", error);
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

      initialized = true;

      const eventBus = window.MEXA_EVENT_BUS;

      if (eventBus && typeof eventBus.emit === "function") {
        eventBus.emit("stories:ready", {
          name: MODULE_NAME,
          version: VERSION,
          timestamp: new Date().toISOString(),
          lifetimeHours: 24
        });
      }

      console.log(
        "[MEXA STORIES] Modul berhasil diinisialisasi."
      );
    } catch (error) {
      reportError(error, "init");
      throw error;
    }
  }

  async function destroy() {
    if (!initialized) return;

    initialized = false;

    console.log("[MEXA STORIES] Modul dihentikan.");
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

  window.MEXA_STORIES_MODULE = api;

  const lifecycle = window.MEXA_LIFECYCLE;

  if (lifecycle && typeof lifecycle.register === "function") {
    lifecycle.register(MODULE_NAME, {
      version: VERSION,
      init: init,
      destroy: destroy
    });
  } else {
    console.warn(
      "[MEXA STORIES] Lifecycle belum tersedia."
    );
  }
})(window);
