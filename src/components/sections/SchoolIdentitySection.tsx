import React, { useState } from 'react';
import {
  School,
  Save,
  CheckCircle,
  MapPin,
  Building,
  Upload,
  Image as ImageIcon,
  Trash2,
  Eye,
  ShieldCheck,
  UserCheck,
  Layers,
  GraduationCap,
  Sparkles,
  FolderDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SchoolIdentity, ClassLevel, FaseType } from '../../types';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import { SaveStatusIndicator } from '../common/SaveStatusIndicator';
import { useSaveFeedback } from '../../hooks/useSaveFeedback';
import * as XLSX from 'xlsx';

export const SchoolIdentitySection: React.FC = () => {
  const { db, updateSekolah, setSelectedKelas, setSelectedFase, setSelectedSemester, setActiveMenu } = useApp();
  const { status: saveStatus, triggerSave, lastSavedTime } = useSaveFeedback();
  const [formData, setFormData] = useState<SchoolIdentity>(() => ({
    ...db.sekolah,
    kelas: db.sekolah.kelas || 'IV',
    fase: db.sekolah.fase || 'B',
    rombel: db.sekolah.rombel || 'IV (Empat)',
    waliKelas: db.sekolah.waliKelas || 'Agus Rama, S.Pd.Gr.',
    nipWaliKelas: db.sekolah.nipWaliKelas || '19960816 202203 1 004'
  }));
  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    setIsSaved(false);
  };

  const handleSelectWaliKelasGuru = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teacherName = e.target.value;
    if (!teacherName) return;
    const selected = db.guru.find((g) => g.namaGuru === teacherName);
    setFormData((prev) => ({
      ...prev,
      waliKelas: teacherName,
      nipWaliKelas: selected ? selected.nip : prev.nipWaliKelas || ''
    }));
    setIsSaved(false);
  };

  const handleUploadLogoKiri = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({ ...prev, logoKiriUrl: event.target?.result as string }));
        setIsSaved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogoKanan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({ ...prev, logoKananUrl: event.target?.result as string }));
        setIsSaved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    triggerSave(() => {
      updateSekolah(formData);
      if (formData.kelas) setSelectedKelas(formData.kelas as ClassLevel);
      if (formData.fase) setSelectedFase(formData.fase as FaseType);
      if (formData.semester) setSelectedSemester(formData.semester);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    });
  };

  const handleResetForm = () => {
    setFormData({
      ...db.sekolah,
      kelas: db.sekolah.kelas || 'IV',
      fase: db.sekolah.fase || 'B',
      rombel: db.sekolah.rombel || 'IV (Empat)',
      waliKelas: db.sekolah.waliKelas || 'Agus Rama, S.Pd.Gr.',
      nipWaliKelas: db.sekolah.nipWaliKelas || '19960816 202203 1 004'
    });
  };

  const handleClearForm = () => {
    if (confirm('Bersihkan sebagian kolom isian kontak dan website?')) {
      setFormData((prev) => ({
        ...prev,
        email: '',
        website: '',
        telepon: ''
      }));
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const data: (string | number)[][] = [
      ['DATA IDENTITAS SATUAN PENDIDIKAN & PEMERINTAH'],
      ['Parameter', 'Nilai / Keterangan'],
      ['Nama Pemerintah', formData.namaPemerintah || ''],
      ['Nama Instansi', formData.namaInstansi || ''],
      ['Nama Sekolah', formData.namaSekolah || ''],
      ['NPSN', formData.npsn || ''],
      ['NSS', formData.nss || ''],
      ['Alamat', formData.alamat || ''],
      ['Kelurahan / Desa', formData.desaKelurahan || ''],
      ['Kecamatan / Distrik', formData.distrikKecamatan || ''],
      ['Kabupaten', formData.kabupaten || ''],
      ['Provinsi', formData.provinsi || ''],
      ['Kode Pos', formData.kodePos || ''],
      ['Email Sekolah', formData.emailSekolah || ''],
      ['Website', formData.website || ''],
      ['Kepala Sekolah', formData.namaKepalaSekolah || ''],
      ['NIP Kepala Sekolah', formData.nipKepalaSekolah || ''],
      ['Wali Kelas', formData.waliKelas || ''],
      ['NIP Wali Kelas', formData.nipWaliKelas || ''],
      ['Tahun Pelajaran', formData.tahunPelajaran || ''],
      ['Semester', formData.semester || ''],
      ['Tempat Rapor', formData.tempatRapor || ''],
      ['Tanggal Rapor', formData.tanggalRapor || '']
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 25 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Identitas Sekolah');
    XLSX.writeFile(wb, `identitas-sekolah-${formData.npsn || 'sdn-balil'}.xlsx`);
  };

  const handleImportFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 });
      const updated = { ...formData };
      rows.forEach((row) => {
        if (!row || row.length < 2) return;
        const key = String(row[0]).toLowerCase();
        const val = String(row[1]).trim();
        if (key.includes('pemerintah')) updated.namaPemerintah = val;
        else if (key.includes('instansi')) updated.namaInstansi = val;
        else if (key.includes('sekolah') && !key.includes('kepala')) updated.namaSekolah = val;
        else if (key.includes('npsn')) updated.npsn = val;
        else if (key.includes('kepala') && !key.includes('nip')) updated.namaKepalaSekolah = val;
        else if (key.includes('wali') && !key.includes('nip')) updated.waliKelas = val;
      });
      setFormData(updated);
    } catch {
      // handled
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <School size={28} />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-700">
              Data Administrasi & Lembaga
            </span>
            <h2 className="text-xl font-bold text-slate-800">Identitas Sekolah & Data Pokok Pemerintah</h2>
            <p className="text-xs text-slate-500">
              Konfigurasi Nama Pemerintah, Nama Instansi, Logo Kiri (Pemda), Logo Kanan (Sekolah/Tut Wuri Handayani), dan legalitas KOP Rapor.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSaved && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-900 text-white border-2 border-emerald-400 text-xs font-bold shadow-md animate-pulse">
              <CheckCircle size={16} className="text-emerald-300" />
              <span>Data Berhasil Disimpan & Terhubung Otomatis</span>
            </div>
          )}
          <button
            onClick={() => setActiveMenu('template_data')}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-emerald-200"
            title="Lihat & Unduh Template Identitas Sekolah"
          >
            <FolderDown size={14} /> Unduh Template Sekolah
          </button>
        </div>
      </div>

      {/* BARIS TOMBOL AKSI LENGKAP IDENTITAS SEKOLAH DI SAMPING / DI ATAS INPUT */}
      <StandardActionToolbar
        title="Aksi Identitas Sekolah"
        badge={formData.npsn || 'SDN Balil'}
        onSave={() => handleSubmit()}
        saveLabel="Simpan Identitas"
        saveStatus={saveStatus}
        onUpdate={() => handleSubmit()}
        updateLabel="Update Data"
        onEdit={() => {}}
        editLabel="Edit Formulir"
        onCancel={handleResetForm}
        cancelLabel="Batal / Reset"
        onDelete={handleClearForm}
        deleteLabel="Bersihkan Isian"
        onImport={handleImportFile}
        importLabel="Impor Excel"
        onExport={handleExportExcel}
        exportLabel="Expor Excel (.xlsx)"
        onUpload={handleImportFile}
        uploadLabel="Upload File"
        onClear={handleClearForm}
        clearLabel="Bersihkan File"
        templateLabel="Template Sekolah"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* BAGIAN DATA POKOK PEMERINTAH & LOGO RESMI */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                <Building size={16} className="text-indigo-600" /> Data Pokok Pemerintah & KOP Resmi
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Informasi ini akan tercetak pada bagian kepala surat (KOP) lembar Rapor Akhir Semester, Rapor PTS, Piagam, dan Rapor P5.
              </p>

              {/* Tabel Nama Pemerintah & Instansi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Pemerintah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="namaPemerintah"
                    required
                    value={formData.namaPemerintah || ''}
                    onChange={handleChange}
                    placeholder="Contoh: PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG"
                    className="w-full px-3 py-2 text-xs font-bold uppercase border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Nama Pemda (Provinsi / Kabupaten / Kota) pada baris teratas KOP Rapor.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Instansi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="namaInstansi"
                    required
                    value={formData.namaInstansi || ''}
                    onChange={handleChange}
                    placeholder="Contoh: DINAS PENDIDIKAN DAN PENGAJARAN"
                    className="w-full px-3 py-2 text-xs font-bold uppercase border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Dinas / Satuan Kerja Pembina Pendidikan pada baris kedua KOP Rapor.
                  </span>
                </div>
              </div>

              {/* Tombol Upload Logo Kiri dan Logo Kanan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                {/* Upload Logo Kiri */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon size={15} className="text-indigo-600" /> Logo Kiri (Lambang Pemda / Daerah)
                    </span>
                    {formData.logoKiriUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, logoKiriUrl: '' }))}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={12} /> Hapus
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {formData.logoKiriUrl ? (
                        <img src={formData.logoKiriUrl} alt="Logo Kiri" className="w-full h-full object-contain p-1" />
                      ) : (
                        <div className="text-center p-1 text-slate-400">
                          <ImageIcon size={24} className="mx-auto mb-0.5 opacity-60" />
                          <span className="text-[9px] block font-semibold leading-tight">Belum Ada Logo Kiri</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs">
                        <Upload size={14} />
                        <span>Upload Logo Kiri</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadLogoKiri}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Disarankan file format PNG dengan latar transparan (Lambang Kabupaten Pegunungan Bintang).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upload Logo Kanan */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon size={15} className="text-emerald-600" /> Logo Kanan (Tut Wuri Handayani / Sekolah)
                    </span>
                    {formData.logoKananUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, logoKananUrl: '' }))}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={12} /> Hapus
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {formData.logoKananUrl ? (
                        <img src={formData.logoKananUrl} alt="Logo Kanan" className="w-full h-full object-contain p-1" />
                      ) : (
                        <div className="text-center p-1 text-slate-400">
                          <ImageIcon size={24} className="mx-auto mb-0.5 opacity-60" />
                          <span className="text-[9px] block font-semibold leading-tight">Belum Ada Logo Kanan</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs">
                        <Upload size={14} />
                        <span>Upload Logo Kanan</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadLogoKanan}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Logo Kementerian / Tut Wuri Handayani atau Logo Resmi SD Negeri Balil.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE KOP PREVIEW */}
              <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-300">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Pratinjau KOP Surat Rapor Resmi:
                </span>
                <div className="bg-white p-4 rounded-lg border border-slate-300 flex items-center justify-between gap-4 text-center">
                  {/* Left Logo */}
                  <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                    {formData.logoKiriUrl ? (
                      <img src={formData.logoKiriUrl} alt="Logo Kiri" className="max-h-16 max-w-16 object-contain" />
                    ) : (
                      <div className="w-14 h-14 rounded-full border border-indigo-200 bg-indigo-50 flex items-center justify-center text-[9px] font-bold text-indigo-700 text-center leading-tight p-1">
                        Logo Kiri
                      </div>
                    )}
                  </div>

                  {/* Header text */}
                  <div className="flex-1">
                    <div className="text-[10px] sm:text-xs font-bold uppercase text-slate-700 tracking-wider">
                      {formData.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'}
                    </div>
                    <div className="text-[10px] sm:text-xs font-bold uppercase text-slate-700 tracking-wider">
                      {formData.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'}
                    </div>
                    <div className="text-sm sm:text-base font-black uppercase text-slate-900 tracking-wide my-0.5">
                      {formData.namaSekolah || 'SD NEGERI BALIL'}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-600">
                      Alamat: {formData.alamat || 'Kampung Balil'}, Distrik {formData.distrikKecamatan || 'Oksibil'}, Kab. {formData.kabupaten || 'Pegunungan Bintang'}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      NPSN: {formData.npsn || '-'} | NSS: {formData.nss || '-'} | Kode Pos: {formData.kodePos || '-'}
                    </div>
                  </div>

                  {/* Right Logo */}
                  <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                    {formData.logoKananUrl ? (
                      <img src={formData.logoKananUrl} alt="Logo Kanan" className="max-h-16 max-w-16 object-contain" />
                    ) : (
                      <div className="w-14 h-14 rounded-full border border-emerald-200 bg-emerald-50 flex items-center justify-center text-[9px] font-bold text-emerald-700 text-center leading-tight p-1">
                        Logo Kanan
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BAGIAN DATA POKOK SEKOLAH (ID SEKOLAH SUDAH DIHAPUS) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <School size={16} className="text-emerald-600" /> Data Pokok Satuan Pendidikan
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Resmi Sekolah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="namaSekolah"
                    required
                    value={formData.namaSekolah}
                    onChange={handleChange}
                    placeholder="Contoh: SD NEGERI BALIL"
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NPSN Sekolah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="npsn"
                    required
                    value={formData.npsn}
                    onChange={handleChange}
                    placeholder="Contoh: 60309821"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NSS (Nomor Statistik Sekolah)
                  </label>
                  <input
                    type="text"
                    name="nss"
                    value={formData.nss}
                    onChange={handleChange}
                    placeholder="Contoh: 101250304001"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>

              {/* PEMISAHAN KHUSUS: INPUT FACE SENDIRI & INPUT KELAS SENDIRI */}
              <div className="col-span-full my-3 p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Pengaturan Mandiri: Face & Kelas
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                    Input Dipisahkan Sendiri-Sendiri
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* KOTAK 1: INPUT FACE / FASE SENDIRI */}
                  <div className="bg-white rounded-xl p-4 border-2 border-cyan-200 shadow-xs relative">
                    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-cyan-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white flex items-center justify-center shadow-xs">
                          <Layers size={15} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-cyan-950 uppercase">
                            Input Face / Fase (Sendiri)
                          </h4>
                          <span className="text-[10px] text-cyan-700">Tingkat Capaian Pembelajaran</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-cyan-600 text-white shadow-xs">
                        Face {formData.fase || 'B'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                          <span>Pilih Face / Fase <span className="text-rose-500">*</span></span>
                          <span className="text-[10px] text-cyan-700 font-medium">Bebas & Mandiri</span>
                        </label>
                        <select
                          name="fase"
                          value={formData.fase || 'B'}
                          onChange={handleChange}
                          className="w-full px-3 py-2 text-xs border border-cyan-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-hidden font-bold bg-white text-slate-800"
                        >
                          <option value="Fondasi">Fase Fondasi (PAUD / TK)</option>
                          <option value="A">Fase A (Kelas I - II)</option>
                          <option value="B">Fase B (Kelas III - IV)</option>
                          <option value="C">Fase C (Kelas V - VI)</option>
                          <option value="D">Fase D (SMP Kelas VII - IX)</option>
                          <option value="E">Fase E (SMA Kelas X)</option>
                          <option value="F">Fase F (SMA Kelas XI - XII)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Ketik Teks / Kustom Face (Opsional):
                        </label>
                        <input
                          type="text"
                          name="fase"
                          value={formData.fase || ''}
                          onChange={handleChange}
                          placeholder="Contoh: Fase B"
                          className="w-full px-3 py-1.5 text-xs border border-cyan-200 bg-cyan-50/30 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-hidden font-mono"
                        />
                      </div>

                      <p className="text-[10px] text-cyan-800 bg-cyan-50 p-2 rounded-lg border border-cyan-100 flex items-center gap-1.5">
                        <span className="font-bold">•</span>
                        <span>Face berdiri sendiri dan tidak terikat otomatis dengan pilihan Kelas.</span>
                      </p>
                    </div>
                  </div>

                  {/* KOTAK 2: INPUT KELAS SENDIRI */}
                  <div className="bg-white rounded-xl p-4 border-2 border-amber-200 shadow-xs relative">
                    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-amber-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                          <GraduationCap size={15} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-amber-950 uppercase">
                            Input Kelas (Sendiri)
                          </h4>
                          <span className="text-[10px] text-amber-700">Tingkat Kelas & Rombel</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-amber-600 text-white shadow-xs">
                        Kelas {formData.kelas || 'IV'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Tingkat Kelas <span className="text-rose-500">*</span>
                          </label>
                          <select
                            name="kelas"
                            value={formData.kelas || 'IV'}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-bold bg-white text-slate-800"
                          >
                            <optgroup label="── SD / MI (Kelas 1-6) ──">
                              <option value="I">Kelas I (Satu)</option>
                              <option value="II">Kelas II (Dua)</option>
                              <option value="III">Kelas III (Tiga)</option>
                              <option value="IV">Kelas IV (Empat)</option>
                              <option value="V">Kelas V (Lima)</option>
                              <option value="VI">Kelas VI (Enam)</option>
                            </optgroup>
                            <optgroup label="── SMP / MTs (Kelas 7-9) ──">
                              <option value="VII">Kelas VII (SMP - Tujuh)</option>
                              <option value="VIII">Kelas VIII (SMP - Delapan)</option>
                              <option value="IX">Kelas IX (SMP - Sembilan)</option>
                            </optgroup>
                            <optgroup label="── SMA / MA & SMK (Kelas 10-12/13) ──">
                              <option value="X">Kelas X (SMA/SMK - Sepuluh)</option>
                              <option value="XI">Kelas XI (SMA/SMK - Sebelas)</option>
                              <option value="XII">Kelas XII (SMA/SMK - Dua Belas)</option>
                              <option value="XIII">Kelas XIII (SMK 4 Tahun)</option>
                            </optgroup>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Rombel <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="rombel"
                            required
                            value={formData.rombel || ''}
                            onChange={handleChange}
                            placeholder="Contoh: IV (Empat)"
                            className="w-full px-3 py-2 text-xs font-bold border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Ketik Teks / Kustom Kelas (Opsional):
                        </label>
                        <input
                          type="text"
                          name="kelas"
                          value={formData.kelas || ''}
                          onChange={handleChange}
                          placeholder="Contoh: IV"
                          className="w-full px-3 py-1.5 text-xs border border-amber-200 bg-amber-50/30 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                        />
                      </div>

                      <p className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-center gap-1.5">
                        <span className="font-bold">•</span>
                        <span>Kelas berdiri sendiri tanpa menimpa atau mengubah Face yang dipilih.</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

                {/* Tahun Pelajaran */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahun Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="tahunPelajaran"
                    value={formData.tahunPelajaran}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold bg-white"
                  >
                    <option value="2026/2027">2026/2027</option>
                    <option value="2027/2028">2027/2028</option>
                    <option value="2025/2026">2025/2026</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Tahun ajaran akademik.</span>
                </div>

                {/* Semester */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Semester Aktif <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold bg-white"
                  >
                    <option value="Ganjil">1 (Ganjil)</option>
                    <option value="Genap">2 (Genap)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Semester rapor berjalan.</span>
                </div>

                {/* Wali Kelas */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Wali Kelas <span className="text-rose-500">*</span>
                    </label>
                    {db.guru.length > 0 && (
                      <select
                        onChange={handleSelectWaliKelasGuru}
                        value=""
                        className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5 cursor-pointer font-medium"
                      >
                        <option value="">Pilih dari Data Guru...</option>
                        {db.guru.map((g) => (
                          <option key={g.idGuru} value={g.namaGuru}>
                            {g.namaGuru} ({g.jabatan})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <input
                    type="text"
                    name="waliKelas"
                    required
                    value={formData.waliKelas || ''}
                    onChange={handleChange}
                    placeholder="Contoh: Agus Rama, S.Pd.Gr."
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Nama pendidik yang bertindak sebagai wali kelas.</span>
                </div>

                {/* NIP Wali Kelas */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      NIP Wali Kelas
                    </label>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                      Opsional (Honorer Boleh &apos;-&apos;)
                    </span>
                  </div>
                  <input
                    type="text"
                    name="nipWaliKelas"
                    value={formData.nipWaliKelas || ''}
                    onChange={handleChange}
                    placeholder="Contoh: 19960816... atau - (Boleh kosong)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">NIP wali kelas untuk tanda tangan rapor (di pedalaman boleh dikosongkan).</span>
                </div>
              </div>
            </div>

            {/* Wilayah Administratif & Alamat */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <MapPin size={16} className="text-rose-600" /> Wilayah Administratif & Alamat Lengkap
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Jalan / Kampung
                  </label>
                  <input
                    type="text"
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleChange}
                    placeholder="Contoh: Jalan Pendidikan No. 04, Kampung Balil"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Desa / Kelurahan
                  </label>
                  <input
                    type="text"
                    name="desaKelurahan"
                    value={formData.desaKelurahan}
                    onChange={handleChange}
                    placeholder="Contoh: Balil"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Distrik / Kecamatan
                  </label>
                  <input
                    type="text"
                    name="distrikKecamatan"
                    value={formData.distrikKecamatan}
                    onChange={handleChange}
                    placeholder="Contoh: Oksibil"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kabupaten
                  </label>
                  <input
                    type="text"
                    name="kabupaten"
                    value={formData.kabupaten}
                    onChange={handleChange}
                    placeholder="Contoh: Pegunungan Bintang"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Provinsi
                  </label>
                  <input
                    type="text"
                    name="provinsi"
                    value={formData.provinsi}
                    onChange={handleChange}
                    placeholder="Contoh: Papua Pegunungan"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Pos
                  </label>
                  <input
                    type="text"
                    name="kodePos"
                    value={formData.kodePos}
                    onChange={handleChange}
                    placeholder="99573"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Email Sekolah</span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Opsional (Boleh Kosong)
                    </span>
                  </label>
                  <input
                    type="email"
                    name="emailSekolah"
                    value={formData.emailSekolah || ''}
                    onChange={handleChange}
                    placeholder="sdnbalil.ok@gmail.com (Opsional - Boleh Kosong)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Khusus pedalaman Papua: Tidak wajib diisi jika sekolah belum memiliki email.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Website / Portal Sekolah</span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Opsional (Boleh Kosong)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="website"
                    value={formData.website || ''}
                    onChange={handleChange}
                    placeholder="https://sdnegeribalil.sch.id (Opsional - Boleh Kosong)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Khusus pedalaman Papua: Boleh dikosongkan jika sekolah belum memiliki website.
                  </span>
                </div>
              </div>
            </div>

            {/* Pimpinan & Titimangsa */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <UserCheck size={16} className="text-emerald-600" /> Pimpinan Sekolah & Titimangsa Rapor
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Kepala Sekolah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="namaKepalaSekolah"
                    required
                    value={formData.namaKepalaSekolah}
                    onChange={handleChange}
                    placeholder="Nama Lengkap & Gelar"
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      NIP Kepala Sekolah
                    </label>
                    <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                      Opsional
                    </span>
                  </div>
                  <input
                    type="text"
                    name="nipKepalaSekolah"
                    value={formData.nipKepalaSekolah}
                    onChange={handleChange}
                    placeholder="19XXXXXXXXXX atau - (Boleh kosong)"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tempat Penerbitan Rapor
                  </label>
                  <input
                    type="text"
                    name="tempatRapor"
                    value={formData.tempatRapor}
                    onChange={handleChange}
                    placeholder="Balil"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Pembagian Rapor
                  </label>
                  <input
                    type="text"
                    name="tanggalRapor"
                    value={formData.tanggalRapor}
                    onChange={handleChange}
                    placeholder="19 Desember 2026"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-500 block">
                Data yang disimpan akan langsung diperbarui di lembaran cetak rapor dan rapor P5.
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-md inline-block mt-1 border border-emerald-300">
                Catatan saat simpan: Data Berhasil Disimpan & Terhubung Otomatis
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={saveStatus === 'saving'}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save size={15} /> Simpan Data Pemerintah & Sekolah
              </button>
              <SaveStatusIndicator
                status={saveStatus}
                lastSavedText={lastSavedTime}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
