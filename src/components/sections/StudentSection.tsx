import React, { useRef, useState } from 'react';
import {
  GraduationCap,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Download,
  Filter,
  CheckCircle2,
  X,
  Save,
  Users,
  FolderDown,
  Eye,
  FileSpreadsheet,
  FileUp,
  AlertCircle
} from 'lucide-react';
import { useApp, getFaseFromKelas } from '../../context/AppContext';
import { Student, ClassLevel, FaseType } from '../../types';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import { SaveStatusIndicator } from '../common/SaveStatusIndicator';
import { useSaveFeedback } from '../../hooks/useSaveFeedback';
import { exportStudentsToExcel, exportStudentsToCsv, exportStudentTemplateToExcel } from '../../utils/exportHelper';
import { parseAndImportTemplate } from '../../utils/templateImporter';

export const StudentSection: React.FC = () => {
  const appContext = useApp();
  const {
    db,
    saveSiswa,
    deleteSiswa,
    saveAllData,
    syncAllStudentConnections,
    selectedKelas,
    setSelectedKelas,
    selectedSemester,
    openReportPreview,
    showSaveNotification
  } = appContext;
  const { status: modalSaveStatus, triggerSave: triggerModalSave } = useSaveFeedback();
  const { status: toolbarSaveStatus, triggerSave: triggerToolbarSave } = useSaveFeedback();
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState<string>(selectedKelas);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Student | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importBanner, setImportBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const directImportRef = useRef<HTMLInputElement>(null);

  const getFase = (kelas: ClassLevel): FaseType => {
    return getFaseFromKelas(kelas);
  };

  const defaultNewSiswa: Student = {
    idSiswa: `S00${db.siswa.length + 1}`,
    nisn: '',
    nis: `2600${db.siswa.length + 1}`,
    namaSiswa: '',
    jenisKelamin: 'L',
    tempatLahir: 'Oksibil',
    tanggalLahir: '2016-01-01',
    nik: '',
    agama: 'Kristen',
    kelas: (filterKelas === 'SEMUA' ? selectedKelas : (filterKelas as ClassLevel)) || 'IV',
    fase: getFase((filterKelas === 'SEMUA' ? selectedKelas : (filterKelas as ClassLevel)) || 'IV'),
    semester: selectedSemester,
    tahunPelajaran: db.sekolah.tahunPelajaran,
    namaAyah: '',
    namaIbu: '',
    pekerjaanAyah: '',
    pekerjaanIbu: '',
    namaWali: '',
    pekerjaanWali: '',
    alamatWali: '',
    alamat: 'Kampung Balil, Oksibil',
    statusSiswa: 'Aktif'
  };

  const [formData, setFormData] = useState<Student>(defaultNewSiswa);

  const handleOpenAdd = () => {
    const activeKls = (filterKelas === 'SEMUA' ? selectedKelas : (filterKelas as ClassLevel)) || 'IV';
    setEditingSiswa(null);
    setFormData({
      ...defaultNewSiswa,
      idSiswa: `S_${Date.now()}`,
      nisn: '',
      nis: '',
      tempatLahir: '',
      tanggalLahir: '',
      pekerjaanAyah: '',
      pekerjaanIbu: '',
      namaWali: '',
      pekerjaanWali: '',
      alamatWali: '',
      kelas: activeKls,
      fase: getFase(activeKls)
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (siswa: Student) => {
    setEditingSiswa(siswa);
    const cleanOpt = (val?: string) => (!val || val === '-' || val === '_' ? '' : val);
    setFormData({
      ...siswa,
      nisn: siswa.nisn.startsWith('BLM_') ? '' : siswa.nisn,
      nis: siswa.nis === '-' ? '' : siswa.nis,
      tempatLahir: siswa.tempatLahir === '-' ? '' : siswa.tempatLahir,
      tanggalLahir: siswa.tanggalLahir === '-' ? '' : siswa.tanggalLahir,
      nik: siswa.nik === '-' ? '' : siswa.nik,
      pekerjaanAyah: cleanOpt(siswa.pekerjaanAyah),
      pekerjaanIbu: cleanOpt(siswa.pekerjaanIbu),
      namaWali: cleanOpt(siswa.namaWali),
      pekerjaanWali: cleanOpt(siswa.pekerjaanWali),
      alamatWali: cleanOpt(siswa.alamatWali)
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawNisn = formData.nisn ? formData.nisn.trim() : '';
    const safeNisn = rawNisn === '' || rawNisn === '-' ? `BLM_${formData.idSiswa}` : rawNisn;

    const cleanedSiswa: Student = {
      ...formData,
      nisn: safeNisn,
      nis: formData.nis ? formData.nis.trim() || '-' : '-',
      tempatLahir: formData.tempatLahir ? formData.tempatLahir.trim() || '-' : '-',
      tanggalLahir: formData.tanggalLahir || '-',
      nik: formData.nik ? formData.nik.trim() || '-' : '-',
      pekerjaanAyah: formData.pekerjaanAyah ? formData.pekerjaanAyah.trim() : '',
      pekerjaanIbu: formData.pekerjaanIbu ? formData.pekerjaanIbu.trim() : '',
      namaWali: formData.namaWali ? formData.namaWali.trim() : '',
      pekerjaanWali: formData.pekerjaanWali ? formData.pekerjaanWali.trim() : '',
      alamatWali: formData.alamatWali ? formData.alamatWali.trim() : ''
    };

    triggerModalSave(async () => {
      saveSiswa(cleanedSiswa);
      setTimeout(() => {
        setModalOpen(false);
      }, 500);
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus data siswa: ${name}?`)) {
      deleteSiswa(id);
    }
  };

  const filtered = db.siswa.filter((s) => {
    const q = search.toLowerCase();
    const matchesKelas = filterKelas === 'SEMUA' || s.kelas === filterKelas;
    const matchesSearch =
      s.namaSiswa.toLowerCase().includes(q) ||
      s.nisn.includes(search) ||
      s.nis.includes(search) ||
      s.alamat.toLowerCase().includes(q) ||
      (s.namaAyah || '').toLowerCase().includes(q) ||
      (s.namaIbu || '').toLowerCase().includes(q) ||
      (s.pekerjaanAyah || '').toLowerCase().includes(q) ||
      (s.pekerjaanIbu || '').toLowerCase().includes(q) ||
      (s.namaWali || '').toLowerCase().includes(q) ||
      (s.pekerjaanWali || '').toLowerCase().includes(q);
    return matchesKelas && matchesSearch;
  });

  const exportStudentsCsv = () => {
    exportStudentsToCsv(filtered, db.sekolah, filterKelas);
    showSaveNotification(`Berhasil mengekspor ${filtered.length} data siswa ke CSV (.csv)!`);
  };

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const handleExportExcel = () => {
    exportStudentsToExcel(filtered, db.sekolah, filterKelas);
    showSaveNotification(`Berhasil mengekspor ${filtered.length} data siswa ke Excel (.xlsx)!`);
  };

  const downloadStudentTemplateExcel = () => {
    const sourceRows = filtered.length > 0 ? filtered : db.siswa;
    exportStudentTemplateToExcel(sourceRows, db.sekolah, filterKelas);
    showSaveNotification('Template Excel Data Siswa (.xlsx) berhasil diunduh! Silakan isi lalu impor kembali.');
  };

  const handleSaveAllStudents = () => {
    triggerToolbarSave(async () => {
      syncAllStudentConnections();
      saveAllData();
      setImportBanner({
        type: 'success',
        text: `Seluruh data siswa (${db.siswa.length} peserta didik) berhasil disimpan dan disinkronkan ke kelas, mapel, nilai, kehadiran, dan rapor.`
      });
      showSaveNotification('Seluruh data siswa berhasil disimpan dengan aman!');
    });
  };

  const handleImportFile = async (file: File) => {
    setIsImporting(true);
    setImportBanner(null);
    try {
      const result = await parseAndImportTemplate(file, 'template_siswa', appContext);
      if (result.success) {
        // Pastikan siswa hasil impor langsung terlihat di tabel
        setSearch('');
        if (result.importedClasses && result.importedClasses.length > 0) {
          if (result.importedClasses.length === 1) {
            const targetKls = result.importedClasses[0];
            setFilterKelas(targetKls);
            setSelectedKelas(targetKls);
          } else {
            setFilterKelas('SEMUA');
          }
        } else {
          setFilterKelas('SEMUA');
        }
        saveAllData();
        setImportBanner({ type: 'success', text: result.message });
        showSaveNotification(result.message);
      } else {
        setImportBanner({ type: 'error', text: result.message });
        showSaveNotification(`Gagal impor: ${result.message}`);
      }
    } catch (e: any) {
      const msg = `Gagal membaca file Excel/CSV: ${e?.message || 'Format berkas tidak sesuai'}`;
      setImportBanner({ type: 'error', text: msg });
      showSaveNotification(msg);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDirectFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportFile(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleClearFilters = () => {
    setSearch('');
    setFilterKelas('SEMUA');
    setSelectedStudentId(null);
  };

  const handleEditSelected = () => {
    const target = filtered.find((s) => s.idSiswa === selectedStudentId) || filtered[0];
    if (target) handleOpenEdit(target);
    else handleOpenAdd();
  };

  const handleDeleteSelected = () => {
    const target = filtered.find((s) => s.idSiswa === selectedStudentId);
    if (target) {
      handleDelete(target.idSiswa, target.namaSiswa);
      setSelectedStudentId(null);
    } else {
      if (filtered.length > 0) {
        handleDelete(filtered[0].idSiswa, filtered[0].namaSiswa);
      }
    }
  };

  const handleClearModalForm = () => {
    setFormData({
      idSiswa: formData.idSiswa,
      nisn: '',
      nis: '',
      namaSiswa: '',
      jenisKelamin: 'L',
      agama: 'Kristen',
      tempatLahir: '',
      tanggalLahir: '',
      nik: '',
      kelas: (filterKelas === 'SEMUA' ? selectedKelas : (filterKelas as ClassLevel)) || 'IV',
      fase: getFase((filterKelas === 'SEMUA' ? selectedKelas : (filterKelas as ClassLevel)) || 'IV'),
      semester: selectedSemester,
      tahunPelajaran: db.sekolah.tahunPelajaran,
      namaAyah: '',
      namaIbu: '',
      pekerjaanAyah: '',
      pekerjaanIbu: '',
      namaWali: '',
      pekerjaanWali: '',
      alamatWali: '',
      alamat: '',
      statusSiswa: 'Aktif'
    });
  };

  return (
    <div className="space-y-6">
      {/* Hidden input untuk Impor Excel langsung dari tombol Header */}
      <input
        ref={directImportRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleDirectFileInputChange}
        className="hidden"
      />

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
            <GraduationCap size={28} />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-blue-700">
              Data Pokok Peserta Didik
            </span>
            <h2 className="text-xl font-bold text-slate-800">Data Siswa (Peserta Didik)</h2>
            <p className="text-xs text-slate-500">
              Tabel DATA_SISWA SD Negeri Balil: NISN, NIS, data orang tua, kelas, dan fase capaian belajar.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SaveStatusIndicator status={toolbarSaveStatus} />
          <button
            type="button"
            onClick={downloadStudentTemplateExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-indigo-200"
            title="Unduh langsung Template Excel (.xlsx) Data Siswa untuk diisi & diimpor kembali"
          >
            <FolderDown size={14} /> Template Excel (.xlsx)
          </button>
          <button
            type="button"
            disabled={isImporting}
            onClick={() => directImportRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-60"
            title="Impor langsung data siswa dari file Microsoft Excel (.xlsx / .xls / .csv) dan otomatis masuk ke tabel"
          >
            <FileUp size={15} /> {isImporting ? 'Mengimpor...' : 'Impor Excel (.xlsx)'}
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer hover:scale-102 ring-1 ring-emerald-400/50"
            title="Ekspor seluruh data siswa ke file Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet size={15} /> Ekspor Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={exportStudentsCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
            title="Ekspor seluruh data siswa ke format CSV (.csv)"
          >
            <Download size={14} /> CSV
          </button>
          <button
            type="button"
            onClick={handleSaveAllStudents}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer ring-1 ring-emerald-400/50"
            title="Simpan & sinkronkan seluruh data siswa ke sistem dan rapor"
          >
            <Save size={15} /> Simpan Data
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
          >
            <UserPlus size={15} /> Tambah Siswa Baru
          </button>
        </div>
      </div>

      {/* Notifikasi Hasil Impor / Simpan */}
      {importBanner && (
        <div
          className={`rounded-2xl p-4 border flex items-center justify-between gap-3 text-xs font-semibold shadow-xs ${
            importBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {importBanner.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
            )}
            <span>{importBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setImportBanner(null)}
            className="p-1 rounded-lg hover:bg-black/5 cursor-pointer"
            title="Tutup pesan"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* BARIS TOMBOL AKSI LENGKAP DATA SISWA */}
      <StandardActionToolbar
        title="Aksi Data Siswa"
        badge={filterKelas === 'SEMUA' ? 'Semua Kelas' : `Kelas ${filterKelas}`}
        selectedCount={selectedStudentId ? 1 : 0}
        onSave={handleSaveAllStudents}
        saveLabel="Simpan Data"
        saveStatus={toolbarSaveStatus}
        onUpdate={handleEditSelected}
        updateLabel="Update Siswa"
        onEdit={handleEditSelected}
        editLabel="Edit Siswa"
        onCancel={handleClearFilters}
        cancelLabel="Batal / Reset Pilihan"
        onDelete={handleDeleteSelected}
        deleteLabel="Hapus Siswa"
        onImport={handleImportFile}
        importLabel="Impor Excel (.xlsx)"
        onExport={handleExportExcel}
        exportLabel="Expor Excel (.xlsx)"
        onUpload={handleImportFile}
        uploadLabel="Upload File Siswa"
        onClear={handleClearFilters}
        clearLabel="Bersihkan Filter"
        onTemplate={downloadStudentTemplateExcel}
        templateLabel="Template Excel (.xlsx)"
      />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, NISN, atau alamat..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Filter size={14} className="text-slate-500" />
            <span className="text-slate-500 font-medium">Filter Kelas:</span>
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="SEMUA">Semua Kelas</option>
              <optgroup label="── SD / MI (Kelas 1-6) ──">
                {['I', 'II', 'III', 'IV', 'V', 'VI'].map((k) => (
                  <option key={k} value={k}>Kelas {k} (SD)</option>
                ))}
              </optgroup>
              <optgroup label="── SMP / MTs (Kelas 7-9) ──">
                {['VII', 'VIII', 'IX'].map((k) => (
                  <option key={k} value={k}>Kelas {k} (SMP)</option>
                ))}
              </optgroup>
              <optgroup label="── SMA / MA (Kelas 10-12) ──">
                {['X', 'XI', 'XII'].map((k) => (
                  <option key={k} value={k}>Kelas {k} (SMA)</option>
                ))}
              </optgroup>
              <optgroup label="── SMK / MAK (Kejuruan) ──">
                <option value="X">Kelas X (SMK)</option>
                <option value="XI">Kelas XI (SMK)</option>
                <option value="XII">Kelas XII (SMK)</option>
                <option value="XIII">Kelas XIII (SMK 4 Tahun)</option>
              </optgroup>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Ditemukan <strong className="text-slate-800">{filtered.length}</strong> peserta didik
        </div>
      </div>

      {/* Demographic quick summary */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Users size={15} className="text-blue-600" />
            Rekapitulasi Jenis Kelamin ({filterKelas === 'SEMUA' ? 'Semua Kelas' : `Kelas ${filterKelas}`}):
          </span>
          <div className="flex flex-wrap items-center gap-2 font-semibold">
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 flex items-center gap-1">
              👨‍🎓 Laki-laki: <strong>{filtered.filter((s) => s.jenisKelamin === 'L').length}</strong> Siswa
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-pink-50 border border-pink-200 text-pink-800 flex items-center gap-1">
              👩‍🎓 Perempuan: <strong>{filtered.filter((s) => s.jenisKelamin === 'P').length}</strong> Siswa
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
              Total: <strong>{filtered.length}</strong> Siswa
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-600">Rekap 6 Agama:</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
            Islam: <strong>{filtered.filter((s) => s.agama === 'Islam').length}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px]">
            Katolik: <strong>{filtered.filter((s) => s.agama === 'Katolik').length}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-[11px]">
            Kristen: <strong>{filtered.filter((s) => s.agama === 'Kristen').length}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200 font-semibold text-[11px]">
            Hindu: <strong>{filtered.filter((s) => s.agama === 'Hindu').length}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-semibold text-[11px]">
            Buddha: <strong>{filtered.filter((s) => s.agama === 'Buddha').length}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-semibold text-[11px]">
            Konghucu: <strong>{filtered.filter((s) => s.agama === 'Konghucu').length}</strong>
          </span>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">NISN & NIS</th>
                <th className="py-3 px-3">Nama Siswa</th>
                <th className="py-3 px-3">L/P</th>
                <th className="py-3 px-3">TTL & NIK</th>
                <th className="py-3 px-3">Kelas & Fase</th>
                <th className="py-3 px-3">Nama Orang Tua</th>
                <th className="py-3 px-3">Pekerjaan Orang Tua</th>
                <th className="py-3 px-3">Wali Peserta Didik</th>
                <th className="py-3 px-3">Alamat</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s, idx) => (
                <tr
                  key={s.idSiswa}
                  onClick={() => setSelectedStudentId(s.idSiswa)}
                  className={`cursor-pointer transition-colors ${
                    selectedStudentId === s.idSiswa ? 'bg-blue-50/90' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <div className="font-mono font-bold text-slate-800">
                      {s.nisn && !s.nisn.startsWith('BLM_') && s.nisn !== '-' ? (
                        s.nisn
                      ) : (
                        <span className="text-slate-400 font-normal italic text-[10px]">Belum Ada NISN</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      NIS: {s.nis && s.nis !== '-' ? s.nis : '-'}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800">{s.namaSiswa}</div>
                    <div className="text-[10px] text-slate-500">Agama: {s.agama}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.jenisKelamin === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                      }`}
                    >
                      {s.jenisKelamin}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-slate-700">
                      {s.tempatLahir && s.tempatLahir !== '-' ? s.tempatLahir : ''}
                      {s.tempatLahir && s.tempatLahir !== '-' && s.tanggalLahir && s.tanggalLahir !== '-' ? ', ' : ''}
                      {s.tanggalLahir && s.tanggalLahir !== '-' ? s.tanggalLahir : ''}
                      {(!s.tempatLahir || s.tempatLahir === '-') && (!s.tanggalLahir || s.tanggalLahir === '-') ? (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      ) : null}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">NIK: {s.nik || '-'}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                      Kls {s.kelas}
                    </span>
                    <span className="ml-1 text-[10px] text-slate-500 font-semibold">Fase {s.fase}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-slate-700">A: {s.namaAyah || '-'}</div>
                    <div className="text-[10px] text-slate-500">I: {s.namaIbu || '-'}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-slate-700">
                      A: {s.pekerjaanAyah && s.pekerjaanAyah !== '_' ? s.pekerjaanAyah : '-'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      I: {s.pekerjaanIbu && s.pekerjaanIbu !== '_' ? s.pekerjaanIbu : '-'}
                    </div>
                  </td>
                  <td className="py-3 px-3 min-w-[140px]">
                    <div className="text-slate-700 font-medium">
                      {s.namaWali && s.namaWali !== '_' ? s.namaWali : '-'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Pek: {s.pekerjaanWali && s.pekerjaanWali !== '_' ? s.pekerjaanWali : '-'}
                    </div>
                    {s.alamatWali && s.alamatWali !== '_' && s.alamatWali !== '-' && (
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]" title={s.alamatWali}>
                        {s.alamatWali}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-600 max-w-[150px] truncate" title={s.alamat}>
                    {s.alamat}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {s.statusSiswa}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openReportPreview(s.idSiswa)}
                        title="Lihat / Cetak Preview Rapor Siswa"
                        className="p-1.5 hover:bg-indigo-50 text-indigo-700 hover:text-indigo-900 rounded-lg transition-colors cursor-pointer flex items-center gap-1 bg-indigo-50/60 border border-indigo-200"
                      >
                        <Eye size={13} />
                        <span className="text-[10px] font-bold">Rapor</span>
                      </button>
                      <button
                        onClick={() => handleOpenEdit(s)}
                        title="Edit Data Siswa"
                        className="p-1.5 hover:bg-slate-100 text-blue-600 hover:text-blue-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.idSiswa, s.namaSiswa)}
                        title="Hapus Data Siswa"
                        className="p-1.5 hover:bg-slate-100 text-rose-600 hover:text-rose-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Siswa */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-blue-800 to-indigo-800 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <GraduationCap size={18} /> {editingSiswa ? 'Edit Data Siswa' : 'Tambah Peserta Didik Baru'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-white/80 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">NISN</label>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      Opsional (Pedalaman Papua)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    placeholder="Boleh kosong jika belum ada NISN"
                    className="w-full px-3 py-2 border rounded-xl font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Di pedalaman Papua, boleh dikosongkan terlebih dahulu jika belum terbit.
                  </span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">NIS (No. Induk Siswa)</label>
                    <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                      Opsional
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    placeholder="Contoh: 26001 (Boleh kosong)"
                    className="w-full px-3 py-2 border rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Siswa *</label>
                  <input
                    type="text"
                    required
                    value={formData.namaSiswa}
                    onChange={(e) => setFormData({ ...formData, namaSiswa: e.target.value })}
                    placeholder="Markus Nabyal"
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={(e: any) => setFormData({ ...formData, jenisKelamin: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Tempat Lahir</label>
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-bold">
                      Opsional
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.tempatLahir}
                    onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                    placeholder="Contoh: Oksibil / Balil / -"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Tanggal Lahir</label>
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-bold">
                      Opsional
                    </span>
                  </div>
                  <input
                    type="date"
                    value={formData.tanggalLahir}
                    onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Agama</label>
                  <select
                    value={formData.agama}
                    onChange={(e: any) => setFormData({ ...formData, agama: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Islam">Islam</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={formData.kelas}
                    onChange={(e: any) => {
                      const k = e.target.value as ClassLevel;
                      setFormData({
                        ...formData,
                        kelas: k,
                        fase: getFase(k)
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  >
                    <optgroup label="── SD / MI (Kelas 1-6) ──">
                      {['I', 'II', 'III', 'IV', 'V', 'VI'].map((k) => (
                        <option key={k} value={k}>Kelas {k} (SD)</option>
                      ))}
                    </optgroup>
                    <optgroup label="── SMP / MTs (Kelas 7-9) ──">
                      {['VII', 'VIII', 'IX'].map((k) => (
                        <option key={k} value={k}>Kelas {k} (SMP)</option>
                      ))}
                    </optgroup>
                    <optgroup label="── SMA / MA (Kelas 10-12) ──">
                      {['X', 'XI', 'XII'].map((k) => (
                        <option key={k} value={k}>Kelas {k} (SMA)</option>
                      ))}
                    </optgroup>
                    <optgroup label="── SMK / MAK (Kejuruan) ──">
                      <option value="X">Kelas X (SMK)</option>
                      <option value="XI">Kelas XI (SMK)</option>
                      <option value="XII">Kelas XII (SMK)</option>
                      <option value="XIII">Kelas XIII (SMK 4 Tahun)</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fase (Otomatis)</label>
                  <input
                    type="text"
                    readOnly
                    value={`Fase ${formData.fase}`}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahun Pelajaran</label>
                  <input
                    type="text"
                    value={formData.tahunPelajaran}
                    onChange={(e) => setFormData({ ...formData, tahunPelajaran: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.statusSiswa}
                    onChange={(e: any) => setFormData({ ...formData, statusSiswa: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Mutasi">Mutasi</option>
                    <option value="Lulus">Lulus</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Ayah</label>
                  <input
                    type="text"
                    value={formData.namaAyah}
                    onChange={(e) => setFormData({ ...formData, namaAyah: e.target.value })}
                    placeholder="Nama ayah kandung"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Ibu</label>
                  <input
                    type="text"
                    value={formData.namaIbu}
                    onChange={(e) => setFormData({ ...formData, namaIbu: e.target.value })}
                    placeholder="Nama ibu kandung"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pekerjaan Ayah</label>
                  <input
                    type="text"
                    value={formData.pekerjaanAyah || ''}
                    onChange={(e) => setFormData({ ...formData, pekerjaanAyah: e.target.value })}
                    placeholder="Contoh: Petani / PNS / Wiraswasta"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pekerjaan Ibu</label>
                  <input
                    type="text"
                    value={formData.pekerjaanIbu || ''}
                    onChange={(e) => setFormData({ ...formData, pekerjaanIbu: e.target.value })}
                    placeholder="Contoh: Ibu Rumah Tangga / Petani"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                  Wali Peserta Didik (Opsional / Jika Ada)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama Wali</label>
                    <input
                      type="text"
                      value={formData.namaWali || ''}
                      onChange={(e) => setFormData({ ...formData, namaWali: e.target.value })}
                      placeholder="Nama lengkap wali"
                      className="w-full px-3 py-2 border rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pekerjaan Wali</label>
                    <input
                      type="text"
                      value={formData.pekerjaanWali || ''}
                      onChange={(e) => setFormData({ ...formData, pekerjaanWali: e.target.value })}
                      placeholder="Contoh: Petani / Guru"
                      className="w-full px-3 py-2 border rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Alamat Wali</label>
                    <input
                      type="text"
                      value={formData.alamatWali || ''}
                      onChange={(e) => setFormData({ ...formData, alamatWali: e.target.value })}
                      placeholder="Alamat domisili wali"
                      className="w-full px-3 py-2 border rounded-xl bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Domisili Siswa</label>
                <input
                  type="text"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Kampung Balil, Distrik Oksibil"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Catatan: Data Berhasil Disimpan & Terhubung Otomatis
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearModalForm}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer border border-slate-300"
                    title="Kosongkan semua isian form"
                  >
                    Bersihkan Input
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl font-medium text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <SaveStatusIndicator status={modalSaveStatus} />
                  <button
                    type="submit"
                    disabled={modalSaveStatus === 'saving'}
                    className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold flex items-center gap-1.5 text-xs shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Save size={14} /> {editingSiswa ? 'Update Data Siswa' : 'Simpan Data Siswa'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
