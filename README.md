# MEXA SMART

**Modular Social Platform — Built with a Central Smart Core**

MEXA SMART adalah platform sosial modular yang dirancang untuk menghubungkan seluruh fitur melalui satu pusat sistem, dengan backend khusus, pengelolaan akses yang aman, dan struktur kode yang mudah dikembangkan.

## Visi Proyek

Membangun platform sosial yang modern, responsif, aman, dan nyaman digunakan melalui HP maupun komputer.

MEXA SMART dirancang untuk mendukung postingan, foto, video, Cerita, Reels, game, rekomendasi teman, profil, grup, Messenger, notifikasi, dan fitur AI.

## Arsitektur Utama

Sistem dibangun menggunakan empat lapisan:

1. **Frontend** — HTML, CSS, dan JavaScript.
2. **Services** — layanan bersama untuk autentikasi, database, profil, dan penyimpanan.
3. **MEXA SMART CORE** — pusat komunikasi, registrasi modul, event, siklus hidup, dan penanganan error.
4. **Backend** — Supabase Auth, PostgreSQL, Storage, dan kebijakan keamanan RLS.

Setiap fitur berada dalam modul tersendiri dan berkomunikasi melalui antarmuka sistem yang terdefinisi.

## Teknologi

- HTML5
- CSS3
- JavaScript
- GitHub
- GitHub Pages
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage

## Struktur Direktori

```text
mexa-smart/
├── index.html
├── README.md
├── config/
│   └── mexa-config.js
├── js/
│   ├── core/
│   │   ├── mexa-smart-core.js
│   │   ├── mexa-event-bus.js
│   │   ├── mexa-module-registry.js
│   │   ├── mexa-error-handler.js
│   │   └── mexa-lifecycle.js
│   ├── services/
│   │   ├── supabase-client.js
│   │   ├── auth-service.js
│   │   ├── database-service.js
│   │   ├── storage-service.js
│   │   └── profile-service.js
│   └── modules/
│       ├── home/
│       ├── posts/
│       ├── games/
│       ├── friends/
│       ├── profile/
│       ├── stories/
│       ├── media/
│       ├── reels/
│       ├── messenger/
│       ├── groups/
│       ├── notifications/
│       └── mexa-ai/
└── css/
    ├── mexa-base.css
    ├── mexa-themes.css
    └── mexa-responsive.css
```

Struktur di atas merupakan target pengembangan. Folder dan file akan dibuat bertahap.

## Prinsip MEXA SMART CORE

- Menjadi pusat penghubung seluruh modul.
- Menyediakan sistem event untuk komunikasi antarmodul.
- Mengatur registrasi dan status modul.
- Menangani kesalahan dengan cara yang konsisten.
- Menyediakan siklus inisialisasi dan penghentian modul.
- Tidak menampung seluruh kode fitur dalam satu file.
- Tidak mengambil alih tanggung jawab autentikasi, database, atau keamanan backend.

## Backend dan Konfigurasi

MEXA SMART akan menggunakan proyek Supabase khusus yang terpisah dari backend proyek lama.

Seluruh modul wajib menggunakan satu Supabase client bersama melalui layanan yang ditetapkan. URL dan publishable key harus berasal dari proyek MEXA SMART yang benar.

Kunci rahasia dan `service_role` tidak boleh dimasukkan ke frontend atau repositori publik.

Setiap tabel yang memerlukan perlindungan harus menggunakan Row Level Security (RLS) dengan kebijakan akses yang sesuai.

## Modul yang Direncanakan

### 1. Beranda dan Feed
Menampilkan postingan pengguna, konten terbaru, serta rekomendasi yang relevan.

### 2. Game MEXA
Menampilkan game pilihan yang dapat dimainkan melalui sumber yang aman. Bagian game direncanakan berada di bagian tengah atas Beranda, sebelum postingan pengguna.

### 3. Rekomendasi Teman
Menyarankan akun berdasarkan minat, komunitas, teman bersama, dan wilayah umum yang digunakan sesuai pengaturan privasi pengguna.

### 4. Postingan
Mendukung teks, foto, video, interaksi, komentar, dan pembagian konten.

### 5. Profil
Menyediakan identitas publik, foto profil, informasi pengguna, dan pengaturan privasi.

### 6. Cerita
Menampilkan konten sementara dengan masa aktif 24 jam untuk setiap cerita.

### 7. Foto dan Video
Mengelola unggahan media dan menampilkan konten pada bagian yang relevan tanpa membuat salinan postingan yang tidak diperlukan.

### 8. Reels
Menyediakan pengalaman menonton video pendek.

### 9. Messenger dan Grup
Mendukung komunikasi pengguna dan interaksi komunitas.

### 10. Notifikasi
Mengelola pemberitahuan aktivitas yang relevan dengan hak akses pengguna.

### 11. MEXA AI
Direncanakan sebagai modul terpisah yang akan terhubung melalui MEXA SMART CORE.

## Game dan Rekomendasi Teman di Beranda

Urutan konten direncanakan sebagai berikut:

1. Header dan navigasi.
2. Cerita.
3. Kolom pembuatan postingan.
4. Game pilihan MEXA.
5. Feed postingan pengguna.
6. Rekomendasi teman dan konten tambahan.

Tata letak dapat disesuaikan untuk layar HP maupun komputer tanpa menghilangkan fungsi utama feed.

## Tema dan Desain

MEXA SMART dirancang menggunakan sistem tema terpusat agar seluruh modul memiliki tampilan konsisten.

Tema yang direncanakan:

- MEXA Dusk
- MEXA Sage
- MEXA Ocean
- MEXA Sand

Logo MEXA mengikuti standar desain proyek dan harus digunakan secara konsisten.

## Keamanan dan Privasi

- Setiap pengguna hanya boleh melakukan tindakan yang diizinkan untuk akunnya.
- Akses database harus mengikuti kebijakan RLS.
- Operasi administratif dilakukan melalui lingkungan server yang aman.
- Lokasi pengguna bersifat opsional dan tidak boleh mengungkap alamat atau koordinat presisi.
- Pengaturan privasi harus diterapkan pada proses pengolahan data, bukan sekadar menyembunyikan informasi di tampilan.
- Kunci rahasia tidak boleh disimpan dalam kode publik.
- Fitur yang belum selesai tidak boleh ditampilkan seolah-olah sudah berfungsi.

## Tahapan Pengembangan

1. Dokumentasi dan struktur repositori.
2. Pembuatan proyek Supabase khusus MEXA SMART.
3. Konfigurasi dan pengujian koneksi.
4. Layanan autentikasi, database, dan storage.
5. Pembangunan MEXA SMART CORE.
6. Tema dan fondasi tampilan.
7. Beranda dan sistem postingan.
8. Game dan rekomendasi teman.
9. Profil, Cerita, media, dan Reels.
10. Messenger, grup, notifikasi, dan MEXA AI.
11. Pengujian keamanan, responsivitas, dan performa.
12. Persiapan publikasi.

## Standar Pengembangan

- Gunakan modul kecil dengan tanggung jawab yang jelas.
- Hindari duplikasi koneksi dan konfigurasi backend.
- Jangan menghapus fitur yang berfungsi tanpa pemeriksaan.
- Jangan membuat tabel baru sebelum memeriksa kebutuhan dan struktur yang sudah ada.
- Uji setiap integrasi sebelum melanjutkan.
- Dokumentasikan perubahan yang memengaruhi arsitektur.

## Status Proyek

**Tahap saat ini:** dokumentasi dan fondasi awal.

Seluruh fitur di atas merupakan rancangan. Fitur baru dinyatakan selesai setelah implementasi dan pengujian berhasil dilakukan.

---

**MEXA SMART — Satu pusat sistem, modul yang teratur, dan platform yang terus berkembang.**
