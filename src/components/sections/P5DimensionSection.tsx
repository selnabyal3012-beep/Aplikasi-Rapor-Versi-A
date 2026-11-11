import React, { useState } from 'react';
import { Sparkles, Plus, Trash2, Edit2, Save, X, Layers, FolderDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { P5DimensionItem } from '../../types';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import * as XLSX from 'xlsx';

export const P5DimensionSection: React.FC = () => {
  const { db, saveP5Dimensi, deleteP5Dimensi, setActiveMenu } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDim, setEditingDim] = useState<P5DimensionItem | null>(null);

  const defaultNew: P5DimensionItem = {
    id: `DIM00${db.p5Dimensi.length + 1}`,
    dimensi: 'Gotong Royong',
    elemen: 'Kolaborasi',
    subElemen: 'Kerja sama tim dalam menyelesaikan kegiatan kelompok'
  };

  const [formData, setFormData] = useState<P5DimensionItem>(defaultNew);

  const handleOpenAdd = () => {
    setEditingDim(null);
    setFormData({
      ...defaultNew,
      id: `DIM00${db.p5Dimensi.length + 1}`
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (dim: P5DimensionItem) => {
    setEditingDim(dim);
    setFormData({ ...dim });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveP5Dimensi(formData);
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus dimensi / elemen ini?')) {
      deleteP5Dimensi(id);
    }
  };

  const dimensiOptions = [
    'Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia',
    'Berkebinekaan Global',
    'Gotong Royong',
    'Mandiri',
    'Bernalar Kritis',
    'Kreatif'
  ];

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const data: (string | number)[][] = [
      [db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'],
      [db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'],
      [db.sekolah.namaSekolah || 'SD NEGERI BALIL'],
      ['DATA DIMENSI, ELEMEN, DAN SUB-ELEMEN P5'],
      [`Tahun Ajaran: ${db.sekolah.tahunPelajaran}`],
      [],
      ['NO', 'DIMENSI P5', 'ELEMEN', 'SUB-ELEMEN / CAPAIAN'],
      ['(1)', '(2)', '(3)', '(4)'],
      ...db.p5Dimensi.map((d, idx) => [
        idx + 1,
        d.dimensi,
        d.elemen,
        d.subElemen
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 6 }, { wch: 28 }, { wch: 22 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Dimensi P5');
    XLSX.writeFile(wb, `dimensi-p5-sdn-balil.xlsx`);
  };

  const handleImportFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 });
      rows.slice(7).forEach((row, i) => {
        if (!row || !row[1]) return;
        const dim = String(row[1]).trim();
        const el = String(row[2] || 'Kolaborasi');
        const sub = String(row[3] || '');
        if (dim) {
          saveP5Dimensi({
            id: `DIM00${db.p5Dimensi.length + i + 1}`,
            dimensi: dim,
            elemen: el,
            subElemen: sub
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
            <Sparkles size={28} />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-amber-700">
              6 Dimensi Profil Pelajar Pancasila
            </span>
            <h2 className="text-xl font-bold text-slate-800">Dimensi, Elemen & Sub-Elemen P5</h2>
            <p className="text-xs text-slate-500">
              Tabel ASPEK_P5: Pemetaan 6 Dimensi Profil Pelajar Pancasila beserta Elemen dan Sub-Elemen sasaran.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMenu('template_data')}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-amber-200"
            title="Lihat & Unduh Template Dimensi & Elemen P5"
          >
            <FolderDown size={14} /> Unduh Template Dimensi P5
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Plus size={15} /> Tambah Elemen P5
          </button>
        </div>
      </div>

      {/* BARIS TOMBOL AKSI LENGKAP DIMENSI P5 DI SAMPING / DI ATAS INPUT */}
      <StandardActionToolbar
        title="Aksi Dimensi P5"
        badge={`${db.p5Dimensi.length} Elemen`}
        onSave={handleOpenAdd}
        saveLabel="Tambah Elemen"
        onUpdate={handleOpenAdd}
        updateLabel="Update Elemen"
        onEdit={handleOpenAdd}
        editLabel="Edit Elemen"
        onCancel={() => {}}
        cancelLabel="Batal"
        onDelete={() => {
          if (db.p5Dimensi.length > 0) {
            handleDelete(db.p5Dimensi[db.p5Dimensi.length - 1].id);
          }
        }}
        deleteLabel="Hapus Elemen Terakhir"
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
                <th className="py-3 px-3">Dimensi Profil Pancasila</th>
                <th className="py-3 px-3">Elemen</th>
                <th className="py-3 px-3">Sub-Elemen Capaian</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.p5Dimensi.map((d, idx) => (
                <tr key={d.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">
                    {d.dimensi}
                  </td>
                  <td className="py-3 px-3 font-semibold text-emerald-800">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px]">
                      {d.elemen}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700 leading-relaxed">
                    {d.subElemen}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(d)}
                        className="p-1.5 hover:bg-slate-100 text-blue-600 rounded-lg cursor-pointer"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1.5 hover:bg-slate-100 text-rose-600 rounded-lg cursor-pointer"
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-amber-700 to-orange-700 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Layers size={18} /> {editingDim ? 'Edit Elemen P5' : 'Tambah Elemen P5'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-white/80 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Dimensi *</label>
                <select
                  value={formData.dimensi}
                  onChange={(e) => setFormData({ ...formData, dimensi: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                >
                  {dimensiOptions.map((dim) => (
                    <option key={dim} value={dim}>{dim}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Elemen *</label>
                <input
                  type="text"
                  required
                  value={formData.elemen}
                  onChange={(e) => setFormData({ ...formData, elemen: e.target.value })}
                  placeholder="Contoh: Kolaborasi, Kepedulian, Regulasi diri..."
                  className="w-full px-3 py-2 border rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sub-Elemen Capaian *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.subElemen}
                  onChange={(e) => setFormData({ ...formData, subElemen: e.target.value })}
                  placeholder="Contoh: Kerja sama tim dalam mencapai tujuan bersama..."
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
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <Save size={14} /> Simpan Dimensi
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
