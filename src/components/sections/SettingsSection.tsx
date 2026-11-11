import React, { useState } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Image,
  Shield,
  School,
  User,
  Calendar,
  MapPin,
  Upload,
  Trash2,
  Monitor,
  Smartphone,
  Maximize2,
  Minimize2,
  Laptop,
  PanelLeft,
  PanelLeftClose,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import { SaveStatusIndicator } from '../common/SaveStatusIndicator';
import { useSaveFeedback } from '../../hooks/useSaveFeedback';

export const SettingsSection: React.FC = () => {
  const { status: saveStatus, triggerSave, lastSavedTime } = useSaveFeedback();
  const {
    db,
    updateSekolah,
    displayMode,
    setDisplayMode,
    isFullscreen,
    toggleFullscreen,
    isSidebarCollapsed,
    setIsSidebarCollapsed
  } = useApp();
  const [formData, setFormData] = useState({
    namaAplikasi: 'Aplikasi Rapor Kurikulum Merdeka Versi A',
    namaPemerintah: db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG',
    namaInstansi: db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN',
    namaSekolah: db.sekolah.namaSekolah,
    tahunPelajaran: db.sekolah.tahunPelajaran,
    semester: db.sekolah.semester,
    kepalaSekolah: db.sekolah.namaKepalaSekolah,
    nipKepalaSekolah: db.sekolah.nipKepalaSekolah,
    tempatRapor: db.sekolah.tempatRapor,
    tanggalRapor: db.sekolah.tanggalRapor,
    logoKiriUrl: db.sekolah.logoKiriUrl || '',
    logoKananUrl: db.sekolah.logoKananUrl || ''
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSave(() => {
      updateSekolah({
        namaPemerintah: formData.namaPemerintah,
        namaInstansi: formData.namaInstansi,
        namaSekolah: formData.namaSekolah,
        tahunPelajaran: formData.tahunPelajaran,
        semester: formData.semester as any,
        namaKepalaSekolah: formData.kepalaSekolah,
        nipKepalaSekolah: formData.nipKepalaSekolah,
        tempatRapor: formData.tempatRapor,
        tanggalRapor: formData.tanggalRapor,
        logoKiriUrl: formData.logoKiriUrl,
        logoKananUrl: formData.logoKananUrl
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  const handleUploadKiri = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({ ...prev, logoKiriUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadKanan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({ ...prev, logoKananUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-100 text-slate-800 rounded-xl border border-slate-200">
            <Settings size={28} />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
              Konfigurasi Sistem
            </span>
            <h2 className="text-xl font-bold text-slate-800">Pengaturan Aplikasi Rapor</h2>
            <p className="text-xs text-slate-500">
              Konfigurasi Nama Pemerintah, Instansi, Logo Kiri, Logo Kanan, tahun ajaran, dan titimangsa rapor.
            </p>
          </div>
        </div>

        {saved && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <CheckCircle2 size={15} className="text-emerald-600" /> Pengaturan Berhasil Disimpan!
          </div>
        )}
      </div>

      {/* BARIS TOMBOL AKSI LENGKAP PENGATURAN DI SAMPING / DI ATAS INPUT */}
      <StandardActionToolbar
        title="Aksi Pengaturan Aplikasi"
        badge={formData.namaSekolah || 'SDN Balil'}
        onSave={() => handleSubmit(new Event('submit') as any)}
        saveLabel="Simpan Pengaturan"
        saveStatus={saveStatus}
        onUpdate={() => handleSubmit(new Event('submit') as any)}
        updateLabel="Update Pengaturan"
        onEdit={() => {}}
        editLabel="Edit Form"
        onCancel={() => {
          setFormData({
            namaAplikasi: 'Aplikasi Rapor Kurikulum Merdeka Versi A',
            namaPemerintah: db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG',
            namaInstansi: db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN',
            namaSekolah: db.sekolah.namaSekolah,
            tahunPelajaran: db.sekolah.tahunPelajaran,
            semester: db.sekolah.semester,
            kepalaSekolah: db.sekolah.namaKepalaSekolah,
            nipKepalaSekolah: db.sekolah.nipKepalaSekolah,
            tempatRapor: db.sekolah.tempatRapor,
            tanggalRapor: db.sekolah.tanggalRapor,
            logoKiriUrl: db.sekolah.logoKiriUrl || '',
            logoKananUrl: db.sekolah.logoKananUrl || ''
          });
        }}
        cancelLabel="Batal / Reset"
        onDelete={() => {
          if (confirm('Bersihkan pengaturan logo kustom?')) {
            setFormData((prev) => ({ ...prev, logoKiriUrl: '', logoKananUrl: '' }));
          }
        }}
        deleteLabel="Bersihkan Logo"
        onImport={(file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const data = e.target?.result as string;
            setFormData((prev) => ({ ...prev, logoKiriUrl: data }));
          };
          reader.readAsDataURL(file);
        }}
        importLabel="Impor Logo Kiri"
        onExport={() => {
          const blob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'pengaturan-aplikasi-rapor.json';
          a.click();
          URL.revokeObjectURL(a.href);
        }}
        exportLabel="Expor Konfigurasi"
        onUpload={(file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const data = e.target?.result as string;
            setFormData((prev) => ({ ...prev, logoKananUrl: data }));
          };
          reader.readAsDataURL(file);
        }}
        uploadLabel="Upload Logo Kanan"
        onClear={() => {
          setFormData((prev) => ({ ...prev, logoKiriUrl: '', logoKananUrl: '' }));
        }}
        clearLabel="Bersihkan File"
        templateLabel="Format Standar"
      />

      {/* PENGATURAN TAMPILAN APLIKASI: PC, HP, FULL */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
              <Monitor size={22} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                TAMPILAN & PERANGKAT
              </span>
              <h3 className="text-base font-extrabold text-slate-800">
                Pengaturan Tampilan Aplikasi (PC, HP, &amp; Full Screen)
              </h3>
              <p className="text-xs text-slate-500">
                Sesuaikan tata letak aplikasi agar nyaman digunakan di Komputer Guru, Layar Smartphone, atau Layar Penuh.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isFullscreen
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh Browser'}</span>
            </button>
          </div>
        </div>

        {/* 3 KARTU MODE TAMPILAN: PC, HP, FULL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. MODE PC */}
          <div
            onClick={() => setDisplayMode('pc')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              displayMode === 'pc'
                ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-200'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Monitor size={22} />
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                displayMode === 'pc'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {displayMode === 'pc' ? '✓ SEDANG AKTIF' : 'PILIH PC'}
              </span>
            </div>
            <h4 className="font-extrabold text-sm text-slate-800 mb-1">
              Mode PC (Komputer / Laptop)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tampilan standar monitor &amp; laptop guru. Sidebar menu tetap terbuka di sisi kiri untuk navigasi cepat saat mengetik nilai.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>Resolusi Ideal:</span>
              <strong className="text-slate-700">Desktop / Laptop</strong>
            </div>
          </div>

          {/* 2. MODE HP */}
          <div
            onClick={() => setDisplayMode('hp')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              displayMode === 'hp'
                ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-200'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Smartphone size={22} />
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                displayMode === 'hp'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {displayMode === 'hp' ? '✓ SEDANG AKTIF' : 'PILIH HP'}
              </span>
            </div>
            <h4 className="font-extrabold text-sm text-slate-800 mb-1">
              Mode HP (Smartphone / Ponsel)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tampilan ramah layar sentuh dan ponsel. Sidebar disembunyikan dan diganti tombol menu geser (hamburger drawer) yang hemat ruang.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>Navigasi:</span>
              <strong className="text-slate-700">Drawer Geser Mobile</strong>
            </div>
          </div>

          {/* 3. MODE FULL */}
          <div
            onClick={() => setDisplayMode('full')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              displayMode === 'full'
                ? 'border-purple-600 bg-purple-50/50 shadow-md ring-2 ring-purple-200'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Maximize2 size={22} />
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                displayMode === 'full'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {displayMode === 'full' ? '✓ SEDANG AKTIF' : 'PILIH FULL'}
              </span>
            </div>
            <h4 className="font-extrabold text-sm text-slate-800 mb-1">
              Mode FULL (Layar Penuh / Lebar)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Memaksimalkan ruang kerja tanpa batas tepi (Full Width Workspace). Sidebar otomatis dirampingkan agar tabel rekap nilai terlihat utuh.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>Ruang Kerja:</span>
              <strong className="text-purple-700">Maksimal 100% Lebar</strong>
            </div>
          </div>
        </div>

        {/* PENGATURAN TAMBAHAN: SIDEBAR & SHORTCUT */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <span className="font-semibold text-slate-700">
              Sidebar Navigasi Cepat:
            </span>
            <span className="text-slate-500">
              {isSidebarCollapsed ? 'Sidebar dalam posisi Ramping (Slim Icon)' : 'Sidebar dalam posisi Lebar Penuh'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              {isSidebarCollapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
              <span>{isSidebarCollapsed ? 'Buka Sidebar Penuh' : 'Ciutkan Sidebar (Ramping)'}</span>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 space-y-6 text-xs">
          {/* Data Pokok Pemerintah */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Data Pokok Pemerintah & KOP Surat</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Pemerintah</label>
                <input
                  type="text"
                  name="namaPemerintah"
                  value={formData.namaPemerintah}
                  onChange={handleChange}
                  placeholder="PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG"
                  className="w-full px-3 py-2 border rounded-xl font-bold uppercase bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Instansi</label>
                <input
                  type="text"
                  name="namaInstansi"
                  value={formData.namaInstansi}
                  onChange={handleChange}
                  placeholder="DINAS PENDIDIKAN DAN PENGAJARAN"
                  className="w-full px-3 py-2 border rounded-xl font-bold uppercase bg-white"
                />
              </div>
            </div>

            {/* Logo Kiri & Logo Kanan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                <div className="w-14 h-14 rounded-lg border border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.logoKiriUrl ? (
                    <img src={formData.logoKiriUrl} alt="Logo Kiri" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-[9px] text-slate-400 font-bold text-center leading-tight">Logo Kiri</span>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <span className="font-bold text-slate-800 block text-[11px]">Logo Kiri (Pemda)</span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold cursor-pointer">
                    <Upload size={12} /> Upload Logo Kiri
                    <input type="file" accept="image/*" onChange={handleUploadKiri} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                <div className="w-14 h-14 rounded-lg border border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.logoKananUrl ? (
                    <img src={formData.logoKananUrl} alt="Logo Kanan" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-[9px] text-slate-400 font-bold text-center leading-tight">Logo Kanan</span>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <span className="font-bold text-slate-800 block text-[11px]">Logo Kanan (Sekolah)</span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer">
                    <Upload size={12} /> Upload Logo Kanan
                    <input type="file" accept="image/*" onChange={handleUploadKanan} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Aplikasi</label>
              <input
                type="text"
                name="namaAplikasi"
                value={formData.namaAplikasi}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Resmi Sekolah</label>
              <input
                type="text"
                name="namaSekolah"
                required
                value={formData.namaSekolah}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tahun Pelajaran</label>
              <select
                name="tahunPelajaran"
                value={formData.tahunPelajaran}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-xl font-bold"
              >
                <option value="2026/2027">2026/2027</option>
                <option value="2027/2028">2027/2028</option>
                <option value="2025/2026">2025/2026</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Semester</label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-xl font-bold"
              >
                <option value="Ganjil">1 (Ganjil)</option>
                <option value="Genap">2 (Genap)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Kepala Sekolah</label>
              <input
                type="text"
                name="kepalaSekolah"
                required
                value={formData.kepalaSekolah}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">NIP Kepala Sekolah</label>
              <input
                type="text"
                name="nipKepalaSekolah"
                value={formData.nipKepalaSekolah}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tempat Penerbitan Rapor</label>
              <input
                type="text"
                name="tempatRapor"
                required
                value={formData.tempatRapor}
                onChange={handleChange}
                placeholder="Balil"
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Penerbitan Rapor</label>
              <input
                type="text"
                name="tanggalRapor"
                required
                value={formData.tanggalRapor}
                onChange={handleChange}
                placeholder="19 Desember 2026"
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
          <SaveStatusIndicator
            status={saveStatus}
            lastSavedText={lastSavedTime}
          />
          <button
            type="submit"
            disabled={saveStatus === 'saving'}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save size={15} /> Simpan Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
};
