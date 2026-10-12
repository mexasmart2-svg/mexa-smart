/* =====================================================
   MEXA SMART — ERROR HANDLER
   Pusat pencatatan kesalahan aplikasi
   Version: 1.0.0
   ===================================================== */

(function (window) {
  "use strict";

  const VERSION = "1.0.0";
  const MAX_ERRORS = 100;

  if (window.MEXA_ERROR_HANDLER) {
    console.warn(
      "[MEXA SMART] Error Handler sudah tersedia."
    );
    return;
  }

  const errorLog = [];

  function getDebugMode() {
    const config = window.MEXA_CONFIG;

    return Boolean(
      config &&
      config.CORE &&
      config.CORE.DEBUG
    );
  }

  function normalizeError(error) {
    if (error instanceof Error) {
      return {
        name: error.name || "Error",
        message: error.message || "Kesalahan tidak diketahui.",
        stack: error.stack || null
      };
    }

    return {
      name: "Error",
      message: String(error || "Kesalahan tidak diketahui."),
      stack: null
    };
  }

  function report(error, context) {
    const details = normalizeError(error);
    const metadata = context || {};

    const entry = {
      id: createId(),
      timestamp: new Date().toISOString(),
      source: String(metadata.source || "unknown"),
      operation: String(metadata.operation || "unknown"),
      name: details.name,
      message: details.message,
      stack: details.stack
    };

    errorLog.push(entry);

    // Batasi log agar tidak terus bertambah tanpa batas.
    if (errorLog.length > MAX_ERRORS) {
      errorLog.shift();
    }

    console.error(
      "[MEXA SMART ERROR]",
      entry.source,
      entry.operation,
      details.message
    );

    if (getDebugMode() && details.stack) {
      console.error(details.stack);
    }

    // Beri tahu modul lain jika Event Bus sudah tersedia.
    const eventBus = window.MEXA_EVENT_BUS;

    if (
      eventBus &&
      typeof eventBus.emit === "function"
    ) {
      try {
        eventBus.emit("system:error", {
          id: entry.id,
          timestamp: entry.timestamp,
          source: entry.source,
          operation: entry.operation,
          name: entry.name,
          message: entry.message
        });
      } catch (eventError) {
        console.error(
          "[MEXA SMART] Gagal mengirim event error.",
          eventError
        );
      }
    }

    return { ...entry };
  }

  function createId() {
    return (
      "mexa-error-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function getErrors(options) {
    const settings = options || {};
    const limit = Number.isInteger(settings.limit)
      ? Math.max(0, settings.limit)
      : MAX_ERRORS;

    return errorLog
      .slice(-limit)
      .reverse()
      .map(function (entry) {
        return { ...entry };
      });
  }

  function clear() {
    const removed = errorLog.length;
    errorLog.length = 0;

    return removed;
  }

  function getStatus() {
    return {
      version: VERSION,
      ready: true,
      storedErrors: errorLog.length,
      maxErrors: MAX_ERRORS
    };
  }

  window.MEXA_ERROR_HANDLER = Object.freeze({
    version: VERSION,
    report: report,
    getErrors: getErrors,
    clear: clear,
    getStatus: getStatus
  });

  if (getDebugMode()) {
    console.log(
      "[MEXA SMART] Error Handler berhasil dimuat."
    );
  }
})(window);
