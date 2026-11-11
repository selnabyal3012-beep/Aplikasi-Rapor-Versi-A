import React, { useState } from 'react';
import { DoorOpen, Plus, Edit2, Trash2, CheckCircle2, Users, Save, X, FolderDown } from 'lucide-react';
import { useApp, getFaseFromKelas } from '../../context/AppContext';
import { ClassData, ClassLevel, FaseType } from '../../types';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import { SaveStatusIndicator } from '../common/SaveStatusIndicator';
import { useSaveFeedback } from '../../hooks/useSaveFeedback';
import * as XLSX from 'xlsx';

export const ClassSection: React.FC = () => {
  const { db, saveKelas, deleteKelas, setSelectedKelas, setActiveMenu } = useApp();
  const { status: modalSaveStatus, triggerSave: triggerModalSave } = useSaveFeedback();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingKelas, setEditingKelas] = useState<ClassData | null>(null);

  const defaultNewKelas: ClassData = {
    idKelas: `K00${db.kelas.length + 1}`,
    namaKelas: 'IV',
    fase: 'B',
    waliKelas: db.guru[0]?.namaGuru || 'Nama Guru',
    tahunPelajaran: db.sekolah.tahunPelajaran,
    semester: db.sekolah.semester,
    jumlahSiswa: 25
  };

  const [formData, setFormData] = useState<ClassData>(defaultNewKelas);

  const handleOpenAdd = () => {
    setEditingKelas(null);
    setFormData({
      ...defaultNewKelas,
      idKelas: `K00${db.kelas.length + 1}`
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (k: ClassData) => {
    setEditingKelas(k);
    setFormData({ ...k });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerModalSave(async () => {
      saveKelas(formData);
      setTimeout(() => {
        setModalOpen(false);
      }, 700);
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Hapus data kelas: Kelas ${name}?`)) {
      deleteKelas(id);
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const data: (string | number)[][] = [
      [db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'],
      [db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'],
      [db.sekolah.namaSekolah || 'SD NEGERI BALIL'],
      ['DATA ROMBONGAN BELAJAR & KELAS'],
      [`Tahun Ajaran: ${db.sekolah.tahunPelajaran} • Kurikulum Merdeka`],
      [],
      ['NO', 'KODE KELAS', 'NAMA KELAS', 'FASE', 'WALI KELAS', 'JUMLAH SISWA'],
      ['(1)', '(2)', '(3)', '(4)', '(5)', '(6)'],
      ...db.kelas.map((k, idx) => [
        idx + 1,
        k.idKelas,
        `Kelas ${k.namaKelas}`,
        k.fase,
        k.waliKelas,
        db.siswa.filter((s) => s.kelas === k.namaKelas).length
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 30 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Data Kelas');
    XLSX.writeFile(wb, `data-kelas-sdn-balil.xlsx`);
  };

  const handleImportFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 });
      rows.slice(7).forEach((row, i) => {
        if (!row || !row[2]) return;
        const rawName = String(row[2]).replace(/kelas\s*/i, '').trim() as ClassLevel;
        const fase = (row[3] || 'B') as FaseType;
        const wali = String(row[4] || '');
        if (rawName) {
          saveKelas({
            idKelas: row[1] || `K00${i + 1}`,
            namaKelas: rawName,
            fase,
            waliKelas: wali || 'Nama Guru',
            tahunPelajaran: db.sekolah.tahunPelajaran,
            semester: db.sekolah.semester,
            jumlahSiswa: 20
          });
        }
      });
    } catch {
      // handled
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
            <DoorOpen size={28} />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-amber-700">
              Rombongan Belajar
            </span>
            <h2 className="text-xl font-bold text-slate-800">Data Kelas & Wali Kelas</h2>
            <p className="text-xs text-slate-500">
              Tabel DATA_KELAS: Pembagian Fase Kurikulum Merdeka (Fase A, B, C) dan penetapan Wali Kelas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMenu('template_data')}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-indigo-200"
            title="Lihat & Unduh Template Data Kelas"
          >
            <FolderDown size={14} /> Unduh Template Kelas
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Plus size={15} /> Tambah Kelas Baru
          </button>
        </div>
      </div>

      {/* BARIS TOMBOL AKSI LENGKAP KELAS DI SAMPING / DI ATAS INPUT */}
      <StandardActionToolbar
        title="Aksi Data Kelas"
        badge={`${db.kelas.length} Rombel`}
        onSave={handleOpenAdd}
        saveLabel="Tambah Kelas"
        onUpdate={handleOpenAdd}
        updateLabel="Update Kelas"
        onEdit={handleOpenAdd}
        editLabel="Edit Kelas"
        onCancel={() => {}}
        cancelLabel="Batal"
        onDelete={() => {
          if (db.kelas.length > 0) {
            handleDelete(db.kelas[db.kelas.length - 1].idKelas, db.kelas[db.kelas.length - 1].namaKelas);
          }
        }}
        deleteLabel="Hapus Kelas Terakhir"
        onImport={handleImportFile}
        importLabel="Impor Excel (.xlsx)"
        onExport={handleExportExcel}
        exportLabel="Expor Excel (.xlsx)"
        onUpload={handleImportFile}
        uploadLabel="Upload File"
        onClear={() => {}}
        clearLabel="Bersihkan Filter"
        templateLabel="Template Kelas"
      />

      {/* Grid of classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {db.kelas.map((k) => {
          const actualStudentCount = db.siswa.filter((s) => s.kelas === k.namaKelas).length;
          return (
            <div
              key={k.idKelas}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-mono text-[11px] font-bold text-slate-600">
                    {k.idKelas}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                    Fase {k.fase}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Kelas {k.namaKelas}</h3>
                <p className="text-xs font-semibold text-slate-600 mt-1">
                  Wali Kelas: <span className="text-emerald-700 font-bold">{k.waliKelas}</span>
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Tahun Ajaran</span>
                    <span className="font-semibold text-slate-700">{k.tahunPelajaran}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Jumlah Siswa</span>
                    <span className="font-bold text-blue-600">{actualStudentCount} Siswa</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedKelas(k.namaKelas)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Pilih Kelas Ini
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(k)}
                    className="p-1.5 hover:bg-slate-100 text-blue-600 rounded-lg cursor-pointer"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(k.idKelas, k.namaKelas)}
                    className="p-1.5 hover:bg-slate-100 text-rose-600 rounded-lg cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-amber-700 to-orange-700 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <DoorOpen size={18} /> {editingKelas ? 'Edit Data Kelas' : 'Tambah Rombel Kelas'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-white/80 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tingkat Kelas *</label>
                <select
                  value={formData.namaKelas}
                  onChange={(e: any) => {
                    const k = e.target.value as ClassLevel;
                    setFormData({
                      ...formData,
                      namaKelas: k,
                      fase: getFaseFromKelas(k)
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                >
                  <optgroup label="── SD / MI (Kelas 1-6) ──">
                    {['I', 'II', 'III', 'IV', 'V', 'VI'].map((lvl) => (
                      <option key={lvl} value={lvl}>Kelas {lvl} (SD)</option>
                    ))}
                  </optgroup>
                  <optgroup label="── SMP / MTs (Kelas 7-9) ──">
                    {['VII', 'VIII', 'IX'].map((lvl) => (
                      <option key={lvl} value={lvl}>Kelas {lvl} (SMP)</option>
                    ))}
                  </optgroup>
                  <optgroup label="── SMA / MA (Kelas 10-12) ──">
                    {['X', 'XI', 'XII'].map((lvl) => (
                      <option key={lvl} value={lvl}>Kelas {lvl} (SMA)</option>
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
                <label className="block font-semibold text-slate-700 mb-1">Fase Kurikulum</label>
                <select
                  value={formData.fase}
                  onChange={(e: any) => setFormData({ ...formData, fase: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-semibold"
                >
                  <option value="A">Fase A (SD Kelas I - II)</option>
                  <option value="B">Fase B (SD Kelas III - IV)</option>
                  <option value="C">Fase C (SD Kelas V - VI)</option>
                  <option value="D">Fase D (SMP Kelas VII - IX)</option>
                  <option value="E">Fase E (SMA/SMK Kelas X)</option>
                  <option value="F">Fase F (SMA/SMK Kelas XI - XII / XIII)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Wali Kelas</label>
                <select
                  value={formData.waliKelas}
                  onChange={(e) => setFormData({ ...formData, waliKelas: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-medium"
                >
                  {db.guru.map((g) => (
                    <option key={g.idGuru} value={g.namaGuru}>{g.namaGuru}</option>
                  ))}
                  <option value="Nama Guru Lainnya">Nama Guru Lainnya...</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block font-semibold text-slate-700 mb-1">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e: any) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="Ganjil">1 (Ganjil)</option>
                    <option value="Genap">2 (Genap)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Catatan: Data Berhasil Disimpan & Terhubung Otomatis
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border rounded-xl font-medium"
                  >
                    Batal
                  </button>
                  <SaveStatusIndicator status={modalSaveStatus} />
                  <button
                    type="submit"
                    disabled={modalSaveStatus === 'saving'}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Save size={14} /> Simpan Data Kelas
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
