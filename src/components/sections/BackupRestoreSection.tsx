import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  FileSpreadsheet,
  HardDrive,
  ShieldCheck,
  Check,
  Cloud,
  CloudUpload,
  CloudDownload
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StandardActionToolbar } from '../common/StandardActionToolbar';

export const BackupRestoreSection: React.FC = () => {
  const {
    db,
    exportDatabaseJson,
    importDatabaseJson,
    resetDatabase,
    cloudSyncStatus,
    lastCloudSyncTime,
    syncToCloudFirestore,
    loadFromCloudFirestore,
    firebaseUser,
    loginWithGoogle
  } = useApp();
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDatabaseJson(content);
      if (res.success) {
        setStatusMessage({ text: res.message, type: 'success' });
      } else {
        setStatusMessage({ text: res.message, type: 'error' });
      }
      setTimeout(() => setStatusMessage(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportCsvPack = () => {
    // Generate a comprehensive CSV export containing student list and grades
    let csv = 'DATA NILAI & RAPOR SD NEGERI BALIL 2026/2027\n\n';
    csv += 'NISN,Nama Siswa,Kelas,Mata Pelajaran,Formatif,Sumatif,Nilai Akhir,Predikat,Deskripsi\n';
    db.nilaiAkademik.forEach((n) => {
      csv += `"${n.nisn}","${n.namaSiswa}","${n.kelas}","${n.mataPelajaran}","${n.formatif}","${n.sumatif}","${n.nilaiAkhir}","${n.predikat}","${n.deskripsiRapor}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-lengkap-sdn-balil-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleResetConfirm = () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh database kembali ke data bawaan awal SD Negeri Balil? Seluruh perubahan baru akan diganti.')) {
      resetDatabase();
      setStatusMessage({ text: 'Database berhasil dikembalikan ke data awal bawaan!', type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const backupItemList = [
    { label: 'Data Sekolah (Identitas & KOP)', count: '1 Lembaga' },
    { label: 'Data Guru & Tenaga Kependidikan', count: `${db.guru.length} Guru` },
    { label: 'Data Siswa (Peserta Didik)', count: `${db.siswa.length} Siswa` },
    { label: 'Data Kelas & Rombel', count: `${db.kelas.length} Kelas` },
    { label: 'Data Mata Pelajaran', count: `${db.mataPelajaran.length} Mapel` },
    { label: 'Tujuan Pembelajaran (TP)', count: `${db.tujuanPembelajaran.length} TP` },
    { label: 'Data Nilai Akademik Siswa', count: `${db.nilaiAkademik.length} Rekord Nilai` },
    { label: 'Data Kehadiran & Presensi', count: `${db.kehadiran.length} Siswa` },
    { label: 'Data Ekstrakurikuler', count: `${db.ekstrakurikuler.length} Kegiatan` },
    { label: 'Data P5 (Projek, Tahapan & Dimensi)', count: `${db.p5Projek.length} Projek` },
    { label: 'Nilai & Catatan Capaian P5', count: `${db.p5Nilai.length} Capaian P5` },
    { label: 'Catatan Wali Kelas', count: `${db.catatanWali.length} Catatan` }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <Database size={28} />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-700">
              Keamanan & Manajemen Data
            </span>
            <h2 className="text-xl font-bold text-slate-800">Cadangan & Pemulihan (Backup & Restore)</h2>
            <p className="text-xs text-slate-500">
              Amankan seluruh database sekolah ke komputer/flashdisk offline atau pulihkan kembali saat ganti laptop.
            </p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* BARIS TOMBOL AKSI LENGKAP CADANGAN & PEMULIHAN */}
      <StandardActionToolbar
        title="Aksi Cadangan & Pemulihan"
        badge="Database Sekolah"
        onSave={exportDatabaseJson}
        saveLabel="Simpan Cadangan (.json)"
        onUpdate={exportDatabaseJson}
        updateLabel="Perbarui Cadangan"
        onEdit={() => {}}
        editLabel="Edit Konfigurasi"
        onCancel={() => {}}
        cancelLabel="Batal"
        onDelete={handleResetConfirm}
        deleteLabel="Reset Database Awal"
        onImport={(file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            importDatabaseJson(content);
          };
          reader.readAsText(file);
        }}
        importAccept=".json"
        importLabel="Impor Cadangan (.json)"
        onExport={exportDatabaseJson}
        exportLabel="Expor Database (.json)"
        onUpload={(file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            importDatabaseJson(content);
          };
          reader.readAsText(file);
        }}
        uploadAccept=".json"
        uploadLabel="Upload File Cadangan"
        onClear={() => {}}
        clearLabel="Bersihkan File"
        templateLabel="Format Standar"
      />

      {/* Cloud Firebase Firestore Sync Panel */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 text-white shadow-xl border border-indigo-800/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-400 via-orange-500 to-indigo-600 rounded-xl shadow-md shrink-0">
              <Cloud size={24} className="text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30 mb-1">
                <ShieldCheck size={12} /> Google Cloud Firebase Firestore
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Sinkronisasi Cloud Database (Firebase)
              </h3>
              <p className="text-xs text-indigo-200">
                Simpan &amp; cadangkan seluruh data sekolah ke server cloud Google Firebase Firestore. Data tetap tersimpan aman dan dapat dibuka dari perangkat mana saja.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!firebaseUser && (
              <button
                onClick={async () => {
                  try {
                    await loginWithGoogle();
                  } catch (err: any) {
                    setStatusMessage({
                      text: err?.message || 'Gagal menghubungkan Akun Google Firebase.',
                      type: 'error'
                    });
                    setTimeout(() => setStatusMessage(null), 4000);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <span>Hubungkan Akun Google</span>
              </button>
            )}
            <button
              onClick={() => syncToCloudFirestore()}
              disabled={cloudSyncStatus === 'syncing'}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
            >
              <CloudUpload size={15} className={cloudSyncStatus === 'syncing' ? 'animate-bounce' : ''} />
              <span>{cloudSyncStatus === 'syncing' ? 'Menyinkronkan...' : 'Unggah ke Cloud Firebase'}</span>
            </button>
            <button
              onClick={() => loadFromCloudFirestore()}
              disabled={cloudSyncStatus === 'syncing'}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs border border-indigo-400 shadow-md transition-all cursor-pointer disabled:opacity-60"
            >
              <CloudDownload size={15} />
              <span>Pulihkan dari Cloud</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-900/80 border border-indigo-500/30 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Project ID Firebase</span>
            <span className="font-mono font-bold text-emerald-400">lucky-alpha-5xtlg</span>
          </div>
          <div className="p-3 bg-slate-900/80 border border-indigo-500/30 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Database Region</span>
            <span className="font-semibold text-white">asia-southeast1 (Enterprise)</span>
          </div>
          <div className="p-3 bg-slate-900/80 border border-indigo-500/30 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Status Sinkronisasi Terakhir</span>
            <span className="font-semibold text-amber-300">
              {lastCloudSyncTime ? `Tersinkron pukul ${lastCloudSyncTime}` : 'Belum sinkron sesi ini'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Backup on Left, Restore on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Backup Database */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-700 font-bold text-sm">
              <Download size={20} />
              <h3>BACKUP DATABASE (CADANGKAN DATA)</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Karena SD Negeri Balil berada di daerah dengan keterbatasan jaringan internet dan listrik (Pegunungan Bintang), sangat disarankan untuk melakukan cadangan rutin ke format file JSON atau Excel agar data tersimpan aman di flashdisk Bapak/Ibu guru.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Data yang disertakan dalam berkas cadangan:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {backupItemList.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <Check size={13} className="text-emerald-600 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-1">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-2 mt-4">
            <button
              onClick={exportDatabaseJson}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
            >
              <FileJson size={16} /> [ DOWNLOAD BACKUP (JSON) ]
            </button>
            <button
              onClick={handleExportCsvPack}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
            >
              <FileSpreadsheet size={16} /> [ EKSPOR EXCEL / CSV ]
            </button>
          </div>
        </div>

        {/* Card 2: Restore Database */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-blue-700 font-bold text-sm">
              <Upload size={20} />
              <h3>RESTORE DATABASE (PULIHKAN DATA)</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Unggah file cadangan berformat <code>.json</code> yang sebelumnya telah diunduh dari aplikasi ini untuk memulihkan seluruh data nilai, siswa, guru, dan rapor secara otomatis.
            </p>

            {/* Upload Area */}
            <label className="border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer group">
              <Upload size={36} className="text-blue-500 group-hover:scale-110 transition-transform mb-2" />
              <span className="text-xs font-bold text-slate-800 block">
                Pilih Berkas Cadangan (.JSON)
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Klik untuk memilih file backup dari komputer atau flashdisk Anda
              </span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <ShieldCheck size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <span>
                File cadangan akan diverifikasi struktur skemanya sebelum diterapkan agar tidak merusak data yang sedang berjalan.
              </span>
            </div>
          </div>

          {/* Reset button at bottom */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-4">
            <span className="text-xs text-slate-500">Butuh kembali ke awal?</span>
            <button
              onClick={handleResetConfirm}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-rose-300 hover:bg-rose-50 text-rose-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw size={14} /> Reset ke Data Default Balil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
