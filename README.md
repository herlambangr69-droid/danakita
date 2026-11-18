# DanaKita — Demo Platform Pinjaman Digital

DanaKita adalah proyek portofolio full-stack berbahasa Indonesia untuk mempelajari pengembangan aplikasi web dan QA. **Aplikasi ini hanya simulasi edukatif**, bukan penyedia pinjaman, bukan layanan keuangan, dan tidak memproses pencairan dana.

## Fitur
- Registrasi dan login pengguna
- Hash password menggunakan Werkzeug
- Session cookie HttpOnly dan SameSite
- Perlindungan CSRF pada form
- Pembatasan percobaan request dasar (Flask-Limiter)
- Simulasi angsuran
- Pengajuan demo dan riwayat di dashboard
- SQLite lokal; PostgreSQL dapat digunakan saat deployment

## Jalankan secara lokal
Disarankan Python 3.11 atau 3.12.

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

Salin `.env.example` menjadi `.env`, lalu isi `SECRET_KEY` dengan nilai acak. Variabel lingkungan dapat dimuat melalui terminal atau ekstensi dotenv. Untuk pengujian lokal, aplikasi dapat berjalan dengan nilai default development; jangan gunakan secret default di server publik.

```bash
python app.py
```
Buka http://127.0.0.1:5000

## Deploy
GitHub menyimpan source code; GitHub Pages tidak menjalankan Flask atau database. Untuk menjalankan aplikasi full-stack:
1. Push repository ini ke GitHub.
2. Buat layanan Web Service di Render dan hubungkan repository.
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app`
5. Buat database PostgreSQL di Render.
6. Tambahkan environment variables pada Web Service:
   - `SECRET_KEY`: string acak panjang dan rahasia
   - `DATABASE_URL`: internal connection string PostgreSQL
   - `COOKIE_SECURE`: `1`
   - `FLASK_DEBUG`: `0`
7. Deploy dan uji HTTPS, registrasi, login, pengajuan demo, dan riwayat.

Jangan commit `.env`, password, secret, data pengguna, atau connection string ke GitHub.

## Batasan keamanan dan penggunaan
- Jangan memasukkan NIK, nomor rekening, foto KTP, data finansial, atau data pribadi nyata ke demo ini.
- Bunga 1% flat per bulan hanyalah angka contoh untuk kalkulasi antarmuka; bukan suku bunga/penawaran kredit.
- Belum ada verifikasi identitas, pemeriksaan kelayakan kredit, pembayaran, pencairan, notifikasi, panel admin, audit log, backup terkelola, atau pemantauan keamanan.
- Sebelum dipakai untuk layanan nyata, perlu threat modeling, security review, pengujian penetrasi, pengelolaan rahasia, kebijakan privasi, kontrol akses, audit, backup, dan tinjauan kepatuhan hukum/regulasi yang relevan.

## Checklist QA manual
- Registrasi dengan email valid dan password 10 karakter atau lebih.
- Registrasi email yang sama harus ditolak.
- Login dengan password salah harus gagal.
- Pengguna yang belum login tidak dapat membuka dashboard atau formulir pengajuan.
- Nominal di luar batas dan tenor tidak tersedia harus ditolak.
- Tujuan pengajuan kosong/terlalu panjang harus ditolak.
- Pengajuan valid tersimpan dan muncul di riwayat akun yang sama.
- Logout menghapus sesi.
- Uji halaman di desktop dan ponsel.
