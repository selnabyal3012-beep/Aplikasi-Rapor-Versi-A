import React, { useState } from 'react';
import { Compass, Plus, Edit2, Trash2, Save, X, BookOpen, FolderDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { P5Project } from '../../types';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import { SaveStatusIndicator } from '../common/SaveStatusIndicator';
import { useSaveFeedback } from '../../hooks/useSaveFeedback';
import * as XLSX from 'xlsx';
import { parseAndImportTemplate } from '../../utils/templateImporter';

export const P5ProjectSection: React.FC = () => {
  const appContext = useApp();
  const { db, selectedKelas, selectedSemester, selectedFase, saveP5Projek, deleteP5Projek, showSaveNotification, setActiveMenu } = appContext;
  const { status: modalSaveStatus, triggerSave: triggerModalSave } = useSaveFeedback();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProjek, setEditingProjek] = useState<P5Project | null>(null);

  const defaultNew: P5Project = {
    idProjek: `P00${db.p5Projek.length + 1}`,
    namaProjek: '',
    tema: 'Gaya Hidup Berkelanjutan',
    fase: selectedFase,
    kelas: selectedKelas,
    tahunPelajaran: db.sekolah.tahunPelajaran,
    semester: selectedSemester,
    deskripsiProjek: ''
  };

  const [formData, setFormData] = useState<P5Project>(defaultNew);

  const handleOpenAdd = () => {
    setEditingProjek(null);
    setFormData({
      ...defaultNew,
      idProjek: `P00${db.p5Projek.length + 1}`,
      fase: selectedFase,
      kelas: selectedKelas
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: P5Project) => {
    setEditingProjek(p);
    setFormData({ ...p });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveP5Projek(formData);
    setModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Hapus Projek P5: ${name}?`)) {
      deleteP5Projek(id);
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const data: (string | number)[][] = [
      [db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'],
      [db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'],
      [db.sekolah.namaSekolah || 'SD NEGERI BALIL'],
      ['DATA PROJEK PENGUATAN PROFIL PELAJAR PANCASILA (P5)'],
      [`Kelas: ${selectedKelas} • Fase: ${selectedFase} • Semester: ${selectedSemester}`],
      [],
      ['NO', 'KODE PROJEK', 'JUDUL PROJEK', 'TEMA P5', 'FASE', 'DESKRIPSI PROJEK'],
      ['(1)', '(2)', '(3)', '(4)', '(5)', '(6)'],
      ...projekKelas.map((p, idx) => [
        idx + 1,
        p.idProjek,
        p.namaProjek,
        p.tema,
        p.fase,
        p.deskripsiProjek
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 32 }, { wch: 26 }, { wch: 8 }, { wch: 55 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Projek P5');
    XLSX.writeFile(wb, `projek-p5-kelas-${selectedKelas}.xlsx`);
  };

  const handleImportFile = async (file: File) => {
    try {
      const result = await parseAndImportTemplate(file, 'template_p5', appContext);
      if (result.success) {
        showSaveNotification(result.message);
      } else {
        alert(result.message);
      }
    } catch (e: any) {
      console.error(e);
      alert('Gagal mengimpor file projek P5: ' + (e?.message || 'Format tidak sesuai'));
    }
  };

  const projekKelas = db.p5Projek.filter((p) => p.kelas === selectedKelas);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <Compass size={28} />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-700">
              Projek Kokurikuler
            </span>
            <h2 className="text-xl font-bold text-slate-800">P5 / Projek Penguatan Profil Pelajar Pancasila</h2>
            <p className="text-xs text-slate-500">
              Tabel DATA_PROJEK: Penentuan tema projek, judul projek tematik, dan deskripsi projek kokurikuler Kelas {selectedKelas}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMenu('template_data')}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-emerald-200"
            title="Lihat & Unduh Template Data Projek P5"
          >
            <FolderDown size={14} /> Unduh Template P5
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Plus size={15} /> Tambah Projek P5 Baru
          </button>
        </div>
      </div>

      {/* BARIS TOMBOL AKSI LENGKAP PROJEK P5 DI SAMPING / DI ATAS INPUT */}
      <StandardActionToolbar
        title="Aksi Projek P5"
        badge={`Kelas ${selectedKelas} • ${projekKelas.length} Projek`}
        onSave={handleOpenAdd}
        saveLabel="Tambah Projek"
        onUpdate={handleOpenAdd}
        updateLabel="Update Projek"
        onEdit={handleOpenAdd}
        editLabel="Edit Projek"
        onCancel={() => {}}
        cancelLabel="Batal"
        onDelete={() => {
          if (projekKelas.length > 0) {
            handleDelete(projekKelas[projekKelas.length - 1].idProjek, projekKelas[projekKelas.length - 1].namaProjek);
          }
        }}
        deleteLabel="Hapus Projek Terakhir"
        onImport={handleImportFile}
        importLabel="Impor Excel (.xlsx)"
        onExport={handleExportExcel}
        exportLabel="Expor Excel (.xlsx)"
        onUpload={handleImportFile}
        uploadLabel="Upload File"
        onClear={() => {}}
        clearLabel="Bersihkan Filter"
        templateLabel="Template P5"
      />

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projekKelas.map((p) => {
          const tahapanCount = db.p5Tahapan.filter((t) => t.idProjek === p.idProjek).length;
          const nilaiCount = db.p5Nilai.filter((n) => n.idProjek === p.idProjek).length;

          return (
            <div
              key={p.idProjek}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    Tema: {p.tema}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Fase {p.fase} • Kelas {p.kelas}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-800 mt-2 mb-1">
                  {p.namaProjek}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                  {p.deskripsiProjek}
                </p>

                <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-[11px] text-slate-500">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Fase / Kelas</span>
                    <span className="font-semibold text-slate-800">Fase {p.fase} (Kls {p.kelas})</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Tahapan</span>
                    <span className="font-semibold text-indigo-700">{tahapanCount} Langkah</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Capaian Masuk</span>
                    <span className="font-semibold text-emerald-700">{nilaiCount} Siswa</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(p)}
                  className="p-1.5 hover:bg-slate-100 text-blue-600 rounded-lg cursor-pointer"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(p.idProjek, p.namaProjek)}
                  className="p-1.5 hover:bg-slate-100 text-rose-600 rounded-lg cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Compass size={18} /> {editingProjek ? 'Edit Projek P5' : 'Tambah Projek P5 Baru'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-white/80 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fase / Kelas Target</label>
                <input
                  type="text"
                  readOnly
                  value={`Fase ${formData.fase} - Kelas ${formData.kelas}`}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tema Utama Projek P5 *</label>
                <select
                  value={formData.tema}
                  onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                >
                  <option value="Gaya Hidup Berkelanjutan">Gaya Hidup Berkelanjutan</option>
                  <option value="Kearifan Lokal">Kearifan Lokal</option>
                  <option value="Bhinneka Tunggal Ika">Bhinneka Tunggal Ika</option>
                  <option value="Bangunlah Jiwa dan Raganya">Bangunlah Jiwa dan Raganya</option>
                  <option value="Suara Demokrasi">Suara Demokrasi</option>
                  <option value="Rekayasa dan Teknologi">Rekayasa dan Teknologi</option>
                  <option value="Kewirausahaan">Kewirausahaan</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul / Nama Projek P5 *</label>
                <input
                  type="text"
                  required
                  value={formData.namaProjek}
                  onChange={(e) => setFormData({ ...formData, namaProjek: e.target.value })}
                  placeholder="Contoh: Sekolah Bersih & Ramah Lingkungan Balil"
                  className="w-full px-3 py-2 border rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Singkat Projek</label>
                <textarea
                  rows={4}
                  value={formData.deskripsiProjek}
                  onChange={(e) => setFormData({ ...formData, deskripsiProjek: e.target.value })}
                  placeholder="Deskripsikan latar belakang masalah, tujuan kegiatan, dan output yang dihasilkan peserta didik..."
                  className="w-full px-3 py-2 border rounded-xl leading-relaxed"
                />
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
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <Save size={14} /> Simpan Projek
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
