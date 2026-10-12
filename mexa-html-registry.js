/* =====================================================
   MEXA SMART
   HTML REGISTRY — CENTRAL ENTRY
   Version: 1.0.0

   URUTAN:
   1. HTML Registry
   2. themes.css
   3. System Penghubung 1
   4. themes.js

   Catatan:
   Registry mencatat sistem dan jalur file.
   themes.css mengatur tampilan.
   themes.js mengatur perilaku tema.
   ===================================================== */

(function (window, document) {
  "use strict";

  if (window.MEXA_HTML_REGISTRY) {
    console.warn(
      "[MEXA REGISTRY] Registry sudah aktif."
    );
    return;
  }

  const VERSION = "1.0.0";
  const records = new Map();
  const loadedFiles = new Map();

  const ROOT = "./";

  /*
   * DAFTAR FILE GLOBAL
   *
   * Urutan dimulai dari 1.
   * CSS dimuat sebelum JavaScript tema.
   */
  const MANIFEST = [
    {
      name: "themes-style",
      version: "1.0.0",
      type: "stylesheet",
      file: ROOT + "themes.css",
      position: "head",
      order: 1,
      dependencies: [],
      description: "Desain global dan variabel tema MEXA."
    },
    {
      name: "connector-1",
      version: "1.0.0",
      type: "connector",
      file: ROOT + "js/core/mexa-connector-1.js",
      position: "before-themes",
      order: 2,
      dependencies: ["mexa-html-registry"],
      description:
        "Penghubung pendaftaran Registry ke System Pusat."
    },
    {
      name: "themes",
      version: "1.0.0",
      type: "theme-system",
      file: ROOT + "themes.js",
      position: "after-connector-1",
      order: 3,
      dependencies: [
        "mexa-html-registry",
        "connector-1"
      ],
      description:
        "Mesin tema utama untuk seluruh modul MEXA."
    }
  ];

  function normalizeName(name) {
    if (typeof name !== "string" || !name.trim()) {
      throw new TypeError(
        "Nama Registry wajib berupa teks."
      );
    }

    return name.trim().toLowerCase();
  }

  function clone(record) {
    return {
      ...record,
      dependencies: [...record.dependencies]
    };
  }

  /*
   * PENDAFTARAN SISTEM ATAU MODUL
   */
  function register(definition) {
    if (
      !definition ||
      typeof definition !== "object" ||
      Array.isArray(definition)
    ) {
      throw new TypeError(
        "Data pendaftaran harus berupa objek."
      );
    }

    const name = normalizeName(definition.name);
    const existing = records.get(name);

    const incoming = {
      name,
      version: definition.version || "1.0.0",
      type: definition.type || "module",
      file: definition.file || definition.script || null,
      css: definition.css || null,
      position: definition.position || "module",
      order: Number.isFinite(definition.order)
        ? definition.order
        : 100,
      dependencies: Array.isArray(definition.dependencies)
        ? definition.dependencies.map(normalizeName)
        : [],
      description: definition.description || "",
      status: "registered",
      registeredAt: new Date().toISOString(),
      error: null
    };

    if (existing) {
      const comparableFields = [
        "version",
        "type",
        "file",
        "position",
        "order",
        "description"
      ];

      for (const field of comparableFields) {
        if (
          definition[field] !== undefined &&
          definition[field] !== null &&
          field !== "file" &&
          existing[field] !== incoming[field]
        ) {
          throw new Error(
            'Konflik Registry "' + name +
            '" pada bagian ' + field + "."
          );
        }
      }

      if (
        definition.file !== undefined &&
        definition.file !== null &&
        existing.file !== incoming.file
      ) {
        throw new Error(
          'Konflik jalur file Registry "' + name + '".'
        );
      }

      if (
        definition.css &&
        existing.css &&
        existing.css !== definition.css
      ) {
        throw new Error(
          'Konflik file CSS Registry "' + name + '".'
        );
      }

      return clone(existing);
    }

    records.set(name, incoming);

    console.log(
      "[MEXA REGISTRY] Terdaftar:",
      name
    );

    return clone(incoming);
  }

  function get(name) {
    const record = records.get(normalizeName(name));
    return record ? clone(record) : null;
  }

  function has(name) {
    return records.has(normalizeName(name));
  }

  function list() {
    return Array.from(records.values())
      .sort((a, b) => a.order - b.order)
      .map(clone);
  }

  function setStatus(name, status, error = null) {
    const record = records.get(normalizeName(name));

    if (!record) {
      throw new Error(
        'Registry "' + name + '" belum terdaftar.'
      );
    }

    const allowed = [
      "registered",
      "loading",
      "ready",
      "error",
      "disabled"
    ];

    if (!allowed.includes(status)) {
      throw new Error(
        'Status Registry tidak valid: ' + status
      );
    }

    record.status = status;
    record.error = error
      ? String(error.message || error)
      : null;

    return clone(record);
  }

  /*
   * MEMUAT FILE CSS
   */
  function loadStylesheet(url) {
    const existing = document.querySelector(
      'link[data-mexa-registry-file="' + url + '"]'
    );

    if (existing) {
      return Promise.resolve(existing);
    }

    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.href = url;
    link.dataset.mexaRegistryFile = url;

    return new Promise((resolve, reject) => {
      link.onload = () => {
        loadedFiles.set(url, "ready");
        resolve(link);
      };

      link.onerror = () => {
        loadedFiles.set(url, "error");
        link.remove();

        reject(
          new Error("Gagal memuat CSS: " + url)
        );
      };

      document.head.appendChild(link);
    });
  }

  /*
   * MEMUAT JAVASCRIPT SATU PER SATU
   */
  function loadScript(url) {
    if (loadedFiles.get(url) === "ready") {
      return Promise.resolve();
    }

    const existing = document.querySelector(
      'script[data-mexa-registry-file="' + url + '"]'
    );

    if (existing) {
      if (existing.dataset.mexaLoaded === "true") {
        loadedFiles.set(url, "ready");
        return Promise.resolve();
      }

      if (existing.dataset.mexaFailed === "true") {
        return Promise.reject(
          new Error("Script gagal dimuat: " + url)
        );
      }

      return new Promise((resolve, reject) => {
        existing.addEventListener("load", resolve, {
          once: true
        });

        existing.addEventListener("error", () => {
          reject(
            new Error("Gagal memuat script: " + url)
          );
        }, { once: true });
      });
    }

    const script = document.createElement("script");

    script.src = url;
    script.async = false;
    script.dataset.mexaRegistryFile = url;

    return new Promise((resolve, reject) => {
      script.onload = () => {
        script.dataset.mexaLoaded = "true";
        loadedFiles.set(url, "ready");
        resolve();
      };

      script.onerror = () => {
        script.dataset.mexaFailed = "true";
        loadedFiles.set(url, "error");

        reject(
          new Error("Gagal memuat script: " + url)
        );
      };

      document.body.appendChild(script);
    });
  }

  /*
   * MENJALANKAN MANIFEST SESUAI URUTAN
   */
  async function initialize() {
    const css = MANIFEST.find(
      item => item.type === "stylesheet"
    );

    const connector = MANIFEST.find(
      item => item.name === "connector-1"
    );

    const themes = MANIFEST.find(
      item => item.name === "themes"
    );

    try {
      setStatus("themes-style", "loading");

      await loadStylesheet(css.file);

      setStatus("themes-style", "ready");

      setStatus("connector-1", "loading");

      await loadScript(connector.file);

      if (!window.MEXA_CONNECTOR_1) {
        throw new Error(
          "Penghubung 1 tidak mendaftarkan API global."
        );
      }

      setStatus("connector-1", "ready");

      setStatus("themes", "loading");

      await loadScript(themes.file);

      if (!window.MEXA_THEMES) {
        throw new Error(
          "themes.js tidak mendaftarkan API global."
        );
      }

      setStatus("themes", "ready");

      console.log(
        "[MEXA REGISTRY] File global berhasil dimuat."
      );

      return getStatus();
    } catch (error) {
      console.error(
        "[MEXA REGISTRY] Inisialisasi gagal:",
        error
      );

      for (const item of MANIFEST) {
        const record = records.get(item.name);

        if (record && record.status === "loading") {
          setStatus(item.name, "error", error);
        }
      }

      return getStatus();
    }
  }

  function getStatus() {
    const items = list();

    return {
      name: "MEXA HTML Registry",
      version: VERSION,
      ready: items.every(
        item => item.status === "ready"
      ),
      total: items.length,
      files: items,
      loadedFiles: Object.fromEntries(loadedFiles)
    };
  }

  /*
   * DAFTARKAN REGISTRY DAN SEMUA FILE GLOBAL
   */
  register({
    name: "mexa-html-registry",
    version: VERSION,
    type: "registry",
    file: ROOT + "js/core/mexa-html-registry.js",
    position: "entry",
    order: 0,
    description:
      "Pintu masuk untuk pendaftaran sistem global MEXA."
  });

  MANIFEST.forEach(item => {
    register({
      name: item.name,
      version: item.version,
      type: item.type,
      file: item.file,
      position: item.position,
      order: item.order,
      dependencies: item.dependencies,
      description: item.description
    });
  });

  window.MEXA_HTML_REGISTRY = Object.freeze({
    version: VERSION,
    register,
    get,
    has,
    list,
    setStatus,
    getStatus,
    initialize
  });

  console.log(
    "[MEXA REGISTRY] Pendaftaran global selesai."
  );

  /*
   * Mulai setelah Registry siap dipublikasikan.
   */
  initialize();

})(window, document);
