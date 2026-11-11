import React, { useState } from 'react';
import { Milestone, Plus, Trash2, Edit2, Save, X, Calendar, FolderDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { P5Stage } from '../../types';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import * as XLSX from 'xlsx';
import { parseAndImportTemplate } from '../../utils/templateImporter';

export const P5StagesSection: React.FC = () => {
  const appContext = useApp();
  const { db, saveP5Tahapan, deleteP5Tahapan, selectedKelas, showSaveNotification, setActiveMenu } = appContext;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTahap, setEditingTahap] = useState<P5Stage | null>(null);

  const projekKelas = db.p5Projek.filter((p) => p.kelas === selectedKelas);
  const defaultProjekId = projekKelas[0]?.idProjek || 'P001';

  const defaultNew: P5Stage = {
    id: `TPH00${db.p5Tahapan.length + 1}`,
    idProjek: defaultProjekId,
    tahap: 'Pengenalan',
    kegiatan: '',
    tanggal: '2026-08-01'
  };

  const [formData, setFormData] = useState<P5Stage>(defaultNew);

  const handleOpenAdd = () => {
    setEditingTahap(null);
    setFormData({
      ...defaultNew,
      id: `TPH00${db.p5Tahapan.length + 1}`,
      idProjek: defaultProjekId
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (t: P5Stage) => {
    setEditingTahap(t);
    setFormData({ ...t });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveP5Tahapan(formData);
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus tahapan projek ini?')) {
      deleteP5Tahapan(id);
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const data: (string | number)[][] = [
      [db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'],
      [db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'],
      [db.sekolah.namaSekolah || 'SD NEGERI BALIL'],
      ['DATA ALUR TAHAPAN PROJEK P5'],
      [`Tahun Ajaran: ${db.sekolah.tahunPelajaran}`],
      [],
      ['NO', 'JUDUL PROJEK', 'TAHAPAN', 'URAIAN KEGIATAN', 'TANGGAL'],
      ['(1)', '(2)', '(3)', '(4)', '(5)'],
      ...db.p5Tahapan.map((t, idx) => {
        const pr = db.p5Projek.find((p) => p.idProjek === t.idProjek);
        return [
          idx + 1,
          pr ? pr.namaProjek : 'Projek P5',
          t.tahap,
          t.kegiatan,
          t.tanggal
        ];
      })
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 6 }, { wch: 28 }, { wch: 18 }, { wch: 45 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Tahapan P5');
    XLSX.writeFile(wb, `tahapan-projek-p5-sdn-balil.xlsx`);
  };

  const handleImportFile = async (file: File) => {
    try {
      const result = await parseAndImportTemplate(file, 'template_p5_tahapan', appContext);
      if (result.success) {
        showSaveNotification(result.message);
      } else {
        alert(result.message);
      }
    } catch (e: any) {
      console.error(e);
      alert('Gagal mengimpor file tahapan P5: ' + (e?.message || 'Format tidak sesuai'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
            <Milestone size={28} />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-indigo-700">
              Alur Pelaksanaan Projek
            </span>
            <h2 className="text-xl font-bold text-slate-800">Tahapan Projek P5 (Kokurikuler)</h2>
            <p className="text-xs text-slate-500">
              Tabel TAHAPAN_PROJEK: Alur 5 tahap (Pengenalan, Kontekstualisasi, Aksi, Refleksi, Tindak Lanjut).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMenu('template_data')}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-indigo-200"
            title="Lihat & Unduh Template Tahapan Projek P5"
          >
            <FolderDown size={14} /> Unduh Template Tahap P5
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Plus size={15} /> Tambah Tahap Projek
          </button>
        </div>
      </div>

      {/* BARIS TOMBOL AKSI LENGKAP TAHAPAN P5 DI SAMPING / DI ATAS INPUT */}
      <StandardActionToolbar
        title="Aksi Tahapan P5"
        badge={`${db.p5Tahapan.length} Tahap`}
        onSave={handleOpenAdd}
        saveLabel="Tambah Tahap"
        onUpdate={handleOpenAdd}
        updateLabel="Update Tahap"
        onEdit={handleOpenAdd}
        editLabel="Edit Tahap"
        onCancel={() => {}}
        cancelLabel="Batal"
        onDelete={() => {
          if (db.p5Tahapan.length > 0) {
            handleDelete(db.p5Tahapan[db.p5Tahapan.length - 1].id);
          }
        }}
        deleteLabel="Hapus Tahap Terakhir"
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">Judul Projek P5</th>
                <th className="py-3 px-3">Tahap</th>
                <th className="py-3 px-3">Uraian Kegiatan Peserta Didik</th>
                <th className="py-3 px-3">Tanggal Pelaksanaan</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.p5Tahapan.map((t, idx) => {
                const pr = db.p5Projek.find((p) => p.idProjek === t.idProjek);
                return (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {pr ? pr.namaProjek : 'Projek P5'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          t.tahap === 'Pengenalan'
                            ? 'bg-blue-100 text-blue-800'
                            : t.tahap === 'Kontekstualisasi'
                            ? 'bg-purple-100 text-purple-800'
                            : t.tahap === 'Aksi'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.tahap === 'Refleksi'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {t.tahap}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 leading-relaxed max-w-md">
                      {t.kegiatan}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {t.tanggal}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 hover:bg-slate-100 text-blue-600 rounded-lg cursor-pointer"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 hover:bg-slate-100 text-rose-600 rounded-lg cursor-pointer"
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-indigo-800 to-purple-800 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Milestone size={18} /> {editingTahap ? 'Edit Tahapan Projek' : 'Tambah Tahapan Baru'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-white/80 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Projek P5 *</label>
                <select
                  value={formData.idProjek}
                  onChange={(e) => setFormData({ ...formData, idProjek: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                >
                  {projekKelas.map((p) => (
                    <option key={p.idProjek} value={p.idProjek}>
                      {p.namaProjek} ({p.tema})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahap Projek</label>
                  <select
                    value={formData.tahap}
                    onChange={(e: any) => setFormData({ ...formData, tahap: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  >
                    <option value="Pengenalan">Pengenalan</option>
                    <option value="Kontekstualisasi">Kontekstualisasi</option>
                    <option value="Aksi">Aksi</option>
                    <option value="Refleksi">Refleksi</option>
                    <option value="Tindak Lanjut">Tindak Lanjut</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Kegiatan</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rincian Kegiatan *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.kegiatan}
                  onChange={(e) => setFormData({ ...formData, kegiatan: e.target.value })}
                  placeholder="Contoh: Operasi semut membersihkan sampah pekarangan sekolah..."
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
                    className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <Save size={14} /> Simpan Tahap
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
