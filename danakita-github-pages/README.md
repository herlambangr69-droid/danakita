# DanaKita — GitHub Pages Edition

Versi statis HTML, CSS, dan JavaScript dari proyek DanaKita. Dibuat agar dapat dipublikasikan melalui GitHub Pages tanpa server Flask.

## Fitur demo
- Landing page dan kalkulator simulasi cicilan.
- Registrasi dan login demo pada browser.
- Dashboard dan riwayat simulasi lokal.
- Formulir pengajuan simulasi.
- Responsive untuk desktop dan ponsel.

## Batasan penting
GitHub Pages hanya menyajikan file statis. Tidak ada backend Flask, database server, autentikasi aman, atau sinkronisasi antarperangkat. Akun demo dan riwayat disimpan di `localStorage` browser yang sedang digunakan. Password demo juga hanya untuk demonstrasi dan tidak boleh digunakan ulang. Jangan masukkan NIK, rekening, foto identitas, atau data finansial nyata.

Simulasi menggunakan asumsi ilustratif bunga flat 1% per bulan, bukan penawaran kredit, persetujuan, atau pencairan pinjaman.

## Deploy ke GitHub Pages
1. Ekstrak ZIP ini.
2. Salin `index.html` dan folder `assets` ke repository GitHub `danakita` (di root repository).
3. Hapus atau biarkan file Flask lama; GitHub Pages akan menggunakan `index.html` di root.
4. Buka repository GitHub → **Settings** → **Pages**.
5. Pada **Build and deployment**, pilih **Deploy from a branch**.
6. Pilih branch `main` dan folder `/(root)`, lalu klik **Save**.
7. Tunggu proses selesai. URL biasanya `https://herlambangr69-droid.github.io/danakita/`.

Jika GitHub Pages tidak muncul, pastikan repository bersifat Public dan periksa tab Actions untuk status publikasi.
