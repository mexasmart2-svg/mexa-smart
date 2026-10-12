/* =====================================================
   MEXA SMART — MODULE REGISTRY
   Pusat pendaftaran dan status modul
   Version: 1.0.0
   ===================================================== */

(function (window) {
  "use strict";

  const VERSION = "1.0.0";

  if (window.MEXA_MODULE_REGISTRY) {
    console.warn(
      "[MEXA SMART] Module Registry sudah tersedia."
    );
    return;
  }

  const modules = new Map();

  function log(...args) {
    const config = window.MEXA_CONFIG;

    if (config && config.CORE && config.CORE.DEBUG) {
      console.log("[MEXA MODULE REGISTRY]", ...args);
    }
  }

  function normalizeName(name) {
    if (typeof name !== "string" || !name.trim()) {
      throw new TypeError(
        "Nama modul harus berupa teks yang tidak kosong."
      );
    }

    return name.trim().toLowerCase();
  }

  function register(name, options) {
    const moduleName = normalizeName(name);
    const settings = options || {};

    if (modules.has(moduleName)) {
      throw new Error(
        'Modul "' + moduleName + '" sudah terdaftar.'
      );
    }

    const record = {
      name: moduleName,
      version:
        typeof settings.version === "string"
          ? settings.version
          : "1.0.0",
      status: "registered",
      registeredAt: new Date().toISOString(),
      error: null
    };

    modules.set(moduleName, record);

    log("Modul terdaftar:", moduleName);

    return Object.freeze({
      name: record.name,
      version: record.version,
      status: record.status
    });
  }

  function setStatus(name, status, error) {
    const moduleName = normalizeName(name);
    const record = modules.get(moduleName);

    if (!record) {
      throw new Error(
        'Modul "' + moduleName + '" belum terdaftar.'
      );
    }

    const allowedStatuses = [
      "registered",
      "initializing",
      "ready",
      "disabled",
      "error"
    ];

    if (!allowedStatuses.includes(status)) {
      throw new Error(
        'Status modul "' + status + '" tidak dikenal.'
      );
    }

    record.status = status;
    record.error =
      status === "error"
        ? String(error || "Terjadi kesalahan pada modul.")
        : null;

    log("Status modul:", moduleName, status);

    return get(moduleName);
  }

  function get(name) {
    const moduleName = normalizeName(name);
    const record = modules.get(moduleName);

    return record ? { ...record } : null;
  }

  function has(name) {
    return modules.has(normalizeName(name));
  }

  function list() {
    return Array.from(modules.values()).map(
      function (record) {
        return { ...record };
      }
    );
  }

  function remove(name) {
    const moduleName = normalizeName(name);
    const removed = modules.delete(moduleName);

    if (removed) {
      log("Pendaftaran modul dihapus:", moduleName);
    }

    return removed;
  }

  function getStatus() {
    const counts = {
      registered: 0,
      initializing: 0,
      ready: 0,
      disabled: 0,
      error: 0
    };

    modules.forEach(function (record) {
      counts[record.status] += 1;
    });

    return {
      version: VERSION,
      totalModules: modules.size,
      counts: counts
    };
  }

  window.MEXA_MODULE_REGISTRY = Object.freeze({
    version: VERSION,
    register: register,
    setStatus: setStatus,
    get: get,
    has: has,
    list: list,
    remove: remove,
    getStatus: getStatus
  });

  log("Module Registry berhasil dimuat.");
})(window);
