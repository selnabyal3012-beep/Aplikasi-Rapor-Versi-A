import React, { useState } from 'react';
import { BookMarked, Plus, Edit2, Trash2, CheckCircle2, Save, X, FolderDown, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Subject } from '../../types';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import { SaveStatusIndicator } from '../common/SaveStatusIndicator';
import { useSaveFeedback } from '../../hooks/useSaveFeedback';
import * as XLSX from 'xlsx';
import { parseAndImportTemplate } from '../../utils/templateImporter';

export const SubjectSection: React.FC = () => {
  const appContext = useApp();
  const { db, saveMataPelajaran, deleteMataPelajaran, showSaveNotification, setActiveMenu } = appContext;
  const { status: modalSaveStatus, triggerSave: triggerModalSave } = useSaveFeedback();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMapel, setEditingMapel] = useState<Subject | null>(null);

  const defaultNewMapel: Subject = {
    mataPelajaran: '',
    kelompok: 'Wajib',
    urutan: db.mataPelajaran.length + 1
  };

  const [formData, setFormData] = useState<Subject>(defaultNewMapel);

  const handleOpenAdd = () => {
    setEditingMapel(null);
    setFormData({ ...defaultNewMapel, urutan: db.mataPelajaran.length + 1 });
    setModalOpen(true);
  };

  const handleOpenEdit = (m: Subject) => {
    setEditingMapel(m);
    setFormData({ ...m });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalMapel: Subject = {
      ...formData,
      kode: formData.kode || editingMapel?.kode || `MAPEL_${Date.now()}`
    };
    triggerModalSave(async () => {
      saveMataPelajaran(finalMapel);
      setTimeout(() => {
        setModalOpen(false);
      }, 700);
    });
  };

  const handleDelete = (idOrKode: string, name: string) => {
    if (confirm(`Hapus mata pelajaran ${name}?`)) {
      deleteMataPelajaran(idOrKode);
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const data: (string | number)[][] = [
      [db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'],
      [db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'],
      [db.sekolah.namaSekolah || 'SD NEGERI BALIL'],
      ['STRUKTUR MATA PELAJARAN KURIKULUM MERDEKA'],
      [`Tahun Ajaran: ${db.sekolah.tahunPelajaran}`],
      [],
      ['NO', 'NAMA MATA PELAJARAN', 'KELOMPOK KURIKULUM', 'URUTAN'],
      ['(1)', '(2)', '(3)', '(4)'],
      ...db.mataPelajaran.map((m, idx) => [
        idx + 1,
        m.mataPelajaran,
        m.kelompok,
        m.urutan
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 6 }, { wch: 36 }, { wch: 20 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Mata Pelajaran');
    XLSX.writeFile(wb, `data-mata-pelajaran-sdn-balil.xlsx`);
  };

  const handleImportFile = async (file: File) => {
    try {
      const result = await parseAndImportTemplate(file, 'template_mapel', appContext);
      if (result.success) {
        showSaveNotification(result.message);
      } else {
        alert(result.message);
      }
    } catch (e: any) {
      console.error(e);
      alert('Gagal mengimpor file: ' + (e?.message || 'Format tidak sesuai'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl border border-teal-100">
            <BookMarked size={28} />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-teal-700">
              Struktur Kurikulum
            </span>
            <h2 className="text-xl font-bold text-slate-800">Data Mata Pelajaran Kurikulum Merdeka</h2>
            <p className="text-xs text-slate-500">
              Tabel MATA_PELAJARAN: Kelompok Wajib, Pilihan, dan Muatan Lokal Daerah Pegunungan Bintang.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveMenu('kkm_pelajaran')}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-indigo-200"
            title="Buka menu penetapan KKM dari Semua Pelajaran"
          >
            <SlidersHorizontal size={14} /> KKM Semua Pelajaran
          </button>
          <button
            onClick={() => setActiveMenu('template_data')}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-teal-200"
            title="Lihat & Unduh Template Data Mata Pelajaran"
          >
            <FolderDown size={14} /> Unduh Template Mapel
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Plus size={15} /> Tambah Mata Pelajaran
          </button>
        </div>
      </div>

      {/* BARIS TOMBOL AKSI LENGKAP MAPEL DI SAMPING / DI ATAS INPUT */}
      <StandardActionToolbar
        title="Aksi Mata Pelajaran"
        badge={`${db.mataPelajaran.length} Mapel`}
        onSave={handleOpenAdd}
        saveLabel="Tambah Mapel"
        onUpdate={handleOpenAdd}
        updateLabel="Update Mapel"
        onEdit={handleOpenAdd}
        editLabel="Edit Mapel"
        onCancel={() => {}}
        cancelLabel="Batal"
        onDelete={() => {
          if (db.mataPelajaran.length > 0) {
            const last = db.mataPelajaran[db.mataPelajaran.length - 1];
            handleDelete(last.kode || last.mataPelajaran, last.mataPelajaran);
          }
        }}
        deleteLabel="Hapus Mapel Terakhir"
        onImport={handleImportFile}
        importLabel="Impor Excel (.xlsx)"
        onExport={handleExportExcel}
        exportLabel="Expor Excel (.xlsx)"
        onUpload={handleImportFile}
        uploadLabel="Upload File"
        onClear={() => {}}
        clearLabel="Bersihkan Filter"
        templateLabel="Template Mapel"
      />

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Urutan</th>
                <th className="py-3 px-4">Nama Mata Pelajaran</th>
                <th className="py-3 px-4">Kelompok Kurikulum</th>
                <th className="py-3 px-4">Jumlah TP Terkait</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.mataPelajaran.map((m, idx) => {
                const tpCount = db.tujuanPembelajaran.filter((t) => t.mataPelajaran.toLowerCase().includes(m.mataPelajaran.toLowerCase()) || m.mataPelajaran.toLowerCase().includes(t.mataPelajaran.toLowerCase())).length;
                return (
                  <tr key={m.kode || m.mataPelajaran || idx} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-slate-400 font-bold">{m.urutan || idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-800 text-sm">{m.mataPelajaran}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          m.kelompok === 'Wajib'
                            ? 'bg-blue-100 text-blue-800'
                            : m.kelompok === 'Pilihan'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {m.kelompok}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-600">
                      {tpCount} Tujuan Pembelajaran
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="p-1.5 hover:bg-slate-100 text-blue-600 rounded-lg cursor-pointer"
                          title="Edit Mata Pelajaran"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(m.kode || m.mataPelajaran, m.mataPelajaran)}
                          className="p-1.5 hover:bg-slate-100 text-rose-600 rounded-lg cursor-pointer"
                          title="Hapus Mata Pelajaran"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-teal-800 to-cyan-800 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <BookMarked size={18} /> {editingMapel ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-white/80 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Mata Pelajaran *</label>
                <input
                  type="text"
                  required
                  value={formData.mataPelajaran}
                  onChange={(e) => setFormData({ ...formData, mataPelajaran: e.target.value })}
                  placeholder="Contoh: Bahasa Indonesia, Matematika, IPAS, dll."
                  className="w-full px-3 py-2.5 border rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelompok Kurikulum</label>
                  <select
                    value={formData.kelompok}
                    onChange={(e: any) => setFormData({ ...formData, kelompok: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-medium bg-white"
                  >
                    <option value="Wajib">Wajib</option>
                    <option value="Pilihan">Pilihan</option>
                    <option value="Muatan Lokal">Muatan Lokal</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Urutan</label>
                  <input
                    type="number"
                    value={formData.urutan}
                    onChange={(e) => setFormData({ ...formData, urutan: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
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
                    className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Save size={14} /> Simpan Mata Pelajaran
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
