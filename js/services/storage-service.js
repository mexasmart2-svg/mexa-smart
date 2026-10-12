/* =====================================================
   MEXA SMART — STORAGE SERVICE
   Versi 1.0.0
   Layanan penyimpanan media terpusat
   ===================================================== */

(function (window) {
  "use strict";

  const VERSION = "1.0.0";

  if (window.MEXA_STORAGE_SERVICE_VERSION === VERSION) {
    console.warn("MEXA SMART: Storage Service sudah aktif.");
    return;
  }

  function getClient() {
    if (
      window.MEXA_SUPABASE_CLIENT &&
      typeof window.MEXA_SUPABASE_CLIENT.getClient === "function"
    ) {
      return window.MEXA_SUPABASE_CLIENT.getClient();
    }

    return window.mexaSupabase || null;
  }

  function requireClient() {
    const client = getClient();

    if (!client) {
      throw new Error(
        "Supabase belum siap. Periksa konfigurasi dan urutan script."
      );
    }

    return client;
  }

  function validateBucket(bucketName) {
    if (
      typeof bucketName !== "string" ||
      !/^[a-zA-Z0-9_-]+$/.test(bucketName)
    ) {
      throw new TypeError("Nama bucket tidak valid.");
    }

    return requireClient().storage.from(bucketName);
  }

  function validatePath(path) {
    if (
      typeof path !== "string" ||
      !path.trim() ||
      path.startsWith("/") ||
      path.split("/").some(part =>
        !part || part === "." || part === ".."
      )
    ) {
      throw new TypeError("Path berkas tidak valid.");
    }

    return path;
  }

  async function upload(bucketName, path, file, options = {}) {
    if (!(file instanceof Blob)) {
      throw new TypeError("Berkas upload tidak valid.");
    }

    const maxBytes = Number.isFinite(options.maxBytes)
      ? options.maxBytes
      : 25 * 1024 * 1024;

    if (file.size > maxBytes) {
      throw new Error("Ukuran berkas melebihi batas yang diizinkan.");
    }

    const bucket = validateBucket(bucketName);
    const safePath = validatePath(path);

    const uploadOptions = {
      cacheControl: String(options.cacheControl || "3600"),
      upsert: options.upsert === true
    };

    if (options.contentType) {
      uploadOptions.contentType = options.contentType;
    } else if (file.type) {
      uploadOptions.contentType = file.type;
    }

    const { data, error } = await bucket.upload(
      safePath,
      file,
      uploadOptions
    );

    if (error) throw error;

    return data;
  }

  async function remove(bucketName, paths) {
    if (!Array.isArray(paths) || paths.length === 0) {
      throw new TypeError("Daftar path berkas wajib diisi.");
    }

    const safePaths = paths.map(validatePath);
    const bucket = validateBucket(bucketName);

    const { data, error } = await bucket.remove(safePaths);

    if (error) throw error;

    return data;
  }

  function getPublicUrl(bucketName, path) {
    const bucket = validateBucket(bucketName);
    const safePath = validatePath(path);

    const { data, error } = bucket.getPublicUrl(safePath);

    if (error) throw error;

    return data.publicUrl;
  }

  async function createSignedUrl(
    bucketName,
    path,
    expiresIn = 300
  ) {
    const bucket = validateBucket(bucketName);
    const safePath = validatePath(path);

    const duration = Number.isInteger(expiresIn)
      ? Math.min(Math.max(expiresIn, 1), 604800)
      : 300;

    const { data, error } = await bucket.createSignedUrl(
      safePath,
      duration
    );

    if (error) throw error;

    return data.signedUrl;
  }

  const api = Object.freeze({
    version: VERSION,
    upload,
    remove,
    getPublicUrl,
    createSignedUrl
  });

  window.MEXA_STORAGE = api;
  window.MEXA_STORAGE_SERVICE_VERSION = VERSION;

  console.log("MEXA SMART: Storage Service berhasil dimuat.");
})(window);
