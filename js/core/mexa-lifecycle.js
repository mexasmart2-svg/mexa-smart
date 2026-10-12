/* =====================================================
   MEXA SMART — LIFECYCLE
   Pengelola siklus hidup modul
   Version: 1.0.0
   ===================================================== */

(function (window) {
  "use strict";

  const VERSION = "1.0.0";

  if (window.MEXA_LIFECYCLE) {
    console.warn(
      "[MEXA SMART] Lifecycle sudah tersedia."
    );
    return;
  }

  const instances = new Map();

  function log(...args) {
    const config = window.MEXA_CONFIG;

    if (config && config.CORE && config.CORE.DEBUG) {
      console.log("[MEXA LIFECYCLE]", ...args);
    }
  }

  function getRegistry() {
    return window.MEXA_MODULE_REGISTRY || null;
  }

  function getErrorHandler() {
    return window.MEXA_ERROR_HANDLER || null;
  }

  function reportError(error, moduleName, operation) {
    const handler = getErrorHandler();

    if (handler && typeof handler.report === "function") {
      handler.report(error, {
        source: moduleName,
        operation: operation
      });
    } else {
      console.error(
        "[MEXA LIFECYCLE]",
        moduleName,
        operation,
        error
      );
    }
  }

  function register(name, definition) {
    const moduleName = normalizeName(name);

    if (instances.has(moduleName)) {
      throw new Error(
        'Lifecycle modul "' + moduleName + '" sudah terdaftar.'
      );
    }

    if (!definition || typeof definition !== "object") {
      throw new TypeError(
        "Definisi lifecycle harus berupa objek."
      );
    }

    const instance = {
      name: moduleName,
      version: definition.version || "1.0.0",
      init:
        typeof definition.init === "function"
          ? definition.init
          : null,
      destroy:
        typeof definition.destroy === "function"
          ? definition.destroy
          : null,
      status: "registered"
    };

    instances.set(moduleName, instance);

    const registry = getRegistry();

    if (registry && !registry.has(moduleName)) {
      registry.register(moduleName, {
        version: instance.version
      });
    }

    log("Lifecycle didaftarkan:", moduleName);

    return get(moduleName);
  }

  async function start(name, context) {
    const moduleName = normalizeName(name);
    const instance = instances.get(moduleName);

    if (!instance) {
      throw new Error(
        'Lifecycle modul "' + moduleName + '" tidak ditemukan.'
      );
    }

    if (instance.status === "ready") {
      return get(moduleName);
    }

    if (instance.status === "initializing") {
      throw new Error(
        'Modul "' + moduleName + '" sedang diinisialisasi.'
      );
    }

    instance.status = "initializing";
    updateRegistry(moduleName, "initializing");

    try {
      if (instance.init) {
        await instance.init(context || {});
      }

      instance.status = "ready";
      updateRegistry(moduleName, "ready");

      log("Modul siap:", moduleName);

      return get(moduleName);
    } catch (error) {
      instance.status = "error";
      updateRegistry(moduleName, "error", error);
      reportError(error, moduleName, "init");
      throw error;
    }
  }

  async function stop(name, context) {
    const moduleName = normalizeName(name);
    const instance = instances.get(moduleName);

    if (!instance) {
      throw new Error(
        'Lifecycle modul "' + moduleName + '" tidak ditemukan.'
      );
    }

    if (instance.status === "registered") {
      return get(moduleName);
    }

    try {
      if (instance.destroy) {
        await instance.destroy(context || {});
      }

      instance.status = "registered";
      updateRegistry(moduleName, "registered");

      log("Modul dihentikan:", moduleName);

      return get(moduleName);
    } catch (error) {
      instance.status = "error";
      updateRegistry(moduleName, "error", error);
      reportError(error, moduleName, "destroy");
      throw error;
    }
  }

  function updateRegistry(name, status, error) {
    const registry = getRegistry();

    if (registry && registry.has(name)) {
      registry.setStatus(name, status, error);
    }
  }

  function get(name) {
    const moduleName = normalizeName(name);
    const instance = instances.get(moduleName);

    if (!instance) return null;

    return {
      name: instance.name,
      version: instance.version,
      status: instance.status
    };
  }

  function list() {
    return Array.from(instances.keys()).map(get);
  }

  function normalizeName(name) {
    if (typeof name !== "string" || !name.trim()) {
      throw new TypeError(
        "Nama modul harus berupa teks yang tidak kosong."
      );
    }

    return name.trim().toLowerCase();
  }

  function getStatus() {
    const counts = {
      registered: 0,
      initializing: 0,
      ready: 0,
      error: 0
    };

    instances.forEach(function (instance) {
      counts[instance.status] += 1;
    });

    return {
      version: VERSION,
      totalModules: instances.size,
      counts: counts
    };
  }

  window.MEXA_LIFECYCLE = Object.freeze({
    version: VERSION,
    register: register,
    start: start,
    stop: stop,
    get: get,
    list: list,
    getStatus: getStatus
  });

  log("Lifecycle berhasil dimuat.");
})(window);
