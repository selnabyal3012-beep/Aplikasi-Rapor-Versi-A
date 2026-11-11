import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Printer,
  Copy,
  Check,
  Laptop,
  Database,
  Award,
  GraduationCap,
  School,
  FileSpreadsheet,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Share2,
  Layers,
  ArrowRight,
  BookMarked,
  SlidersHorizontal,
  Compass,
  FileText,
  Lightbulb,
  AlertCircle,
  Download,
  WifiOff,
  Wifi,
  HardDrive,
  Sparkles,
  Monitor
} from 'lucide-react';
import { useApp, MenuKey } from '../../context/AppContext';
import { InstallPcModal } from '../modals/InstallPcModal';

interface Chapter {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  targetRole: ('semua' | 'wali_kelas' | 'guru_mapel' | 'operator' | 'kepala_sekolah')[];
  relatedMenuKey?: MenuKey;
  relatedMenuLabel?: string;
  subsections: {
    title: string;
    content: React.ReactNode;
  }[];
}

export const UserGuideSection: React.FC = () => {
  const { setActiveMenu, db } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'semua' | 'wali_kelas' | 'guru_mapel' | 'operator' | 'kepala_sekolah'>('semua');
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    'bab-1': true,
    'bab-2': false,
    'bab-3': false,
    'bab-4': true,
    'bab-5': true,
    'bab-6': false,
    'bab-7': false,
    'bab-8': true,
    'bab-9': false,
    'bab-10': true,
    'bab-11': true
  });
  const [copied, setCopied] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [copiedAppUrl, setCopiedAppUrl] = useState(false);

  const toggleChapter = (id: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    chapters.forEach((ch) => {
      allExpanded[ch.id] = true;
    });
    setExpandedChapters(allExpanded);
  };

  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    chapters.forEach((ch) => {
      allCollapsed[ch.id] = false;
    });
    setExpandedChapters(allCollapsed);
  };

  const handlePrint = () => {
    expandAll();
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleCopySummary = () => {
    const summaryText = `BUKU PANDUAN RINGKAS APLIKASI RAPOR KURIKULUM MERDEKA SD NEGERI BALIL
Pengembang: Selpius Nabyal, S.Pd.Gr.
Tahun Ajaran: ${db.sekolah.tahunPelajaran}

RINGKASAN ALUR PENGGUNAAN:
1. Pemasangan Aplikasi: Klik tombol "INSTAL DI LAPTOP (OFFLINE)" di bilah atas untuk menjadikan software mandiri tanpa butuh browser.
2. Identitas & Pokok: Lengkapi Data Sekolah, Guru, Siswa (dapat import Excel), dan Rombel Kelas.
3. Penetapan TP: Isi Mata Pelajaran dan Tujuan Pembelajaran (TP) per lingkup materi.
4. Input Nilai: Masukkan nilai Formatif & Sumatif. Deskripsi capaian kompetensi terisi otomatis.
5. Keputusan Rapor: Di bawah tabel C. Ketidakhadiran, tentukan Naik Kelas / Tinggal di Kelas.
6. Projek P5: Rencanakan dimensi, fase, dan beri penilaian BB / MB / BSH / SB.
7. Piagam: Buat piagam juara 1-3 atau prestasi khusus siswa.
8. Cetak Rapor: Gunakan kertas F4/A4, matikan "Headers and Footers" di opsi cetak browser.
9. Cadangan Data: Buka menu BACKUP & RESTORE DB untuk unduh file cadangan .JSON secara berkala.`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const chapters: Chapter[] = useMemo(
    () => [
      {
        id: 'bab-1',
        number: 'BAB I',
        title: 'Pengenalan & Instalasi Software Mandiri (Desktop & Offline)',
        subtitle: 'Teknologi Progressive Web App (PWA), keunggulan tanpa kuota, dan panduan instalasi di laptop.',
        targetRole: ['semua', 'operator'],
        relatedMenuKey: 'dashboard',
        relatedMenuLabel: 'Buka Dashboard',
        subsections: [
          {
            title: '1.1 Mengenal Aplikasi Rapor Kurikulum Merdeka SD',
            content: (
              <div className="space-y-3 text-slate-700 leading-relaxed text-sm">
                <p>
                  Aplikasi Rapor Kurikulum Merdeka ini dirancang khusus untuk mempermudah Bapak/Ibu Guru dan Tenaga Kependidikan di <strong>SD Negeri Balil</strong>, Distrik Oksibil, Kabupaten Pegunungan Bintang dalam melakukan pencatatan nilai, perumusan deskripsi capaian kompetensi, penilaian Projek Penguatan Profil Pelajar Pancasila (P5), penerbitan piagam penghargaan, hingga pencetakan buku rapor dan leger nilai secara otomatis.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-2">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="font-bold text-emerald-800 block text-xs mb-1">100% OFFLINE</span>
                    <p className="text-xs text-emerald-700">
                      Dapat beroperasi lancar tanpa koneksi internet sama sekali setelah disimpan di perangkat. Sangat cocok untuk daerah pedalaman atau kendala sinyal.
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="font-bold text-blue-800 block text-xs mb-1">BEBAS MASA AKTIF</span>
                    <p className="text-xs text-blue-700">
                      Tidak memiliki batas kadaluwarsa, tidak ada biaya langganan, dan dapat dipakai selamanya untuk semester ganjil/genap dan tahun-tahun berikutnya.
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                    <span className="font-bold text-purple-800 block text-xs mb-1">PENYIMPANAN AMAN</span>
                    <p className="text-xs text-purple-700">
                      Data disimpan langsung di laptop (Local Database) dan dilindungi fitur ekspor-impor cadangan database (.JSON) serta ekspor Excel (.xlsx).
                    </p>
                  </div>
                </div>
              </div>
            )
          },
          {
            title: '1.2 Cara Memasang (Instal) sebagai Software Desktop Mandiri (PWA) di Chrome & Edge',
            content: (
              <div className="space-y-4 text-slate-700 leading-relaxed text-sm">
                <p>
                  Aplikasi ini dibangun menggunakan teknologi <strong>Progressive Web App (PWA) Standalone</strong>. Anda <strong>tidak perlu mengunduh file .exe berukuran ratusan MB</strong>. Dengan PWA, browser Google Chrome atau Microsoft Edge akan langsung mengemas sistem ini menjadi program mandiri di laptop:
                </p>

                {/* 2 Kolom: Chrome vs Edge */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Google Chrome */}
                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm pb-1 border-b border-blue-200">
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">C</div>
                      <span>Panduan di Google Chrome (Windows / Mac)</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                        <p className="text-slate-700">
                          Buka tautan aplikasi di <strong>Google Chrome</strong>.
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                        <p className="text-slate-700">
                          Klik tombol <strong>&ldquo;INSTAL PC&rdquo;</strong> di bilah atas aplikasi, ATAU klik ikon titik tiga (<strong>⋮</strong>) di sudut kanan paling atas Chrome.
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                        <p className="text-slate-700">
                          Pilih menu <strong>&ldquo;Simpan dan bagikan&rdquo;</strong> lalu klik <strong>&ldquo;Instal Halaman Ini sebagai Aplikasi&rdquo;</strong>.
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">4</span>
                        <p className="text-slate-700">
                          Klik <strong>&ldquo;Instal&rdquo;</strong> pada dialog konfirmasi. Selesai! Shortcut langsung muncul di Desktop &amp; Menu Start.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Microsoft Edge */}
                  <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2 text-teal-900 font-extrabold text-sm pb-1 border-b border-teal-200">
                      <div className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px] font-black">E</div>
                      <span>Panduan di Microsoft Edge (Bawaan Windows 10 &amp; 11)</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-md bg-teal-700 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                        <p className="text-slate-700">
                          Buka tautan aplikasi di <strong>Microsoft Edge</strong>.
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-md bg-teal-700 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                        <p className="text-slate-700">
                          Klik ikon monitor dengan simbol tambah (<strong>+</strong>) pada bilah alamat URL, ATAU klik menu titik tiga (<strong>...</strong>).
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-md bg-teal-700 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                        <p className="text-slate-700">
                          Pilih menu <strong>&ldquo;Aplikasi (Apps)&rdquo;</strong> &gt; klik <strong>&ldquo;Instal situs ini sebagai aplikasi&rdquo;</strong>.
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-md bg-teal-700 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">4</span>
                        <p className="text-slate-700">
                          Beri tanda centang pada <em>&ldquo;Sematkan ke taskbar&rdquo;</em> dan <em>&ldquo;Buat pintasan desktop&rdquo;</em> lalu klik <strong>Izinkan</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Box Panduan Kerja 100% Offline */}
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 text-xs text-emerald-950">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                    <WifiOff size={16} className="text-emerald-700" />
                    <span>Langkah Menggunakan Secara Penuh Tanpa Sinyal Internet (100% Offline):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-emerald-900 leading-relaxed pl-1">
                    <li>Nyalakan laptop guru di sekolah atau rumah. Sambungan WiFi/kuota dapat dimatikan sepenuhnya.</li>
                    <li>Klik ganda ikon pintasan <strong>&ldquo;Rapor SD Balil&rdquo;</strong> di Desktop Windows Anda.</li>
                    <li>Aplikasi akan langsung terbuka seketika tanpa browser, tanpa loading lambat, dan tanpa perlu sinyal internet.</li>
                    <li>Seluruh data siswa, nilai rapor, capaian TP, presensi, dan catatan wali kelas tersimpan otomatis di penyimpanan internal laptop.</li>
                    <li>Pencetakan rapor ke printer fisik atau simpan sebagai dokumen PDF tetap berjalan normal 100%.</li>
                  </ol>
                </div>
              </div>
            )
          },
          {
            title: '1.3 Cara Membagikan Aplikasi ke Rekan Guru & Memasang di Laptop Lain',
            content: (
              <div className="space-y-3 text-slate-700 leading-relaxed text-sm">
                <p>
                  Untuk membagikan aplikasi ke guru kelas atau operator di laptop lain:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs">
                  <li>
                    Klik tombol hijau <strong>BAGIKAN / PUBLIKASI</strong> di bilah atas aplikasi. Salin tautan resmi (URL) aplikasi.
                  </li>
                  <li>
                    Kirimkan tautan tersebut melalui WhatsApp, Telegram, email, atau salin lewat Flashdisk.
                  </li>
                  <li>
                    Di laptop rekan guru, buka tautan tersebut menggunakan Google Chrome atau Microsoft Edge sekali saja saat terkoneksi internet.
                  </li>
                  <li>
                    Klik tombol <strong>Instal di Laptop</strong> pada laptop tersebut. Selanjutnya, laptop rekan guru sudah bisa memakainya secara offline selamanya!
                  </li>
                </ul>
              </div>
            )
          }
        ]
      },
      {
        id: 'bab-2',
        number: 'BAB II',
        title: 'Identitas Satuan Pendidikan & Manajemen Data Pokok',
        subtitle: 'Pengaturan identitas sekolah, data guru, data siswa, rombel kelas, dan import file Excel.',
        targetRole: ['semua', 'operator', 'kepala_sekolah'],
        relatedMenuKey: 'identitas_sekolah',
        relatedMenuLabel: 'Buka Identitas Sekolah',
        subsections: [
          {
            title: '2.1 Mengisi Identitas Satuan Pendidikan',
            content: (
              <div className="space-y-3 text-slate-700 leading-relaxed text-sm">
                <p>
                  Menu <strong>Identitas Sekolah</strong> merupakan pondasi utama seluruh dokumen rapor. Data yang Anda masukkan di menu ini akan otomatis tercetak pada KOP rapor, halaman sampul, dan lembar pengesahan.
                </p>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-xl text-xs space-y-1 text-amber-900">
                  <span className="font-bold flex items-center gap-1.5"><AlertCircle size={14} /> Poin Penting Pengisian:</span>
                  <p>• <strong>Nama Pemerintah & Instansi:</strong> Isi sesuai SK Pemda, contoh: <em>PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG / DINAS PENDIDIKAN</em>.</p>
                  <p>• <strong>Nama Sekolah & NPSN:</strong> Contoh: <em>SD NEGERI BALIL</em> (NPSN: 60301140).</p>
                  <p>• <strong>Kepala Sekolah:</strong> Masukkan Nama Lengkap beserta Gelar dan NIP resmi untuk tanda tangan rapor.</p>
                  <p>• <strong>Titimangsa Rapor:</strong> Tempat penerbitan (misal: <em>Oksibil</em>) dan Tanggal Pembagian Rapor (misal: <em>20 Juni 2026</em>).</p>
                </div>
              </div>
            )
          },
          {
            title: '2.2 Manajemen Data Guru (Nama Dulu Baru NIP)',
            content: (
              <div className="space-y-3 text-slate-700 leading-relaxed text-sm">
                <p>
                  Pada menu <strong>DATA GURU</strong>, sistem menerapkan format baku yaitu <strong>Nama Lengkap & Gelar Pendidik terlebih dahulu, baru kemudian NIP</strong>:
                </p>
                <div className="bg-purple-50 border-l-4 border-purple-600 p-3 rounded-r-xl text-xs space-y-1 text-purple-950">
                  <p>• <strong>Nama Lengkap & Gelar Guru:</strong> Ditulis lengkap beserta gelar akademik/profesi (contoh: <em>Selpius Nabyal, S.Pd.Gr.</em>).</p>
                  <p>• <strong>NIP (Nomor Induk Pegawai):</strong> Ditulis di kolom kedua. Khusus bagi guru honorer atau kontrak daerah di pedalaman Papua, kolom NIP bersifat opsional (boleh diisi tanda hubung <em>&apos;-&apos;</em> atau dikosongkan).</p>
                  <p>• <strong>Tabel & Ekspor Excel:</strong> Pada tampilan tabel dan berkas unduhan spreadsheet, kolom Nama Lengkap Guru selalu berada di urutan awal sebelum NIP.</p>
                </div>
              </div>
            )
          },
          {
            title: '2.3 Manajemen Data Siswa & Import File Excel',
            content: (
              <div className="space-y-3 text-slate-700 leading-relaxed text-sm">
                <p>
                  Data siswa dapat diinput satu per satu atau diimpor sekaligus menggunakan tabel Microsoft Excel:
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs">
                  <li>Buka menu <strong>DATA SISWA</strong> pada bilah menu samping.</li>
                  <li>Pilih kelas sasaran (misal: Kelas IV).</li>
                  <li>Untuk mengimpor massal, klik tombol <strong>Template</strong> pada baris toolbar untuk melihat susunan kolom baku (NISN, Nama Siswa, NIS, Jenis Kelamin, Tempat Lahir, Tgl Lahir, Agama, Nama Ayah, Nama Ibu, Alamat).</li>
                  <li>Klik tombol <strong>Upload (Impor Excel)</strong> lalu pilih file .xlsx dari komputer Anda. Sistem akan memverifikasi dan memasukkan data secara otomatis.</li>
                </ol>
              </div>
            )
          },
          {
            title: '2.4 Pengelompokan Fase & Rombongan Belajar (SD, SMP, SMA, SMK)',
            content: (
              <div className="space-y-3 text-slate-700 leading-relaxed text-sm">
                <p className="text-xs">
                  Aplikasi telah mendukung penuh seluruh jenjang pendidikan Kurikulum Merdeka Kemendikbudristek:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="font-bold text-amber-800 block">FASE A (SD / MI)</span>
                    <p className="text-slate-600">Peserta didik jenjang <strong>Kelas I dan Kelas II</strong>.</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="font-bold text-amber-800 block">FASE B (SD / MI)</span>
                    <p className="text-slate-600">Peserta didik jenjang <strong>Kelas III dan Kelas IV</strong>.</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="font-bold text-amber-800 block">FASE C (SD / MI)</span>
                    <p className="text-slate-600">Peserta didik jenjang <strong>Kelas V dan Kelas VI</strong>.</p>
                  </div>
                  <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200">
                    <span className="font-bold text-blue-900 block">FASE D (SMP / MTs)</span>
                    <p className="text-blue-800">Peserta didik jenjang <strong>Kelas VII, VIII, dan IX</strong>.</p>
                  </div>
                  <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                    <span className="font-bold text-emerald-900 block">FASE E (SMA / SMK)</span>
                    <p className="text-emerald-800">Peserta didik jenjang <strong>Kelas X</strong> (Tingkat Awal Menengah).</p>
                  </div>
                  <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-200">
                    <span className="font-bold text-purple-900 block">FASE F (SMA / SMK)</span>
                    <p className="text-purple-800">Peserta didik <strong>Kelas XI, XII</strong> (SMA/SMK) & <strong>XIII</strong> (SMK 4 Tahun).</p>
                  </div>
                </div>
              </div>
            )
          }
        ]
      },
      {
        id: 'bab-3',
        number: 'BAB III',
        title: 'Mata Pelajaran & Penyusunan Tujuan Pembelajaran (TP)',
        subtitle: 'Standarisasi kurikulum, perumusan kode TP, dan keterkaitannya dengan deskripsi rapor.',
        targetRole: ['semua', 'guru_mapel', 'wali_kelas'],
        relatedMenuKey: 'tujuan_pembelajaran',
        relatedMenuLabel: 'Buka Tujuan Pembelajaran',
        subsections: [
          {
            title: '3.1 Struktur Mata Pelajaran Kurikulum Merdeka SD',
            content: (
              <div className="space-y-3 text-slate-700 leading-relaxed text-sm">
                <p>
                  Aplikasi telah memuat mata pelajaran standar Kurikulum Merdeka Sekolah Dasar:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded border">1. Pendidikan Agama & Budi Pekerti</div>
                  <div className="p-2 bg-slate-50 rounded border">2. Pendidikan Pancasila (PPKn)</div>
                  <div className="p-2 bg-slate-50 rounded border">3. Bahasa Indonesia</div>
                  <div className="p-2 bg-slate-50 rounded border">4. Matematika</div>
                  <div className="p-2 bg-slate-50 rounded border">5. IPAS (Ilmu Pengetahuan Alam & Sosial)</div>
                  <div className="p-2 bg-slate-50 rounded border">6. PJOK (Pendidikan Jasmani & Olahraga)</div>
                  <div className="p-2 bg-slate-50 rounded border">7. Seni Musik / Rupa / Tari / Teater</div>
                  <div className="p-2 bg-slate-50 rounded border">8. Bahasa Inggris / Muatan Lokal Daerah</div>
                </div>
              </div>
            )
          },
          {
            title: '3.2 Tombol & Tabel Masing-Masing TP Mata Pelajaran',
            content: (
              <div className="space-y-3 text-slate-700 leading-relaxed text-sm">
                <p>
                  Pada menu <strong>TUJUAN PEMBELAJARAN</strong>, aplikasi kini menyediakan <strong>tombol dan tabel tersendiri untuk setiap Mata Pelajaran</strong>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                    <span className="font-bold text-emerald-900 block">1. Tombol Masing-Masing Mapel</span>
                    <p className="text-emerald-800">
                      Tersedia tombol mandiri lengkap dengan kode singkatan (PAI, PPKN, BI, MTK, IPAS, PJOK, SENI, B.ING, MULOK) serta lencana jumlah TP yang sudah tercatat.
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                    <span className="font-bold text-blue-900 block">2. Dua Mode Tampilan Tabel</span>
                    <p className="text-blue-800">
                      <strong>Mode Tabel Terfokus:</strong> menampilkan tabel khusus untuk mapel yang diklik. <strong>Mode Semua Tabel:</strong> menyajikan semua tabel mapel sekaligus dalam satu halaman dengan bilah lompat cepat.
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-1 text-indigo-950 font-mono">
                  <p><strong>Contoh Format Kode & Rumusan TP:</strong></p>
                  <p>• <strong>TP001 (Bahasa Indonesia):</strong> Siswa mampu memahami pesan dan informasi penting dari teks narasi dan eksposisi.</p>
                  <p>• <strong>TP003 (Matematika):</strong> Siswa mampu membaca, menulis, dan membandingkan bilangan cacah sampai 10.000.</p>
                  <p>• <strong>TP005 (IPAS):</strong> Siswa mampu mengidentifikasi wujud zat, perubahan wujud, dan manfaatnya dalam kehidupan.</p>
                </div>
                <p className="text-xs text-slate-600">
                  <em>Catatan:</em> Tersedia tombol <strong>&ldquo;Muat Contoh TP Kurikulum Merdeka&rdquo;</strong> untuk mengisi otomatis rumusan standar untuk mata pelajaran yang masih kosong.
                </p>
              </div>
            )
          },
          {
            title: '3.3 Koneksi Otomatis Deskripsi TP ke Seluruh Lembar Rapor',
            content: (
              <div className="space-y-3 text-slate-700 leading-relaxed text-sm">
                <p>
                  Seluruh data deskripsi Tujuan Pembelajaran (TP) mata pelajaran terhubung secara langsung ke semua lembar rapor siswa:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <strong className="text-blue-900 block mb-1">Rapor Semester 1 & 2</strong>
                    <p className="text-blue-800">
                      Deskripsi Capaian Pembelajaran pada lembar Rapor Semester 1, Semester 2, dan Rapor Gabungan otomatis dirumuskan dari TP mata pelajaran terkait.
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <strong className="text-amber-900 block mb-1">Rapor PTS (Sisipan)</strong>
                    <p className="text-amber-800">
                      Kolom Catatan Kemajuan Belajar pada Rapor Tengah Semester otomatis mengambil rumusan TP capaian tertinggi siswa.
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <strong className="text-emerald-900 block mb-1">Pusat Cetak Rapor</strong>
                    <p className="text-emerald-800">
                      Saat mencetak individu maupun sekelas (batch), sistem menyinkronkan narasi capaian dari basis data TP aktif.
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-950">
                  <strong>Tombol Sinkronisasi Cepat (1 Klik):</strong> Anda dapat mengklik tombol <strong>&ldquo;⚡ Hubungkan ke Semua Rapor&rdquo;</strong> pada menu Tujuan Pembelajaran, Deskripsi Rapor, Input Nilai, atau Pusat Cetak Rapor untuk memperbarui seluruh narasi rapor siswa seketika.
                </div>
              </div>
            )
          }
        ]
      },
      {
        id: 'bab-4',
        number: 'BAB IV',
        title: 'Penilaian Akademik, Olah Nilai & Rapor Akhir Semester',
        subtitle: 'Penilaian formatif, sumatif lingkup materi, SAS, pembobotan, dan otomatisasi deskripsi rapor.',
        targetRole: ['semua', 'guru_mapel', 'wali_kelas'],
        relatedMenuKey: 'input_nilai',
        relatedMenuLabel: 'Buka Input Nilai Akademik',
        subsections: [
          {
            title: '4.1 Komponen Nilai dalam Kurikulum Merdeka',
            content: (
              <div className="space-y-3 text-slate-700 leading-relaxed text-sm">
                <p>
                  Pengolahan nilai akademik pada aplikasi ini menerapkan skema komprehensif:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <span className="font-bold text-blue-900 block mb-1">1. Nilai Formatif (Harian)</span>
                    <p className="text-blue-800">
                      Penilaian proses belajar (tugas, keaktifan, observasi performa per Tujuan Pembelajaran TP.1 s.d. TP.5).
                    </p>
                  </div>
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
                    <span className="font-bold text-teal-900 block mb-1">2. Sumatif Lingkup Materi (LM)</span>
                    <p className="text-teal-800">
                      Penilaian akhir suatu bab atau lingkup materi yang telah tuntas dipelajari (LM1, LM2, LM3).
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                    <span className="font-bold text-purple-900 block mb-1">3. Sumatif Akhir Semester (SAS / PTS)</span>
                    <p className="text-purple-800">
                      Penilaian komprehensif di tengah atau akhir semester yang menguji seluruh capaian semester berjalan.
                    </p>
                  </div>
                </div>
              </div>
            )
          },
          {
            title: '4.2 Rumus Perhitungan Nilai Akhir (NA) & Bobot',
            content: (
              <div className="space-y-2 text-slate-700 leading-relaxed text-sm">
                <p>
                  Sistem menghitung Nilai Akhir (NA) secara otomatis menggunakan proporsi bobot:
                </p>
                <div className="p-3 bg-slate-900 text-emerald-300 rounded-xl font-mono text-xs">
                  NA = ( (Rata-rata Nilai TP × Bobot Formatif) + (Rata-rata Nilai Sumatif × Bobot Sumatif) ) ÷ 100
                </div>
                <p className="text-xs text-slate-500">
                  Pengaturan persentase bobot (misal: 50% Formatif & 50% Sumatif, atau 40% Formatif & 60% Sumatif) dapat diatur secara fleksibel pada menu <strong>Pengaturan Sistem</strong>.
                </p>
              </div>
            )
          },
          {
            title: '4.3 Otomatisasi Deskripsi Capaian Kompetensi',
            content: (
              <div className="space-y-2 text-slate-700 leading-relaxed text-sm">
                <p>
                  Sistem menganalisis nilai per TP setiap siswa untuk melahirkan 2 bagian deskripsi naratif resmi:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>
                    <strong>Capaian Tertinggi:</strong> Menampilkan narasi penguasaan sangat baik terhadap TP yang bernilai tertinggi (contoh: <em>"Menunjukkan penguasaan sangat baik dalam memahami konsep pecahan senilai..."</em>).
                  </li>
                  <li>
                    <strong>Perlu Peningkatan / Bimbingan:</strong> Menampilkan narasi bimbingan khusus untuk TP yang masih berada di bawah Kriteria Ketercapaian Tujuan Pembelajaran (KKTP).
                  </li>
                </ul>
              </div>
            )
          }
        ]
      },
      {
        id: 'bab-5',
        number: 'BAB V',
        title: 'Penetapan Keputusan Kenaikan / Kelulusan Siswa',
        subtitle: 'Format resmi keputusan rapor, penempatan di bawah ketidakhadiran, dan penetapan massal.',
        targetRole: ['semua', 'wali_kelas', 'kepala_sekolah'],
        relatedMenuKey: 'rapor_akademik',
        relatedMenuLabel: 'Buka Rapor Gabungan Semester 1 & 2',
        subsections: [
          {
            title: '5.1 Format Baku & Penempatan di Lembar Rapor',
            content: (
              <div className="space-y-3 text-slate-700 leading-relaxed text-sm">
                <p>
                  Sesuai format resmi rapor Kurikulum Merdeka, kotak <strong>Keputusan</strong> diletakkan langsung di bawah tabel <strong>C. KETIDAKHADIRAN</strong> pada lembar Rapor Akhir Semester.
                </p>
                <div className="p-4 bg-slate-50 border-2 border-slate-300 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-slate-900 border-b pb-1">FORMAT REDAKSI BAKU LEMBAR RAPOR:</div>
                  <p className="font-semibold text-slate-800">Keputusan :</p>
                  <p className="text-slate-700 italic">
                    Berdasarkan Hasil pencapaian kompetensi pada semester ke 1 dan ke 2, peserta didik ditetapkan :
                  </p>
                  <div className="pl-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">Naik ke Kelas :</span>
                      <span className="font-mono text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">V (Lima)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">Tinggal di Kelas :</span>
                      <span className="font-mono text-slate-500">-</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          },
          {
            title: '5.2 Cara Mengisi Keputusan Siswa (Per Siswa & Penetapan Massal)',
            content: (
              <div className="space-y-2 text-slate-700 leading-relaxed text-sm">
                <p>
                  Anda memiliki dua cara mudah untuk menentukan keputusan siswa:
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <strong className="text-emerald-900 block mb-1">A. Penetapan Massal Cepat (Satu Klik untuk Semua Siswa):</strong>
                    <p className="text-emerald-800">
                      Pada lembar Rapor Akhir Semester, terdapat tombol <strong>"Tetapkan Semua Siswa Naik Kelas"</strong>. Klik tombol ini, dan sistem secara cerdas akan mengatur semua siswa di kelas aktif naik ke jenjang kelas berikutnya (misalnya: siswa Kelas IV otomatis naik ke Kelas V).
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <strong className="text-blue-900 block mb-1">B. Tombol Input Keputusan Khusus:</strong>
                    <p className="text-blue-800">
                      Klik tombol <strong>"Tombol Input Keputusan"</strong> di bagian bawah lembar rapor untuk membuka modal pengisian. Anda dapat memilih status (Naik Kelas, Tinggal di Kelas, Lulus, atau Belum Ditetapkan) serta menuliskan kelas tujuan secara spesifik.
                    </p>
                  </div>
                </div>
              </div>
            )
          }
        ]
      },
      {
        id: 'bab-6',
        number: 'BAB VI',
        title: 'Kokurikuler P5 (Projek Penguatan Profil Pelajar Pancasila)',
        subtitle: 'Perencanaan projek, penetapan dimensi, asesmen 4 skala capaian, dan cetak rapor P5.',
        targetRole: ['semua', 'wali_kelas', 'guru_mapel'],
        relatedMenuKey: 'p5_projek',
        relatedMenuLabel: 'Buka Projek P5',
        subsections: [
          {
            title: '6.1 Perencanaan Projek Kokurikuler P5',
            content: (
              <div className="space-y-3 text-slate-700 leading-relaxed text-sm">
                <p>
                  Pelaksanaan P5 di jenjang Sekolah Dasar diatur berdasarkan tema-tema pilihan Kemendikbudristek:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded border">1. Kearifan Lokal</div>
                  <div className="p-2 bg-slate-50 rounded border">2. Gaya Hidup Berkelanjutan</div>
                  <div className="p-2 bg-slate-50 rounded border">3. Bhinneka Tunggal Ika</div>
                  <div className="p-2 bg-slate-50 rounded border">4. Bangunlah Jiwa dan Raganya</div>
                  <div className="p-2 bg-slate-50 rounded border">5. Suara Demokrasi</div>
                  <div className="p-2 bg-slate-50 rounded border">6. Rekayasa & Teknologi</div>
                </div>
              </div>
            )
          },
          {
            title: '6.2 Empat Kriteria Capaian Penilaian P5',
            content: (
              <div className="space-y-2 text-slate-700 leading-relaxed text-sm">
                <p>
                  Asesmen P5 tidak menggunakan angka numerik (1-100), melainkan menggunakan rubrik kualitatif dengan 4 tingkatan capaian:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg">
                    <span className="font-bold text-rose-800">BB (Belum Berkembang):</span>
                    <p className="text-rose-700">Peserta didik masih memerlukan bimbingan intensif dalam menunjukkan perilaku yang diharapkan.</p>
                  </div>
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="font-bold text-amber-800">MB (Mulai Berkembang):</span>
                    <p className="text-amber-700">Peserta didik mulai menunjukkan perilaku namun belum konsisten secara mandiri.</p>
                  </div>
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="font-bold text-blue-800">BSH (Berkembang Sesuai Harapan):</span>
                    <p className="text-blue-700">Peserta didik telah konsisten menunjukkan perilaku sesuai target fase usianya.</p>
                  </div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="font-bold text-emerald-800">SB (Sangat Berkembang):</span>
                    <p className="text-emerald-700">Peserta didik melampaui target capaian dan mampu menjadi teladan bagi teman sekelasnya.</p>
                  </div>
                </div>
              </div>
            )
          }
        ]
      },
      {
        id: 'bab-7',
        number: 'BAB VII',
        title: 'Piagam Penghargaan & Prestasi Peserta Didik',
        subtitle: 'Penerbitan piagam peringkat kelas, tema bingkai hiasan, dan cetak resolusi tinggi.',
        targetRole: ['semua', 'wali_kelas', 'kepala_sekolah'],
        relatedMenuKey: 'piagam',
        relatedMenuLabel: 'Buka Piagam Penghargaan',
        subsections: [
          {
            title: '7.1 Ragam Kategori Piagam Penghargaan',
            content: (
              <div className="space-y-3 text-slate-700 leading-relaxed text-sm">
                <p>
                  Aplikasi menyediakan fitur pembuatan piagam penghargaan resmi untuk mengapresiasi kerja keras siswa:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                    <strong>Peringkat Akademik:</strong>
                    <p>Juara I, Juara II, Juara III berdasarkan nilai rata-rata akhir kelas.</p>
                  </div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                    <strong>Karakter & Profil Pancasila:</strong>
                    <p>Siswa Terdisiplin, Siswa Berakhlak Mulia, Teraktif dalam Projek P5.</p>
                  </div>
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
                    <strong>Bakat & Prestasi Khusus:</strong>
                    <p>Prestasi Olahraga, Seni Suara/Lukis, Hafalan/Keagamaan, dan Kehadiran 100%.</p>
                  </div>
                </div>
              </div>
            )
          },
          {
            title: '7.2 Pilihan Bingkai Desain & Cetak Siap Laminasi',
            content: (
              <div className="space-y-2 text-slate-700 leading-relaxed text-sm">
                <p>
                  Tersedia 3 pilihan ornamen bingkai resmi (Tema <em>Gold Klasik</em>, <em>Royal Navy</em>, dan <em>Emerald Madani</em>). Piagam diformat dalam orientasi Lanskap (Landscape) A4 dengan resolusi tinggi, dilengkapi stempel digital dan tanda tangan Kepala Sekolah serta Wali Kelas sehingga siap cetak dan laminasi.
                </p>
              </div>
            )
          }
        ]
      },
      {
        id: 'bab-8',
        number: 'BAB VIII',
        title: 'Panduan Cetak Dokumen Rapor, Leger & Format Kertas',
        subtitle: 'Pengaturan cetak browser, ukuran kertas F4/A4, skala, dan ekspor Microsoft Excel.',
        targetRole: ['semua', 'wali_kelas', 'operator'],
        relatedMenuKey: 'cetak_rapor',
        relatedMenuLabel: 'Buka Menu Cetak Rapor',
        subsections: [
          {
            title: '8.1 Jenis Dokumen yang Dapat Dicetak',
            content: (
              <div className="space-y-2 text-slate-700 leading-relaxed text-sm">
                <p>
                  Melalui menu <strong>CETAK RAPOR</strong> dan menu terkait, Anda dapat mencetak:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li><strong>Cover Rapor Depan:</strong> Lambang Garuda / Tut Wuri Handayani dengan nama sekolah dan peserta didik.</li>
                  <li><strong>Halaman Identitas Sekolah:</strong> Profil lengkap satuan pendidikan.</li>
                  <li><strong>Halaman Identitas Peserta Didik:</strong> Rincian biodata siswa, orang tua, dan alamat.</li>
                  <li><strong>Lembar Rapor PTS (Tengah Semester):</strong> Laporan perkembangan belajar berkala.</li>
                  <li><strong>Lembar Rapor Akhir Semester:</strong> Nilai capaian kompetensi, ekskul, presensi, catatan wali, dan keputusan kenaikan.</li>
                  <li><strong>Buku Leger Nilai Kelas:</strong> Tabel rangkuman seluruh nilai mata pelajaran dalam satu lembar rekapitulasi.</li>
                </ul>
              </div>
            )
          },
          {
            title: '8.2 Cara Pengaturan Printer Browser agar Rapi & Pas 1 Halaman',
            content: (
              <div className="space-y-2 text-slate-700 leading-relaxed text-sm">
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs text-amber-950">
                  <span className="font-bold block">PANDUAN SETTING CETAK BROWSER CHROME / EDGE:</span>
                  <p>1. <strong>Ukuran Kertas (Paper Size):</strong> Pilih <strong>F4 / Folio (8.5 × 13 inci)</strong> atau <strong>A4</strong>.</p>
                  <p>2. <strong>Tata Letak (Layout):</strong> Pilih <strong>Potret (Portrait)</strong> untuk lembar rapor, atau <strong>Lanskap (Landscape)</strong> untuk Buku Leger dan Piagam.</p>
                  <p>3. <strong>Margin:</strong> Pilih <strong>Default</strong> atau <strong>Minimum</strong>.</p>
                  <p>4. <strong>Skala (Scale):</strong> Pilih <strong>100%</strong> atau <strong>Sesuaikan dengan halaman (Fit to Page)</strong>.</p>
                  <p>5. <strong>Hilangkan Header/Footer Browser:</strong> Hilangkan centang pada opsi <em>"Header dan Footer"</em> agar tanggal cetak dan URL browser di tepi kertas tidak ikut tercetak!</p>
                </div>
              </div>
            )
          }
        ]
      },
      {
        id: 'bab-9',
        number: 'BAB IX',
        title: 'Baris Tombol Aksi Lengkap (Toolbar Standar)',
        subtitle: 'Fungsi seluruh tombol: Simpan, Edit, Perbarui, Upload, Bersihkan, Undo, Redo, Refres, dll.',
        targetRole: ['semua', 'guru_mapel', 'wali_kelas', 'operator'],
        subsections: [
          {
            title: '9.1 Daftar dan Fungsi 13 Tombol Aksi Standar',
            content: (
              <div className="space-y-2 text-slate-700 leading-relaxed text-sm">
                <p>
                  Setiap menu aplikasi dilengkapi baris tombol aksi terpadu dengan fungsi spesifik:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white border rounded-lg"><strong>1. Simpan (Save):</strong> Menyimpan perubahan aktif ke database lokal secara permanen.</div>
                  <div className="p-2 bg-white border rounded-lg"><strong>2. Edit:</strong> Mengaktifkan mode penyuntingan data pada baris/kolom formulir.</div>
                  <div className="p-2 bg-white border rounded-lg"><strong>3. Hapus:</strong> Menghapus baris data atau item terpilih dengan konfirmasi pengaman.</div>
                  <div className="p-2 bg-white border rounded-lg"><strong>4. Perbarui (Update):</strong> Memperbarui kalkulasi angka, capaian, dan deskripsi terbaru.</div>
                  <div className="p-2 bg-white border rounded-lg"><strong>5. Download:</strong> Mengunduh rekapan data aktif ke file spreadsheet Excel (.xlsx).</div>
                  <div className="p-2 bg-white border rounded-lg"><strong>6. Upload:</strong> Mengunggah berkas Excel untuk impor data secara instan.</div>
                  <div className="p-2 bg-white border rounded-lg"><strong>7. Bersihkan File (Reset):</strong> Membersihkan formulir input atau mereset pencarian.</div>
                  <div className="p-2 bg-white border rounded-lg"><strong>8. Undo:</strong> Membatalkan aksi perubahan terakhir.</div>
                  <div className="p-2 bg-white border rounded-lg"><strong>9. Redo:</strong> Mengulang kembali aksi perubahan yang dibatalkan.</div>
                  <div className="p-2 bg-white border rounded-lg"><strong>10. Refres:</strong> Memuat ulang tampilan data dan sinkronisasi layar.</div>
                  <div className="p-2 bg-white border rounded-lg"><strong>11. Template:</strong> Membuka format tabel baku contoh pengisian.</div>
                  <div className="p-2 bg-white border rounded-lg"><strong>12. Cetak:</strong> Membuka dialog cetak dokumen langsung ke printer atau PDF.</div>
                </div>
              </div>
            )
          }
        ]
      },
      {
        id: 'bab-10',
        number: 'BAB X',
        title: 'Keamanan Data, Cadangan (Backup) & Pemulihan (Restore)',
        subtitle: 'Prosedur penyimpanan otomatis, unduh cadangan .JSON, migrasi laptop, dan pemulihan data.',
        targetRole: ['semua', 'operator', 'kepala_sekolah'],
        relatedMenuKey: 'backup_restore',
        relatedMenuLabel: 'Buka Backup & Restore DB',
        subsections: [
          {
            title: '10.1 Mekanisme Penyimpanan Otomatis (Auto-Save)',
            content: (
              <div className="space-y-3 text-slate-700 leading-relaxed text-sm">
                <p>
                  Setiap kali Bapak/Ibu mengetik nilai atau melakukan perubahan, aplikasi secara otomatis menyimpannya ke dalam memori peramban/software laptop (<em>Indexed/LocalStorage Engine</em>). Setiap perubahan sukses akan ditandai dengan notifikasi toast berwarna hijau di sudut kanan bawah.
                </p>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                  <strong>Penting:</strong> Data Anda tetap tersimpan utuh meskipun laptop dimatikan, kehabisan baterai, atau browser ditutup.
                </div>
              </div>
            )
          },
          {
            title: '10.2 Cara Cadangkan (Backup) Data secara Berkala',
            content: (
              <div className="space-y-2 text-slate-700 leading-relaxed text-sm">
                <p>
                  Untuk mengantisipasi laptop rusak, hilang, atau terkena virus, biasakan mengunduh cadangan data:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-xs">
                  <li>Buka menu <strong>BACKUP & RESTORE DB</strong> di bilah menu paling bawah.</li>
                  <li>Klik tombol <strong>"Unduh Cadangan Database (.JSON)"</strong>.</li>
                  <li>File berekstensi <code>.json</code> yang memuat seluruh nilai, data siswa, dan sekolah akan tersimpan di folder <em>Downloads</em> laptop Anda.</li>
                  <li>Simpan file cadangan tersebut ke <strong>Flashdisk (USB)</strong> atau kirim ke WhatsApp / Google Drive sebagai arsip cadangan mingguan sekolah.</li>
                </ol>
              </div>
            )
          },
          {
            title: '10.3 Cara Memulihkan (Restore) Data saat Berganti Laptop',
            content: (
              <div className="space-y-2 text-slate-700 leading-relaxed text-sm">
                <p>
                  Jika Anda ingin memindahkan seluruh data nilai ke laptop baru rekan guru atau laptop kepala sekolah:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-xs">
                  <li>Di laptop baru, pasang dan buka aplikasi ini.</li>
                  <li>Buka menu <strong>BACKUP & RESTORE DB</strong>.</li>
                  <li>Pilih file cadangan <code>.json</code> yang sebelumnya telah Anda simpan di Flashdisk.</li>
                  <li>Klik <strong>"Pulihkan Database Sekarang"</strong>. Dalam hitungan 1 detik, seluruh data guru, siswa, dan ribuan nilai akan langsung muncul sempurna di laptop baru!</li>
                </ol>
              </div>
            )
          }
        ]
      },
      {
        id: 'bab-11',
        number: 'BAB XI',
        title: 'Tanya Jawab Umum (FAQ) & Solusi Kendala Praktis',
        subtitle: 'Kumpulan solusi cepat atas berbagai pertanyaan yang sering dihadapi guru di lapangan.',
        targetRole: ['semua', 'guru_mapel', 'wali_kelas', 'operator', 'kepala_sekolah'],
        subsections: [
          {
            title: 'Tanya 1: Apakah aplikasi ini butuh kuota internet saat mengisi nilai?',
            content: (
              <p className="text-xs text-slate-700 leading-relaxed">
                <strong>Jawab: TIDAK SAMA SEKALI.</strong> Aplikasi ini dirancang 100% offline. Setelah Anda memasangnya lewat tombol <em>Instal di Laptop</em>, Anda dapat membawa laptop ke ruang kelas atau ke rumah tanpa perlu menyalakan kuota data maupun WiFi.
              </p>
            )
          },
          {
            title: 'Tanya 2: Bagaimana cara menambah mata pelajaran Muatan Lokal (Bahasa Daerah / Bahasa Inggris)?',
            content: (
              <p className="text-xs text-slate-700 leading-relaxed">
                <strong>Jawab:</strong> Masuk ke menu <strong>DATA MATA PELAJARAN</strong>, lalu klik <strong>Tambah Mata Pelajaran</strong>. Tuliskan nama mapel (misal: <em>Bahasa Daerah Oksibil</em> atau <em>Bahasa Inggris</em>), tentukan kelompok (Wajib / Muatan Lokal), lalu klik Simpan. Mapel baru akan otomatis tersedia di menu input nilai dan lembar rapor.
              </p>
            )
          },
          {
            title: 'Tanya 3: Bagaimana jika lembar cetak rapor terpotong atau menjadi 2 halaman?',
            content: (
              <p className="text-xs text-slate-700 leading-relaxed">
                <strong>Jawab:</strong> Saat jendela print browser terbuka, klik menu <em>Setelan Lainnya (More Settings)</em> &gt; ubah pilihan <strong>Skala (Scale)</strong> menjadi <em>Sesuaikan dengan halaman</em> atau atur manual ke angka <strong>90% - 95%</strong>. Pastikan juga ukuran kertas disesuaikan ke <strong>F4 (Folio)</strong> atau <strong>A4</strong>.
              </p>
            )
          },
          {
            title: 'Tanya 4: Apakah aplikasi ini bisa dipakai untuk semester dan tahun pelajaran berikutnya?',
            content: (
              <p className="text-xs text-slate-700 leading-relaxed">
                <strong>Jawab: BISA SELAMANYA.</strong> Aplikasi tidak memiliki masa kadaluwarsa. Untuk berpindah ke Semester 2 (Genap) atau Tahun Pelajaran baru (misal: 2026/2027 ke 2027/2028), Anda cukup mengubah pilihan semester atau tahun pelajaran di bagian atas layar atau di menu <em>Identitas Sekolah</em>.
              </p>
            )
          },
          {
            title: 'Tanya 5: Siapa pengembang aplikasi ini jika sekolah kami butuh konsultasi teknis?',
            content: (
              <p className="text-xs text-slate-700 leading-relaxed">
                <strong>Jawab:</strong> Aplikasi Rapor Kurikulum Merdeka ini dikembangkan dengan dedikasi tinggi oleh <strong>Selpius Nabyal, S.Pd.Gr.</strong> untuk mendukung kemajuan pendidikan di SD Negeri Balil dan sekolah-sekolah di Tanah Papua serta Indonesia. Profil pengembang dapat dilihat dengan mengeklik lencana nama pengembang di bilah atas aplikasi.
              </p>
            )
          }
        ]
      }
    ],
    [db.sekolah.tahunPelajaran]
  );

  // Filter chapters based on search query and role filter
  const filteredChapters = useMemo(() => {
    return chapters.filter((chapter) => {
      // Role match
      const roleMatch = selectedRole === 'semua' || chapter.targetRole.includes(selectedRole) || chapter.targetRole.includes('semua');
      if (!roleMatch) return false;

      // Query match
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inTitle = chapter.title.toLowerCase().includes(q) || chapter.number.toLowerCase().includes(q);
      const inSubtitle = chapter.subtitle.toLowerCase().includes(q);
      const inSubs = chapter.subsections.some((sub) => sub.title.toLowerCase().includes(q));

      return inTitle || inSubtitle || inSubs;
    });
  }, [chapters, selectedRole, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 pointer-events-none">
          <BookOpen size={280} />
        </div>

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30">
              <BookOpen size={14} /> DOKUMEN RESMI PANDUAN PENGGUNA
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30">
              Kurikulum Merdeka SD v2.6
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-400/30">
              100% Siap Offline
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-2">
              Buku Panduan Lengkap Aplikasi Rapor
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-3xl">
              Buku petunjuk pengoperasian terpadu untuk Kepala Sekolah, Guru Kelas / Wali Kelas, Guru Mata Pelajaran, dan Tenaga Administrasi SD Negeri Balil. Meliputi manajemen data pokok, penilaian harian & sumatif, otomatisasi deskripsi rapor, keputusan kenaikan kelas, kokurikuler P5, piagam penghargaan, pencetakan dokumen, dan pencadangan database.
            </p>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer hover:scale-105"
            >
              <Printer size={16} />
              <span>Cetak Buku Panduan (A4 / PDF)</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              <span>{copied ? 'Ringkasan Disalin!' : 'Salin Ringkasan Panduan'}</span>
            </button>

            <div className="flex items-center gap-1.5 ml-auto text-xs text-slate-400">
              <span>Pengembang:</span>
              <strong className="text-slate-200">Selpius Nabyal, S.Pd.Gr.</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel: Search & Filter Per Peran */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari topik panduan (misal: 'instal', 'kenaikan kelas', 'P5', 'cetak', 'bobot', 'backup')..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-all outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Expand & Collapse All Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={expandAll}
              className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
            >
              Buka Semua Bab
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
            >
              Tutup Semua Bab
            </button>
          </div>
        </div>

        {/* Filter Peran Pengguna */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mr-1">
            <SlidersHorizontal size={14} /> Panduan Khusus Peran:
          </span>
          {[
            { id: 'semua', label: 'Semua Peran' },
            { id: 'wali_kelas', label: 'Wali Kelas / Guru Kelas' },
            { id: 'guru_mapel', label: 'Guru Mata Pelajaran' },
            { id: 'kepala_sekolah', label: 'Kepala Sekolah' },
            { id: 'operator', label: 'Operator / Tenaga Administrasi' }
          ].map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedRole === role.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      {/* BANNER PANDUAN SINGKAT: INSTALASI LAPTOP MANDIRI (PWA OFFLINE) */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-indigo-800/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md shrink-0">
              <Laptop size={24} className="text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-1">
                <WifiOff size={12} /> Panduan Singkat • PWA Offline Mandiri
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Cara Menginstal Aplikasi ke Laptop via Chrome atau Edge
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowInstallModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer hover:scale-102"
            >
              <Download size={14} />
              <span>Buka Menu Instalasi</span>
            </button>
            <button
              onClick={() => {
                const url = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-rphddbilzfcltdpdl7hjhx-976655500677.asia-southeast1.run.app';
                navigator.clipboard?.writeText(url);
                setCopiedAppUrl(true);
                setTimeout(() => setCopiedAppUrl(false), 2500);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 text-white font-bold text-xs border border-indigo-700/80 transition-all cursor-pointer"
            >
              {copiedAppUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedAppUrl ? 'Link Tersalin!' : 'Salin Link'}</span>
            </button>
          </div>
        </div>

        {/* 2 Kolom Langkah Praktis: Chrome vs Edge */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Kolom Chrome */}
          <div className="bg-slate-900/80 border border-blue-500/30 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 text-blue-300 font-extrabold text-xs">
              <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-black inline-flex items-center justify-center text-[10px]">C</span>
              <span>1. Cara di Google Chrome (Laptop Windows / Mac)</span>
            </div>
            <ol className="space-y-1.5 text-slate-300 pl-1">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-400 shrink-0">1.</span>
                <span>Buka link aplikasi ini di peramban <strong>Google Chrome</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-400 shrink-0">2.</span>
                <span>Klik tombol <strong>&ldquo;INSTAL PC&rdquo;</strong> di bilah atas aplikasi, ATAU klik menu titik tiga (<strong>⋮</strong>) di sudut kanan atas Chrome.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-400 shrink-0">3.</span>
                <span>Pilih menu <strong>&ldquo;Simpan dan bagikan&rdquo;</strong> lalu klik <strong>&ldquo;Instal Halaman Ini sebagai Aplikasi&rdquo;</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-400 shrink-0">4.</span>
                <span>Klik tombol <strong>&ldquo;Instal&rdquo;</strong>. Ikon langsung muncul di Desktop &amp; Menu Start laptop Anda.</span>
              </li>
            </ol>
          </div>

          {/* Kolom Microsoft Edge */}
          <div className="bg-slate-900/80 border border-teal-500/30 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 text-teal-300 font-extrabold text-xs">
              <span className="w-5 h-5 rounded-md bg-teal-600 text-white font-black inline-flex items-center justify-center text-[10px]">E</span>
              <span>2. Cara di Microsoft Edge (Bawaan Windows 10 &amp; 11)</span>
            </div>
            <ol className="space-y-1.5 text-slate-300 pl-1">
              <li className="flex items-start gap-2">
                <span className="font-bold text-teal-400 shrink-0">1.</span>
                <span>Buka link aplikasi ini di peramban <strong>Microsoft Edge</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-teal-400 shrink-0">2.</span>
                <span>Di bilah alamat (URL), klik ikon monitor bertanda tambah (<strong>+</strong>) ATAU klik menu titik tiga (<strong>...</strong>).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-teal-400 shrink-0">3.</span>
                <span>Pilih menu <strong>&ldquo;Aplikasi (Apps)&rdquo;</strong> &gt; klik <strong>&ldquo;Instal situs ini sebagai aplikasi&rdquo;</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-teal-400 shrink-0">4.</span>
                <span>Centang <em>&ldquo;Sematkan ke taskbar&rdquo;</em> dan <em>&ldquo;Buat pintasan desktop&rdquo;</em>, lalu klik <strong>Izinkan</strong>.</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Highlight Menjalankan Offline */}
        <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <WifiOff size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-100">
                Cara Buka Tanpa Internet (100% OFFLINE) di Ruang Kelas:
              </p>
              <p className="text-[11px] text-emerald-300 mt-0.5">
                Nyalakan laptop &gt; Matikan WiFi/kuota &gt; Klik ganda shortcut <strong>Rapor SD Balil</strong> di Desktop laptop. Aplikasi langsung terbuka mandiri dan semua pengisian nilai serta cetak rapor bekerja normal tanpa gangguan!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setExpandedChapters((prev) => ({ ...prev, 'bab-1': true }));
              const el = document.getElementById('bab-1');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors cursor-pointer"
          >
            Baca Rincian di BAB I →
          </button>
        </div>
      </div>

      {/* Chapters Accordion List */}
      <div className="space-y-4">
        {filteredChapters.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-3">
            <HelpCircle size={44} className="mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-700">Topik Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tidak ada bab atau petunjuk yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo;. Silakan gunakan kata kunci lain atau pilih filter Semua Peran.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRole('semua');
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs cursor-pointer"
            >
              Reset Pencarian
            </button>
          </div>
        ) : (
          filteredChapters.map((chapter) => {
            const isExpanded = !!expandedChapters[chapter.id];

            return (
              <div
                key={chapter.id}
                id={chapter.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all hover:border-indigo-300"
              >
                {/* Chapter Card Header */}
                <div
                  onClick={() => toggleChapter(chapter.id)}
                  className={`p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer select-none transition-colors ${
                    isExpanded ? 'bg-slate-50/80 border-b border-slate-200' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                      {chapter.number.replace('BAB ', '')}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">
                          {chapter.number}
                        </span>
                        {chapter.targetRole.map((role) => (
                          <span
                            key={role}
                            className="px-2 py-0.2 rounded-md bg-slate-200/80 text-[10px] font-semibold text-slate-700"
                          >
                            {role === 'semua'
                              ? 'Semua Guru'
                              : role === 'wali_kelas'
                              ? 'Wali Kelas'
                              : role === 'guru_mapel'
                              ? 'Guru Mapel'
                              : role === 'kepala_sekolah'
                              ? 'Kepala Sekolah'
                              : 'Operator'}
                          </span>
                        ))}
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                        {chapter.title}
                      </h2>
                      <p className="text-xs text-slate-500 line-clamp-1 sm:line-clamp-none mt-0.5">
                        {chapter.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {chapter.relatedMenuKey && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (chapter.relatedMenuKey) {
                            setActiveMenu(chapter.relatedMenuKey);
                          }
                        }}
                        title={`Buka menu ${chapter.relatedMenuLabel}`}
                        className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-all cursor-pointer"
                      >
                        <span>{chapter.relatedMenuLabel}</span>
                        <ArrowRight size={13} />
                      </button>
                    )}

                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>
                  </div>
                </div>

                {/* Chapter Content Subsections */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 space-y-6 bg-white divide-y divide-slate-100">
                    {chapter.subsections.map((sub, idx) => (
                      <div key={idx} className={`${idx > 0 ? 'pt-6' : ''} space-y-2.5`}>
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                          <span>{sub.title}</span>
                        </h3>
                        <div className="pl-4 border-l-2 border-indigo-100">
                          {sub.content}
                        </div>
                      </div>
                    ))}

                    {/* Footer link to direct menu */}
                    {chapter.relatedMenuKey && (
                      <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                        <span className="text-xs text-slate-500">
                          Ingin langsung mempraktikkan langkah di bab ini?
                        </span>
                        <button
                          onClick={() => {
                            if (chapter.relatedMenuKey) {
                              setActiveMenu(chapter.relatedMenuKey);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                        >
                          <span>{chapter.relatedMenuLabel || 'Buka Menu Terkait'}</span>
                          <ExternalLink size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Printable Book Layout (Only visible in Print Window) */}
      <div className="hidden print:block text-black bg-white p-8 space-y-8 font-serif">
        <div className="text-center border-b-2 border-black pb-4 space-y-1">
          <h2 className="text-xl font-bold tracking-wider">{db.sekolah.namaPemerintah.toUpperCase()}</h2>
          <h3 className="text-lg font-bold">{db.sekolah.namaInstansi.toUpperCase()}</h3>
          <h1 className="text-2xl font-black">{db.sekolah.namaSekolah.toUpperCase()}</h1>
          <p className="text-xs italic">{db.sekolah.alamat}, Distrik {db.sekolah.distrikKecamatan}, Kab. {db.sekolah.kabupaten}</p>
        </div>

        <div className="text-center py-6 space-y-2">
          <h2 className="text-2xl font-extrabold underline tracking-wide">BUKU PANDUAN LENGKAP APLIKASI RAPOR KURIKULUM MERDEKA</h2>
          <p className="text-sm">Pedoman Operasional Penilaian & Pengolahan Rapor SD Negeri Balil</p>
          <p className="text-xs font-mono">Tahun Pelajaran {db.sekolah.tahunPelajaran} • Kurikulum Merdeka Versi 2.6</p>
        </div>

        <div className="space-y-6 text-sm">
          {chapters.map((ch) => (
            <div key={ch.id} className="space-y-2 break-inside-avoid">
              <h3 className="text-base font-bold uppercase border-b border-gray-400 pb-1">
                {ch.number} : {ch.title}
              </h3>
              <p className="text-xs italic text-gray-700">{ch.subtitle}</p>
              {ch.subsections.map((sub, sIdx) => (
                <div key={sIdx} className="space-y-1 pl-2">
                  <h4 className="font-bold text-xs">{sub.title}</h4>
                  <div className="text-xs leading-relaxed">{sub.content}</div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-black flex justify-between text-xs">
          <div>
            <p>Mengetahui,</p>
            <p>Kepala Sekolah</p>
            <div className="h-14"></div>
            <p className="font-bold underline">{db.sekolah.namaKepalaSekolah}</p>
            <p>NIP. {db.sekolah.nipKepalaSekolah}</p>
          </div>
          <div>
            <p>{db.sekolah.tempatRapor}, {db.sekolah.tanggalRapor}</p>
            <p>Pengembang Sistem</p>
            <div className="h-14"></div>
            <p className="font-bold underline">Selpius Nabyal, S.Pd.Gr.</p>
            <p>NIP. -</p>
          </div>
        </div>
      </div>

      {/* Modal Instalasi Laptop */}
      <InstallPcModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
    </div>
  );
};
