# Simple Web Voice Recorder

Sebuah **voice recorder berbasis web** menggunakan HTML, CSS, dan JavaScript murni tanpa framework.  
Mendukung **preview**, **download MP3**, dan **visualisasi audio** (waveform & waterfall).  

---

## Fitur

- Rekam audio dari **microphone** atau headset.
- Visualisasi audio secara real-time:
  - **Waveform**
  - **Waterfall**
- Preview rekaman sebelum di-download.
- Download rekaman dalam format **MP3**.
- Hapus rekaman yang tidak diinginkan.
- Pilih perangkat input (microphone/headset) secara manual.

---

## Cara Pakai

1. **Buka halaman HTML** di browser modern (disarankan Firefox atau Chrome).
2. Pilih microphone yang ingin digunakan (jika tersedia dropdown).
3. Klik tombol **Start Recording** untuk mulai, tombol berubah menjadi **Stop Recording**.
4. Klik **Stop Recording** untuk berhenti.
5. Gunakan tombol **Preview** untuk mendengar rekaman.
6. Klik **Download** untuk menyimpan rekaman sebagai MP3.
7. Klik **Delete** untuk menghapus rekaman dari daftar sementara.

---

## Struktur File
```
/project-root
│
├─ index.html # Halaman utama
├─ style.css # Styling visual
├─ script.js # Script JavaScript untuk recorder
└─ README.md # Dokumentasi proyek
```


---

## Browser Support

- Tested di **Firefox**, **Opera** dan **Chrome**.
- Pastikan mengizinkan akses microphone.
- Audio akan kosong jika browser tidak dapat mengakses device input yang dipilih.

---

## Catatan

- Recorder menggunakan `MediaRecorder` API dan `AudioContext` API untuk visualisasi.
- Konversi ke MP3 menggunakan **lamejs** library.
- Jika rekaman hening:
  - Pastikan microphone/headset terpasang dan dipilih dengan benar.
  - Firefox kadang memilih mic default yang salah.
