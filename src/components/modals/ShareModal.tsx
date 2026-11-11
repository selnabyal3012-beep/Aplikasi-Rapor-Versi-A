import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Globe,
  Laptop,
  HardDrive,
  Send,
  X,
  FileSpreadsheet,
  FileText,
  Users,
  ShieldCheck,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'laptop_lain' | 'publikasi_hasil'>('link');

  if (!isOpen) return null;

  // URL publikasi yang bisa dibuka oleh siapa saja
  const sharedUrl =
    typeof window !== 'undefined' && window.location.href.includes('http')
      ? window.location.origin
      : 'https://ais-pre-rphddbilzfcltdpdl7hjhx-976655500677.asia-southeast1.run.app';

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(sharedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const shareText = encodeURIComponent(
    `Halo Rekan Guru, ini tautan Aplikasi Rapor Kurikulum Merdeka SD Negeri Balil:\n${sharedUrl}\n\nSilakan buka di Google Chrome / Microsoft Edge di laptop Anda, lalu klik tombol "INSTAL DI LAPTOP (OFFLINE)" agar bisa digunakan tanpa internet.`
  );

  const whatsappUrl = `https://wa.me/?text=${shareText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-emerald-800 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            aria-label="Tutup jendela"
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-2xl shadow-lg border border-white/20 shrink-0">
              <Share2 size={32} className="text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-teal-100 border border-white/20 mb-1.5">
                <Globe size={13} /> Publikasi & Berbagi Aplikasi
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Bagikan & Publikasikan Aplikasi
              </h2>
              <p className="text-xs sm:text-sm text-teal-100 mt-1">
                Pasang di laptop guru lain atau bagikan agar rapor dapat dilihat oleh Kepala Sekolah, Pengawas, dan Rekan Kerja.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigasi */}
        <div className="flex border-b border-slate-200 text-xs font-semibold bg-slate-50">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-3 px-4 border-b-2 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'link'
                ? 'border-emerald-600 text-emerald-800 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe size={15} />
            <span>1. Tautan Publikasi (Link Web)</span>
          </button>
          <button
            onClick={() => setActiveTab('laptop_lain')}
            className={`flex-1 py-3 px-4 border-b-2 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'laptop_lain'
                ? 'border-emerald-600 text-emerald-800 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Laptop size={15} />
            <span>2. Pasang di Laptop Lain</span>
          </button>
          <button
            onClick={() => setActiveTab('publikasi_hasil')}
            className={`flex-1 py-3 px-4 border-b-2 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'publikasi_hasil'
                ? 'border-emerald-600 text-emerald-800 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText size={15} />
            <span>3. Publikasikan Hasil Rapor</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 text-sm text-slate-700">
          {/* TAB 1: LINK PUBLIK */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                  <Sparkles size={16} className="text-emerald-700" />
                  <span>Tautan Publik Aplikasi Bisa Dibuka Siapa Saja:</span>
                </div>
                <p className="leading-relaxed">
                  Tautan di bawah ini adalah alamat resmi aplikasi Anda di internet. Siapa saja yang memiliki tautan ini (rekan guru, kepala sekolah, dinas) dapat membuka aplikasi ini melalui browser HP atau laptop mereka tanpa memerlukan password akun pembuat.
                </p>
              </div>

              {/* URL Box with Copy Button */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Salin Tautan Publikasi Aplikasi:
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-800 select-all overflow-x-auto">
                    {sharedUrl}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white hover:scale-102'
                    }`}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copied ? 'Tersalin!' : 'Salin Link'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all text-center"
                >
                  <Send size={15} />
                  <span>Kirim ke WhatsApp Rekan Guru</span>
                </a>

                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all text-center cursor-pointer"
                >
                  <Copy size={15} />
                  <span>Salin Pesan & Link Lengkap</span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Catatan Privasi:</strong> Setiap perangkat laptop yang membuka tautan ini menyimpan datanya sendiri secara lokal, sehingga data sekolah Anda tetap aman dan tidak akan tertimpa oleh orang lain secara otomatis kecuali Anda membagikan file backup.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: PASANG DI LAPTOP LAIN */}
          {activeTab === 'laptop_lain' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-950 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
                  <Laptop size={17} className="text-blue-700" />
                  <span>Bisa Dipasang di Berapa Banyak Laptop?</span>
                </div>
                <p className="leading-relaxed">
                  <strong>BISA DI SEMUA LAPTOP</strong> (tidak ada batasan jumlah laptop). Anda bisa memasang software ini di 1, 5, 10, atau seluruh laptop guru kelas dan ruang guru SD Negeri Balil.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Cara Memasang di Laptop Guru Lain (Langkah Demi Langkah):
                </h4>

                <div className="grid grid-cols-1 gap-2.5 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black inline-flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                    <div>
                      <p className="font-bold text-slate-800">Kirimkan Tautan Web ke Laptop Rekan</p>
                      <p className="text-slate-600 mt-0.5">
                        Kirimkan link aplikasi lewat WhatsApp Web atau ketik alamat link di browser laptop rekan guru (Google Chrome atau Microsoft Edge).
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black inline-flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                    <div>
                      <p className="font-bold text-slate-800">Buka Link dan Klik &quot;INSTAL DI LAPTOP (OFFLINE)&quot;</p>
                      <p className="text-slate-600 mt-0.5">
                        Di sudut kanan atas layar laptop rekan guru, klik tombol <strong>INSTAL DI LAPTOP (OFFLINE)</strong> lalu klik <strong>PASANG SEKARANG</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black inline-flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                    <div>
                      <p className="font-bold text-slate-800">Selesai! Aplikasi Siap Digunakan Tanpa Internet</p>
                      <p className="text-slate-600 mt-0.5">
                        Ikon aplikasi akan tampil di Desktop laptop rekan guru. Mulai saat itu, rekan guru bisa mematikan koneksi internet dan tetap dapat mengisi nilai serta mencetak rapor kapan saja.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sinkronisasi Data dengan Flashdisk */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <HardDrive size={16} />
                  <span>Cara Memindahkan Nilai / Data Siswa Antar Laptop (Via Flashdisk):</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Jika guru kelas A mengisi nilai di laptopnya dan ingin memindahkannya ke laptop Kepala Sekolah:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-200 font-medium pl-1">
                  <li>Di laptop guru: Buka menu <strong>Backup & Restore DB</strong> ➔ klik <strong>Simpan Cadangan (.json)</strong> ke flashdisk.</li>
                  <li>Colok flashdisk ke laptop kedua / kepala sekolah.</li>
                  <li>Di laptop kedua: Buka menu <strong>Backup & Restore DB</strong> ➔ klik <strong>Pulihkan dari File (.json)</strong>.</li>
                  <li>Semua nilai dan rapor langsung pindah lengkap tanpa perlu internet!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: PUBLIKASIKAN HASIL RAPOR */}
          {activeTab === 'publikasi_hasil' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                  <Users size={17} className="text-amber-700" />
                  <span>Bagaimana Cara Mempublikasikan agar Dilihat Orang Lain?</span>
                </div>
                <p className="leading-relaxed">
                  Agar hasil capaian belajar, nilai rapor, dan piagam dapat dilihat dan diperiksa oleh orang tua siswa, Kepala Sekolah, atau Pengawas Dinas, Anda memiliki 3 pilihan cara:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Opsi 1 */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">Opsi 1</span>
                    <h4 className="font-bold text-slate-800 mt-1">Kirim File PDF</h4>
                    <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                      Buka menu <strong>Cetak Rapor</strong> ➔ pilih siswa ➔ klik <strong>Cetak Lembar Ini</strong> ➔ pada tujuan printer pilih <strong>&quot;Simpan sebagai PDF&quot;</strong>. Kirimkan file PDF ke WhatsApp orang tua siswa.
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] text-emerald-700 font-bold">✓ Paling Praktis untuk Orang Tua</span>
                  </div>
                </div>

                {/* Opsi 2 */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">Opsi 2</span>
                    <h4 className="font-bold text-slate-800 mt-1">Cetak Lembar Fisik</h4>
                    <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                      Sambungkan laptop ke printer kabel/WiFi ➔ klik <strong>Cetak Rapor</strong> pada kertas A4 standar Kurikulum Merdeka untuk pembagian rapor resmi kenaikan kelas di sekolah.
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] text-emerald-700 font-bold">✓ Wajib untuk Arsip Sekolah</span>
                  </div>
                </div>

                {/* Opsi 3 */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">Opsi 3</span>
                    <h4 className="font-bold text-slate-800 mt-1">Expor Spreadsheet Excel</h4>
                    <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                      Klik tombol <strong>Expor (.xlsx)</strong> pada menu Rekap Nilai atau Data Siswa untuk menyerahkan laporan hasil belajar ke Dinas Pendidikan atau Pengawas Sekolah.
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] text-purple-700 font-bold">✓ Standar Laporan Dinas</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            Aplikasi Rapor SD Negeri Balil • Bebas Dibagikan ke Seluruh Rekan Guru
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
