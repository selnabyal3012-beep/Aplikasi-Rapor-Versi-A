import React, { useState, useMemo, useRef } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  X,
  Save,
  FolderDown,
  Plus,
  Table,
  Columns,
  ClipboardPaste,
  SlidersHorizontal,
  Check,
  RotateCcw,
  PlusCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Teacher, ClassLevel } from '../../types';
import { StandardActionToolbar } from '../common/StandardActionToolbar';
import { SaveStatusIndicator } from '../common/SaveStatusIndicator';
import { useSaveFeedback } from '../../hooks/useSaveFeedback';
import * as XLSX from 'xlsx';

// Standard columns metadata for column visibility and dynamic table rendering
interface ColumnDef {
  key: string;
  label: string;
  category: 'utama' | 'pribadi' | 'tugas' | 'kontak' | 'kustom';
  defaultVisible: boolean;
}

const BASE_COLUMNS: ColumnDef[] = [
  { key: 'namaGuru', label: 'Nama Lengkap & Gelar', category: 'utama', defaultVisible: true },
  { key: 'nip', label: 'NIP', category: 'utama', defaultVisible: true },
  { key: 'nuptk', label: 'NUPTK', category: 'utama', defaultVisible: false },
  { key: 'jenisKelamin', label: 'L/P', category: 'utama', defaultVisible: true },
  { key: 'jabatan', label: 'Jabatan / Tugas Pokok', category: 'tugas', defaultVisible: true },
  { key: 'mataPelajaran', label: 'Mata Pelajaran', category: 'tugas', defaultVisible: true },
  { key: 'kelas', label: 'Kelas Binaan', category: 'tugas', defaultVisible: true },
  { key: 'status', label: 'Status Kepegawaian', category: 'utama', defaultVisible: true },
  { key: 'golongan', label: 'Pangkat / Golongan', category: 'utama', defaultVisible: false },
  { key: 'pendidikan', label: 'Pendidikan Terakhir', category: 'pribadi', defaultVisible: false },
  { key: 'jurusan', label: 'Jurusan / Prodi', category: 'pribadi', defaultVisible: false },
  { key: 'tempatLahir', label: 'Tempat Lahir', category: 'pribadi', defaultVisible: false },
  { key: 'tanggalLahir', label: 'Tanggal Lahir', category: 'pribadi', defaultVisible: false },
  { key: 'agama', label: 'Agama', category: 'pribadi', defaultVisible: false },
  { key: 'tugasTambahan', label: 'Tugas Tambahan', category: 'tugas', defaultVisible: false },
  { key: 'noHp', label: 'Nomor HP / WhatsApp', category: 'kontak', defaultVisible: true },
  { key: 'email', label: 'Email', category: 'kontak', defaultVisible: false },
  { key: 'alamat', label: 'Alamat Tinggal', category: 'kontak', defaultVisible: false },
  { key: 'keterangan', label: 'Keterangan', category: 'kontak', defaultVisible: false }
];

export const TeacherSection: React.FC = () => {
  const { db, saveGuru, saveGuruBatch, deleteGuru, setActiveMenu, showSaveNotification } = useApp();
  const { status: modalSaveStatus, triggerSave: triggerModalSave } = useSaveFeedback();
  const [search, setSearch] = useState('');
  const [selectedGuruId, setSelectedGuruId] = useState<string | null>(null);

  // Single Teacher Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState<Teacher | null>(null);

  // Multi-Row Batch Modal (Spreadsheet Grid tanpa batasan baris & kolom)
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteRawText, setPasteRawText] = useState('');

  // Column Selector Modal / Popover
  const [columnSelectorOpen, setColumnSelectorOpen] = useState(false);

  // Dynamic Custom Columns currently registered in session or retrieved from db
  const [sessionCustomColumns, setSessionCustomColumns] = useState<string[]>([]);
  const [newColumnNameInput, setNewColumnNameInput] = useState('');
  const [showAddColumnInput, setShowAddColumnInput] = useState(false);

  // Retrieve all custom column keys present in any teacher in the database
  const allCustomColumnKeys = useMemo(() => {
    const keysSet = new Set<string>(sessionCustomColumns);
    db.guru.forEach((g) => {
      if (g.customColumns && typeof g.customColumns === 'object') {
        Object.keys(g.customColumns).forEach((k) => keysSet.add(k));
      }
    });
    return Array.from(keysSet);
  }, [db.guru, sessionCustomColumns]);

  // Visible columns configuration
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    BASE_COLUMNS.forEach((col) => {
      initial[col.key] = col.defaultVisible;
    });
    return initial;
  });

  const toggleColumnVisibility = (key: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleShowAllColumns = () => {
    const allTrue: Record<string, boolean> = {};
    BASE_COLUMNS.forEach((col) => {
      allTrue[col.key] = true;
    });
    allCustomColumnKeys.forEach((key) => {
      allTrue[key] = true;
    });
    setVisibleColumns(allTrue);
    showSaveNotification('Semua kolom ditampilkan lengkap di tabel!');
  };

  const handleResetColumns = () => {
    const resetObj: Record<string, boolean> = {};
    BASE_COLUMNS.forEach((col) => {
      resetObj[col.key] = col.defaultVisible;
    });
    setVisibleColumns(resetObj);
    showSaveNotification('Tampilan kolom dikembalikan ke setelan standar.');
  };

  // Add new dynamic custom column
  const handleAddNewColumn = (colName: string) => {
    const cleaned = colName.trim();
    if (!cleaned) return;
    if (
      BASE_COLUMNS.some((c) => c.key.toLowerCase() === cleaned.toLowerCase() || c.label.toLowerCase() === cleaned.toLowerCase()) ||
      sessionCustomColumns.includes(cleaned)
    ) {
      alert(`Kolom "${cleaned}" sudah ada!`);
      return;
    }
    setSessionCustomColumns((prev) => [...prev, cleaned]);
    setVisibleColumns((prev) => ({ ...prev, [cleaned]: true }));
    setNewColumnNameInput('');
    setShowAddColumnInput(false);
    showSaveNotification(`Kolom baru "${cleaned}" berhasil ditambahkan tanpa batasan!`);
  };

  // Default Single Teacher Template
  const createDefaultGuru = (indexOffset = 0): Teacher => ({
    idGuru: `G_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${indexOffset}`,
    namaGuru: '',
    nip: '-',
    nuptk: '-',
    jenisKelamin: 'L',
    tempatLahir: 'Oksibil',
    tanggalLahir: '1995-01-01',
    agama: 'Kristen',
    pendidikan: 'S1 PGSD',
    jurusan: 'Pendidikan Guru Sekolah Dasar',
    jabatan: 'Guru Kelas',
    tugasTambahan: '-',
    mataPelajaran: 'Guru Kelas',
    kelas: 'IV',
    status: 'Honorer',
    golongan: '-',
    noHp: '',
    email: '',
    alamat: 'Pegunungan Bintang, Papua Pegunungan',
    keterangan: '',
    customColumns: {}
  });

  const [formData, setFormData] = useState<Teacher>(createDefaultGuru(1));

  // Multi-Row Batch Editor State (Array of rows)
  const [batchRows, setBatchRows] = useState<Teacher[]>(() => [
    createDefaultGuru(1),
    createDefaultGuru(2),
    createDefaultGuru(3),
    createDefaultGuru(4),
    createDefaultGuru(5)
  ]);

  // Open Single Teacher Add Modal
  const handleOpenAdd = () => {
    setEditingGuru(null);
    setFormData(createDefaultGuru(db.guru.length + 1));
    setModalOpen(true);
  };

  // Open Single Teacher Edit Modal
  const handleOpenEdit = (guru: Teacher) => {
    setEditingGuru(guru);
    setFormData({
      ...guru,
      customColumns: { ...(guru.customColumns || {}) }
    });
    setModalOpen(true);
  };

  // Open Multi-Row Batch Modal
  const handleOpenBatchModal = () => {
    // If empty, prefill with 5 rows
    if (batchRows.length === 0) {
      setBatchRows([
        createDefaultGuru(1),
        createDefaultGuru(2),
        createDefaultGuru(3),
        createDefaultGuru(4),
        createDefaultGuru(5)
      ]);
    }
    setBatchModalOpen(true);
  };

  // Batch Rows Management (Tanpa batasan baris)
  const handleAddBatchRows = (count: number) => {
    const newRows: Teacher[] = [];
    const currentLen = batchRows.length;
    for (let i = 0; i < count; i++) {
      newRows.push(createDefaultGuru(currentLen + i + 1));
    }
    setBatchRows((prev) => [...prev, ...newRows]);
    showSaveNotification(`+${count} baris guru baru ditambahkan ke grid input.`);
  };

  const handleUpdateBatchRowField = (index: number, field: string, value: any) => {
    setBatchRows((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      if (allCustomColumnKeys.includes(field)) {
        // Custom column field
        const existingCustom = next[index].customColumns || {};
        next[index] = {
          ...next[index],
          customColumns: {
            ...existingCustom,
            [field]: value
          }
        };
      } else {
        // Standard field
        next[index] = {
          ...next[index],
          [field]: value
        };
      }
      return next;
    });
  };

  const handleDeleteBatchRow = (index: number) => {
    setBatchRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleClearEmptyBatchRows = () => {
    setBatchRows((prev) => {
      const filtered = prev.filter((r) => r.namaGuru && r.namaGuru.trim().length > 0);
      return filtered.length > 0 ? filtered : [createDefaultGuru(1)];
    });
    showSaveNotification('Baris kosong telah dibersihkan.');
  };

  // Save all Batch Rows to Database
  const handleSaveAllBatchRows = () => {
    const validRows = batchRows.filter((r) => r.namaGuru && r.namaGuru.trim().length > 0);
    if (validRows.length === 0) {
      alert('Mohon isi minimal 1 nama guru pada baris tabel sebelum menyimpan!');
      return;
    }

    const cleanedRows: Teacher[] = validRows.map((r, i) => ({
      ...r,
      idGuru: r.idGuru || `G_${Date.now()}_${i}`,
      namaGuru: r.namaGuru.trim(),
      nip: r.nip ? r.nip.trim() || '-' : '-',
      nuptk: r.nuptk ? r.nuptk.trim() || '-' : '-',
      tempatLahir: r.tempatLahir ? r.tempatLahir.trim() || '-' : '-',
      tanggalLahir: r.tanggalLahir || '-',
      pendidikan: r.pendidikan || 'S1 PGSD',
      jabatan: r.jabatan || 'Guru Kelas',
      mataPelajaran: r.mataPelajaran || 'Guru Kelas',
      kelas: r.kelas || 'IV',
      status: r.status || 'Honorer',
      noHp: r.noHp || '-',
      customColumns: { ...(r.customColumns || {}) }
    }));

    if (saveGuruBatch) {
      saveGuruBatch(cleanedRows);
    } else {
      cleanedRows.forEach((g) => saveGuru(g));
    }

    setBatchModalOpen(false);
    showSaveNotification(`Berhasil menambahkan ${cleanedRows.length} guru sekaligus ke database!`);
  };

  // Process pasted data from Excel/Google Sheets
  const handleProcessPasteData = () => {
    if (!pasteRawText.trim()) {
      alert('Silakan tempel teks tabel terlebih dahulu!');
      return;
    }

    const lines = pasteRawText.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) return;

    // Detect separator (tab or comma or semicolon)
    const firstLine = lines[0];
    const separator = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

    const parsedRows = lines.map((line) => line.split(separator).map((cell) => cell.trim()));

    // Check if first row is header
    const firstRowStr = parsedRows[0].join(' ').toLowerCase();
    const hasHeader =
      firstRowStr.includes('nama') ||
      firstRowStr.includes('guru') ||
      firstRowStr.includes('nip') ||
      firstRowStr.includes('mapel');

    const dataRows = hasHeader ? parsedRows.slice(1) : parsedRows;
    const headerCols = hasHeader ? parsedRows[0].map((h) => h.toLowerCase()) : [];

    const newTeachers: Teacher[] = [];
    dataRows.forEach((rowCells, rIdx) => {
      if (rowCells.every((c) => !c)) return;

      const newTeacher = createDefaultGuru(rIdx);

      if (hasHeader) {
        // Map based on header name
        rowCells.forEach((cellVal, colIdx) => {
          const colHead = headerCols[colIdx] || '';
          if (colHead.includes('nama') || colHead.includes('guru')) {
            newTeacher.namaGuru = cellVal;
          } else if (colHead.includes('nip')) {
            newTeacher.nip = cellVal || '-';
          } else if (colHead.includes('nuptk')) {
            newTeacher.nuptk = cellVal || '-';
          } else if (colHead.includes('jk') || colHead.includes('kelamin') || colHead.includes('l/p')) {
            newTeacher.jenisKelamin = cellVal.toUpperCase().startsWith('P') ? 'P' : 'L';
          } else if (colHead.includes('tempat')) {
            newTeacher.tempatLahir = cellVal || '-';
          } else if (colHead.includes('tanggal') || colHead.includes('tgl') || colHead.includes('lahir')) {
            newTeacher.tanggalLahir = cellVal || '1995-01-01';
          } else if (colHead.includes('pend')) {
            newTeacher.pendidikan = cellVal || 'S1 PGSD';
          } else if (colHead.includes('jabatan')) {
            newTeacher.jabatan = cellVal || 'Guru Kelas';
          } else if (colHead.includes('mapel') || colHead.includes('pelajaran')) {
            newTeacher.mataPelajaran = cellVal || 'Guru Kelas';
          } else if (colHead.includes('kelas') || colHead.includes('rombel')) {
            newTeacher.kelas = (cellVal || 'IV') as ClassLevel;
          } else if (colHead.includes('status')) {
            newTeacher.status = cellVal || 'Honorer';
          } else if (colHead.includes('gol') || colHead.includes('pangkat')) {
            newTeacher.golongan = cellVal || '-';
          } else if (colHead.includes('hp') || colHead.includes('wa') || colHead.includes('telp')) {
            newTeacher.noHp = cellVal || '-';
          } else if (colHead.includes('email')) {
            newTeacher.email = cellVal || '-';
          } else if (colHead.includes('alamat')) {
            newTeacher.alamat = cellVal || '-';
          } else {
            // Save as custom column so no column is lost!
            if (!newTeacher.customColumns) newTeacher.customColumns = {};
            const cleanColKey = parsedRows[0][colIdx] || `Kolom_${colIdx + 1}`;
            newTeacher.customColumns[cleanColKey] = cellVal;
            if (!sessionCustomColumns.includes(cleanColKey)) {
              setSessionCustomColumns((prev) => [...prev, cleanColKey]);
            }
          }
        });
      } else {
        // Sequential mapping: 0: Nama, 1: NIP, 2: JK, 3: Jabatan, 4: Mapel, 5: Kelas, 6: Status, 7: HP
        if (rowCells[0]) newTeacher.namaGuru = rowCells[0];
        if (rowCells[1]) newTeacher.nip = rowCells[1];
        if (rowCells[2]) newTeacher.jenisKelamin = rowCells[2].toUpperCase().startsWith('P') ? 'P' : 'L';
        if (rowCells[3]) newTeacher.jabatan = rowCells[3];
        if (rowCells[4]) newTeacher.mataPelajaran = rowCells[4];
        if (rowCells[5]) newTeacher.kelas = (rowCells[5] || 'IV') as ClassLevel;
        if (rowCells[6]) newTeacher.status = rowCells[6];
        if (rowCells[7]) newTeacher.noHp = rowCells[7];

        // Any further columns go to custom columns!
        if (rowCells.length > 8) {
          if (!newTeacher.customColumns) newTeacher.customColumns = {};
          for (let c = 8; c < rowCells.length; c++) {
            const extraKey = `Kolom_${c + 1}`;
            newTeacher.customColumns[extraKey] = rowCells[c];
            if (!sessionCustomColumns.includes(extraKey)) {
              setSessionCustomColumns((prev) => [...prev, extraKey]);
            }
          }
        }
      }

      if (newTeacher.namaGuru) {
        newTeachers.push(newTeacher);
      }
    });

    if (newTeachers.length === 0) {
      alert('Tidak ada baris data guru yang valid terdeteksi dari hasil tempel.');
      return;
    }

    setBatchRows((prev) => {
      // Replace or append
      const existingClean = prev.filter((r) => r.namaGuru && r.namaGuru.trim().length > 0);
      return [...existingClean, ...newTeachers];
    });

    setPasteRawText('');
    setPasteModalOpen(false);
    showSaveNotification(`Berhasil memuat ${newTeachers.length} baris guru dari data tempel!`);
  };

  // Submit Single Teacher Form
  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaGuru.trim()) {
      alert('Nama guru wajib diisi!');
      return;
    }

    const cleanedGuru: Teacher = {
      ...formData,
      namaGuru: formData.namaGuru.trim(),
      nip: formData.nip ? formData.nip.trim() || '-' : '-',
      nuptk: formData.nuptk ? formData.nuptk.trim() || '-' : '-',
      tempatLahir: formData.tempatLahir ? formData.tempatLahir.trim() || '-' : '-',
      tanggalLahir: formData.tanggalLahir || '-',
      pendidikan: formData.pendidikan ? formData.pendidikan.trim() || 'S1 PGSD' : 'S1 PGSD',
      jabatan: formData.jabatan ? formData.jabatan.trim() || 'Guru Kelas' : 'Guru Kelas',
      mataPelajaran: formData.mataPelajaran ? formData.mataPelajaran.trim() || 'Guru Kelas' : 'Guru Kelas',
      noHp: formData.noHp ? formData.noHp.trim() || '-' : '-',
      customColumns: { ...(formData.customColumns || {}) }
    };

    triggerModalSave(async () => {
      saveGuru(cleanedGuru);
      setTimeout(() => {
        setModalOpen(false);
      }, 700);
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus data guru: ${name}?`)) {
      deleteGuru(id);
      showSaveNotification(`Data guru ${name} berhasil dihapus.`);
    }
  };

  const filtered = useMemo(() => {
    return db.guru.filter(
      (g) =>
        g.namaGuru.toLowerCase().includes(search.toLowerCase()) ||
        (g.nip && g.nip.includes(search)) ||
        (g.nuptk && g.nuptk.includes(search)) ||
        (g.jabatan && g.jabatan.toLowerCase().includes(search.toLowerCase())) ||
        (g.mataPelajaran && g.mataPelajaran.toLowerCase().includes(search.toLowerCase())) ||
        (g.status && g.status.toLowerCase().includes(search.toLowerCase()))
    );
  }, [db.guru, search]);

  // Export to Excel with all active and custom columns
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Prepare headers dynamically based on visible columns
    const activeCols = BASE_COLUMNS.filter((c) => visibleColumns[c.key]);
    const activeCustom = allCustomColumnKeys.filter((k) => visibleColumns[k] !== false);

    const headerTitles = [
      'NO',
      ...activeCols.map((c) => c.label.toUpperCase()),
      ...activeCustom.map((k) => k.toUpperCase())
    ];

    const dataRows: (string | number)[][] = filtered.map((g, idx) => {
      const row: (string | number)[] = [idx + 1];
      activeCols.forEach((col) => {
        row.push(g[col.key] !== undefined && g[col.key] !== null ? String(g[col.key]) : '-');
      });
      activeCustom.forEach((customKey) => {
        const val = g.customColumns?.[customKey] || g[customKey] || '-';
        row.push(String(val));
      });
      return row;
    });

    const sheetData: (string | number)[][] = [
      [db.sekolah.namaPemerintah || 'PEMERINTAH KABUPATEN PEGUNUNGAN BINTANG'],
      [db.sekolah.namaInstansi || 'DINAS PENDIDIKAN DAN PENGAJARAN'],
      [db.sekolah.namaSekolah || 'SD NEGERI BALIL'],
      ['DATA PENDIDIK & TENAGA KEPENDIDIKAN (GURU) - SEMUA KOLOM & BARIS LENGKAP'],
      [`Tahun Ajaran: ${db.sekolah.tahunPelajaran} • Kurikulum Merdeka • Total: ${filtered.length} Guru`],
      [],
      headerTitles,
      ...dataRows
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = headerTitles.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Data Guru Lengkap');
    XLSX.writeFile(wb, `data-guru-sdn-balil-lengkap.xlsx`);
    showSaveNotification('File Excel Data Guru berhasil diekspor lengkap!');
  };

  // Import Excel with UNRESTRICTED rows and UNRESTRICTED columns
  const handleImportFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const rowsJson = XLSX.utils.sheet_to_json<(string | number)[]>(firstSheet, { header: 1 });

      let headerIdx = -1;
      for (let i = 0; i < Math.min(rowsJson.length, 30); i++) {
        const rowStr = (rowsJson[i] || []).join(' ').toLowerCase();
        if (
          rowStr.includes('guru') ||
          rowStr.includes('nama') ||
          rowStr.includes('nip') ||
          rowStr.includes('pendidik') ||
          rowStr.includes('jabatan')
        ) {
          headerIdx = i;
          break;
        }
      }

      if (headerIdx < 0) {
        // Fallback: check if row 0 has any text
        if (rowsJson.length > 0 && rowsJson[0].length > 0) {
          headerIdx = 0;
        } else {
          alert('Format header tabel guru tidak ditemukan dalam file Excel.');
          return;
        }
      }

      const headers = rowsJson[headerIdx].map((h) => String(h || '').trim());
      const lowerHeaders = headers.map((h) => h.toLowerCase());

      // Standard Column Indexes
      const nipCol = lowerHeaders.findIndex((h) => h.includes('nip'));
      const nuptkCol = lowerHeaders.findIndex((h) => h.includes('nuptk'));
      const namaCol = lowerHeaders.findIndex((h) => h.includes('nama') || h.includes('guru'));
      const jkCol = lowerHeaders.findIndex((h) => h.includes('jk') || h.includes('kelamin') || h.includes('l/p'));
      const pendCol = lowerHeaders.findIndex((h) => h.includes('pend') || h.includes('ijazah'));
      const jurCol = lowerHeaders.findIndex((h) => h.includes('jurusan') || h.includes('prodi'));
      const jabCol = lowerHeaders.findIndex((h) => h.includes('jabatan') || h.includes('tugas'));
      const mapelCol = lowerHeaders.findIndex((h) => h.includes('mapel') || h.includes('pelajaran'));
      const kelasCol = lowerHeaders.findIndex((h) => h.includes('kelas') || h.includes('rombel'));
      const statCol = lowerHeaders.findIndex((h) => h.includes('status') || h.includes('kepegawaian'));
      const golCol = lowerHeaders.findIndex((h) => h.includes('gol') || h.includes('pangkat'));
      const hpCol = lowerHeaders.findIndex((h) => h.includes('hp') || h.includes('wa') || h.includes('telepon'));
      const emailCol = lowerHeaders.findIndex((h) => h.includes('email') || h.includes('surel'));
      const alamatCol = lowerHeaders.findIndex((h) => h.includes('alamat') || h.includes('domisili'));
      const tmptLahirCol = lowerHeaders.findIndex((h) => h.includes('tempat'));
      const tglLahirCol = lowerHeaders.findIndex((h) => h.includes('tgl') || h.includes('tanggal'));
      const agamaCol = lowerHeaders.findIndex((h) => h.includes('agama'));
      const ketCol = lowerHeaders.findIndex((h) => h.includes('ket') || h.includes('catatan'));

      // Identify unrecognized columns as custom columns
      const recognizedIndexes = new Set([
        nipCol,
        nuptkCol,
        namaCol,
        jkCol,
        pendCol,
        jurCol,
        jabCol,
        mapelCol,
        kelasCol,
        statCol,
        golCol,
        hpCol,
        emailCol,
        alamatCol,
        tmptLahirCol,
        tglLahirCol,
        agamaCol,
        ketCol
      ]);

      const customColMappings: { index: number; name: string }[] = [];
      headers.forEach((origHeader, idx) => {
        if (!recognizedIndexes.has(idx) && origHeader && !origHeader.toLowerCase().includes('no')) {
          customColMappings.push({ index: idx, name: origHeader });
          if (!sessionCustomColumns.includes(origHeader)) {
            setSessionCustomColumns((prev) => [...prev, origHeader]);
          }
        }
      });

      const newTeachers: Teacher[] = [];

      // UNRESTRICTED ROW IMPORT: processes ALL rows to the end
      for (let r = headerIdx + 1; r < rowsJson.length; r++) {
        const rowData = rowsJson[r];
        if (!rowData || rowData.length === 0) continue;

        // Try getting name from namaCol or first non-numeric text column
        let namaVal = namaCol >= 0 ? String(rowData[namaCol] || '').trim() : '';
        if (!namaVal) {
          for (let c = 0; c < rowData.length; c++) {
            const val = String(rowData[c] || '').trim();
            if (val && isNaN(Number(val)) && val.length > 2) {
              namaVal = val;
              break;
            }
          }
        }
        if (!namaVal) continue; // Skip completely empty row

        const customColsObj: Record<string, string> = {};
        customColMappings.forEach((m) => {
          if (rowData[m.index] !== undefined && rowData[m.index] !== null) {
            customColsObj[m.name] = String(rowData[m.index]);
          }
        });

        const newTeacher: Teacher = {
          idGuru: `G_IMP_${Date.now()}_${r}`,
          nip: nipCol >= 0 && rowData[nipCol] ? String(rowData[nipCol]).trim() : '-',
          nuptk: nuptkCol >= 0 && rowData[nuptkCol] ? String(rowData[nuptkCol]).trim() : '-',
          namaGuru: namaVal,
          jenisKelamin:
            jkCol >= 0 && String(rowData[jkCol]).toUpperCase().startsWith('P') ? 'P' : 'L',
          tempatLahir: tmptLahirCol >= 0 && rowData[tmptLahirCol] ? String(rowData[tmptLahirCol]).trim() : 'Oksibil',
          tanggalLahir: tglLahirCol >= 0 && rowData[tglLahirCol] ? String(rowData[tglLahirCol]).trim() : '1995-01-01',
          agama: agamaCol >= 0 && rowData[agamaCol] ? String(rowData[agamaCol]).trim() : 'Kristen',
          pendidikan: pendCol >= 0 && rowData[pendCol] ? String(rowData[pendCol]).trim() : 'S1 PGSD',
          jurusan: jurCol >= 0 && rowData[jurCol] ? String(rowData[jurCol]).trim() : 'Pendidikan Guru',
          jabatan: jabCol >= 0 && rowData[jabCol] ? String(rowData[jabCol]).trim() : 'Guru Kelas',
          tugasTambahan: '-',
          mataPelajaran: mapelCol >= 0 && rowData[mapelCol] ? String(rowData[mapelCol]).trim() : 'Guru Kelas',
          kelas: (kelasCol >= 0 && rowData[kelasCol] ? String(rowData[kelasCol]).trim() : 'IV') as ClassLevel,
          status:
            statCol >= 0 && rowData[statCol]
              ? String(rowData[statCol]).trim()
              : 'Honorer',
          golongan: golCol >= 0 && rowData[golCol] ? String(rowData[golCol]).trim() : '-',
          noHp: hpCol >= 0 && rowData[hpCol] ? String(rowData[hpCol]).trim() : '-',
          email: emailCol >= 0 && rowData[emailCol] ? String(rowData[emailCol]).trim() : '-',
          alamat: alamatCol >= 0 && rowData[alamatCol] ? String(rowData[alamatCol]).trim() : '-',
          keterangan: ketCol >= 0 && rowData[ketCol] ? String(rowData[ketCol]).trim() : '-',
          customColumns: customColsObj
        };

        newTeachers.push(newTeacher);
      }

      if (newTeachers.length === 0) {
        alert('Tidak ada baris data guru yang dapat diimpor. Pastikan nama guru terisi.');
        return;
      }

      if (saveGuruBatch) {
        saveGuruBatch(newTeachers);
      } else {
        newTeachers.forEach((t) => saveGuru(t));
      }

      showSaveNotification(
        `Sukses mengimpor ${newTeachers.length} baris guru dan ${customColMappings.length} kolom tambahan tanpa batasan!`
      );
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan saat membaca file Excel.');
    }
  };

  const handleEditSelected = () => {
    const target = filtered.find((g) => g.idGuru === selectedGuruId) || filtered[0];
    if (target) handleOpenEdit(target);
    else handleOpenAdd();
  };

  const handleDeleteSelected = () => {
    const target = filtered.find((g) => g.idGuru === selectedGuruId);
    if (target) {
      handleDelete(target.idGuru, target.namaGuru);
      setSelectedGuruId(null);
    } else if (filtered.length > 0) {
      handleDelete(filtered[0].idGuru, filtered[0].namaGuru);
    }
  };

  // Single teacher modal custom field additions
  const [modalCustomKey, setModalCustomKey] = useState('');
  const [modalCustomVal, setModalCustomVal] = useState('');

  const handleAddCustomFieldToForm = () => {
    const cleaned = modalCustomKey.trim();
    if (!cleaned) return;
    setFormData((prev) => ({
      ...prev,
      customColumns: {
        ...(prev.customColumns || {}),
        [cleaned]: modalCustomVal.trim()
      }
    }));
    if (!sessionCustomColumns.includes(cleaned)) {
      setSessionCustomColumns((prev) => [...prev, cleaned]);
    }
    setModalCustomKey('');
    setModalCustomVal('');
  };

  const handleRemoveCustomFieldFromForm = (key: string) => {
    setFormData((prev) => {
      const copy = { ...(prev.customColumns || {}) };
      delete copy[key];
      return {
        ...prev,
        customColumns: copy
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-100">
            <Users size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-purple-700">
                Pendidik & Tenaga Kependidikan (PTK)
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                Kolom & Baris Bebas / Tanpa Batas
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Data Pendidik & Tenaga Kependidikan (Guru)</h2>
            <p className="text-xs text-slate-500">
              Pengelolaan data guru lengkap tanpa batasan baris maupun kolom. Tambah satu guru, input multi-baris
              spreadsheet, atau impor Excel secara bebas.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Atur Kolom */}
          <button
            onClick={() => setColumnSelectorOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-slate-300"
            title="Pilih kolom mana saja yang ingin ditampilkan di tabel"
          >
            <Columns size={15} /> Atur Kolom
          </button>

          {/* Tombol Unduh Template */}
          <button
            onClick={() => setActiveMenu('template_data')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-indigo-200"
            title="Lihat & Unduh Template Data Guru"
          >
            <FolderDown size={15} /> Template
          </button>

          {/* Tombol Tambah Banyak Baris (Multi-Row Spreadsheet) */}
          <button
            onClick={handleOpenBatchModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
            title="Input banyak baris guru sekaligus dalam tampilan tabel/spreadsheet tanpa batasan"
          >
            <Table size={15} /> Input Banyak Baris (Grid)
          </button>

          {/* Tombol Tambah 1 Guru (Formulir) */}
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
            title="Buka formulir lengkap penambahan satu data guru"
          >
            <UserPlus size={15} /> Tambah 1 Guru
          </button>
        </div>
      </div>

      {/* BARIS TOMBOL AKSI LENGKAP DATA GURU */}
      <StandardActionToolbar
        title="Aksi Data Guru"
        badge={`${filtered.length} Guru`}
        selectedCount={selectedGuruId ? 1 : 0}
        onSave={handleOpenAdd}
        saveLabel="Tambah 1 Guru"
        onUpdate={handleEditSelected}
        updateLabel="Update Guru"
        onEdit={handleEditSelected}
        editLabel="Edit Guru"
        onCancel={() => {
          setSearch('');
          setSelectedGuruId(null);
        }}
        cancelLabel="Batal / Reset Pilihan"
        onDelete={handleDeleteSelected}
        deleteLabel="Hapus Guru"
        onImport={handleImportFile}
        importLabel="Impor Excel (Semua Baris/Kolom)"
        onExport={handleExportExcel}
        exportLabel="Expor Excel (.xlsx)"
        onUpload={handleImportFile}
        uploadLabel="Upload File Guru"
        onClear={() => {
          setSearch('');
          setSelectedGuruId(null);
        }}
        clearLabel="Bersihkan Filter"
        onTemplate={() => setActiveMenu('template_data')}
        templateLabel="Template Guru"
      />

      {/* Filter and Search Bar with Quick Action Pills */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama guru, NIP, NUPTK, mapel, atau status kepegawaian..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter: All Columns toggle */}
          <button
            onClick={handleShowAllColumns}
            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] rounded-lg border border-purple-200 transition-colors cursor-pointer"
            title="Tampilkan semua kolom sekaligus di tabel"
          >
            Tampilkan Semua Kolom
          </button>
          <button
            onClick={handleResetColumns}
            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-[11px] rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Kembalikan tampilan kolom standar"
          >
            Kolom Standar
          </button>
          <div className="text-xs text-slate-500 font-medium ml-2">
            Total: <strong className="text-slate-800">{filtered.length}</strong> guru terdaftar
          </div>
        </div>
      </div>

      {/* Teachers Table with Full Horizontal & Vertical Scroll - No Column/Row Limit */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-xs text-left divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider sticky top-0 z-10">
              <tr>
                <th className="py-3 px-3 w-12 text-center bg-slate-100">No</th>
                {BASE_COLUMNS.map((col) => {
                  if (!visibleColumns[col.key]) return null;
                  return (
                    <th key={col.key} className="py-3 px-3 whitespace-nowrap">
                      {col.label}
                    </th>
                  );
                })}
                {/* Dynamic Custom Columns */}
                {allCustomColumnKeys.map((customKey) => {
                  if (visibleColumns[customKey] === false) return null;
                  return (
                    <th key={customKey} className="py-3 px-3 whitespace-nowrap bg-purple-50/50 text-purple-900 border-l border-purple-100">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 inline-block"></span>
                        {customKey}
                      </span>
                    </th>
                  );
                })}
                <th className="py-3 px-3 text-right sticky right-0 bg-slate-50 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={25} className="py-8 text-center text-slate-400">
                    Tidak ada data guru yang cocok dengan pencarian atau belum ada data guru.
                  </td>
                </tr>
              ) : (
                filtered.map((g, idx) => {
                  const isSelected = selectedGuruId === g.idGuru;
                  return (
                    <tr
                      key={g.idGuru}
                      onClick={() => setSelectedGuruId(g.idGuru)}
                      className={`hover:bg-purple-50/40 transition-colors cursor-pointer ${
                        isSelected ? 'bg-purple-50/80 font-medium' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-slate-400 font-mono text-center">{idx + 1}</td>

                      {/* Render each enabled base column */}
                      {visibleColumns.namaGuru && (
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900 text-[13px]">{g.namaGuru}</div>
                          {g.nuptk && g.nuptk !== '-' && (
                            <div className="text-[10px] text-slate-400">NUPTK: {g.nuptk}</div>
                          )}
                        </td>
                      )}

                      {visibleColumns.nip && (
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-700">
                          {g.nip || '-'}
                        </td>
                      )}

                      {visibleColumns.nuptk && (
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600">
                          {g.nuptk || '-'}
                        </td>
                      )}

                      {visibleColumns.jenisKelamin && (
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              g.jenisKelamin === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                            }`}
                          >
                            {g.jenisKelamin === 'L' ? 'L' : 'P'}
                          </span>
                        </td>
                      )}

                      {visibleColumns.jabatan && (
                        <td className="py-3 px-3 whitespace-nowrap font-semibold text-slate-800">
                          {g.jabatan || 'Guru Kelas'}
                        </td>
                      )}

                      {visibleColumns.mataPelajaran && (
                        <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                          {g.mataPelajaran || 'Guru Kelas'}
                        </td>
                      )}

                      {visibleColumns.kelas && (
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                            Kls {g.kelas}
                          </span>
                        </td>
                      )}

                      {visibleColumns.status && (
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              g.status === 'PNS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : g.status === 'PPPK'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {g.status}
                          </span>
                        </td>
                      )}

                      {visibleColumns.golongan && (
                        <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-mono">
                          {g.golongan || '-'}
                        </td>
                      )}

                      {visibleColumns.pendidikan && (
                        <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                          {g.pendidikan || '-'}
                        </td>
                      )}

                      {visibleColumns.jurusan && (
                        <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                          {g.jurusan || '-'}
                        </td>
                      )}

                      {visibleColumns.tempatLahir && (
                        <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                          {g.tempatLahir || '-'}
                        </td>
                      )}

                      {visibleColumns.tanggalLahir && (
                        <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-mono">
                          {g.tanggalLahir || '-'}
                        </td>
                      )}

                      {visibleColumns.agama && (
                        <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                          {g.agama || '-'}
                        </td>
                      )}

                      {visibleColumns.tugasTambahan && (
                        <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                          {g.tugasTambahan || '-'}
                        </td>
                      )}

                      {visibleColumns.noHp && (
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600">
                          {g.noHp || '-'}
                        </td>
                      )}

                      {visibleColumns.email && (
                        <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                          {g.email || '-'}
                        </td>
                      )}

                      {visibleColumns.alamat && (
                        <td className="py-3 px-3 max-w-[200px] truncate text-slate-600" title={g.alamat}>
                          {g.alamat || '-'}
                        </td>
                      )}

                      {visibleColumns.keterangan && (
                        <td className="py-3 px-3 max-w-[200px] truncate text-slate-500" title={g.keterangan}>
                          {g.keterangan || '-'}
                        </td>
                      )}

                      {/* Custom Columns Values */}
                      {allCustomColumnKeys.map((customKey) => {
                        if (visibleColumns[customKey] === false) return null;
                        const cellVal = g.customColumns?.[customKey] || g[customKey] || '-';
                        return (
                          <td
                            key={customKey}
                            className="py-3 px-3 whitespace-nowrap text-purple-950 bg-purple-50/20 font-medium"
                          >
                            {cellVal}
                          </td>
                        );
                      })}

                      {/* Action Sticky Column */}
                      <td className="py-3 px-3 text-right sticky right-0 bg-white shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenEdit(g)}
                            title="Edit Data Guru Lengkap"
                            className="p-1.5 hover:bg-slate-100 text-blue-600 hover:text-blue-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(g.idGuru, g.namaGuru)}
                            title="Hapus Data Guru"
                            className="p-1.5 hover:bg-slate-100 text-rose-600 hover:text-rose-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. MODAL BATCH / MULTI-ROW SPREADSHEET INPUT (BARIS & KOLOM BEBAS) */}
      {/* ======================================================== */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 p-4 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Table size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    Input Banyak Baris & Kolom Bebas (Data Guru)
                  </h3>
                  <p className="text-[11px] text-white/80">
                    Tambahkan baris sebanyak yang Anda inginkan, tambahkan kolom baru sesuka hati, atau tempel langsung dari Excel.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPasteModalOpen(true)}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 border border-white/20"
                >
                  <ClipboardPaste size={14} /> Tempel dari Excel / Sheets
                </button>
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Quick Actions Bar (Add Rows, Add Columns, Clear Rows) */}
            <div className="bg-slate-50 p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-slate-700 mr-1 flex items-center gap-1">
                  Tambah Baris:
                </span>
                <button
                  type="button"
                  onClick={() => handleAddBatchRows(1)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-purple-700 font-bold border border-purple-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Plus size={13} /> 1 Baris
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBatchRows(5)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-purple-700 font-bold border border-purple-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Plus size={13} /> 5 Baris
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBatchRows(10)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-purple-700 font-bold border border-purple-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Plus size={13} /> 10 Baris
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBatchRows(20)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-purple-700 font-bold border border-purple-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Plus size={13} /> 20 Baris
                </button>
                <div className="h-4 w-px bg-slate-300 mx-1"></div>
                <button
                  type="button"
                  onClick={handleClearEmptyBatchRows}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 font-semibold border border-slate-300 rounded-lg transition-colors cursor-pointer"
                  title="Hapus baris yang nama gurunya masih kosong"
                >
                  Bersihkan Baris Kosong
                </button>
              </div>

              {/* Add Custom Column Section */}
              <div className="flex items-center gap-2">
                {showAddColumnInput ? (
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-purple-300 shadow-2xs">
                    <input
                      type="text"
                      autoFocus
                      value={newColumnNameInput}
                      onChange={(e) => setNewColumnNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewColumn(newColumnNameInput);
                        }
                      }}
                      placeholder="Nama Kolom Baru (cth: Sertifikasi, BPJS)"
                      className="px-2 py-0.5 text-xs outline-hidden w-48 text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddNewColumn(newColumnNameInput)}
                      className="px-2 py-0.5 bg-purple-700 text-white rounded-lg font-bold text-[11px]"
                    >
                      Tambah
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddColumnInput(false)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddColumnInput(true)}
                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <PlusCircle size={13} /> + Tambah Kolom Baru
                  </button>
                )}
              </div>
            </div>

            {/* Editable Spreadsheet Table Container */}
            <div className="flex-1 overflow-auto p-4 bg-slate-100/60">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 sticky top-0 z-20">
                      <tr>
                        <th className="py-2.5 px-2 w-10 text-center bg-slate-200/80 sticky left-0 z-30">No</th>
                        <th className="py-2.5 px-3 min-w-[200px] bg-slate-100 sticky left-10 z-30 border-r border-slate-200">
                          Nama Lengkap & Gelar <span className="text-rose-600">*</span>
                        </th>
                        <th className="py-2.5 px-2 min-w-[150px]">NIP</th>
                        <th className="py-2.5 px-2 min-w-[130px]">NUPTK</th>
                        <th className="py-2.5 px-2 w-20 text-center">L/P</th>
                        <th className="py-2.5 px-2 min-w-[140px]">Jabatan Guru</th>
                        <th className="py-2.5 px-2 min-w-[160px]">Mata Pelajaran</th>
                        <th className="py-2.5 px-2 min-w-[110px]">Kelas Binaan</th>
                        <th className="py-2.5 px-2 min-w-[110px]">Status</th>
                        <th className="py-2.5 px-2 min-w-[100px]">Golongan</th>
                        <th className="py-2.5 px-2 min-w-[130px]">Pendidikan</th>
                        <th className="py-2.5 px-2 min-w-[130px]">No. HP/WA</th>
                        <th className="py-2.5 px-2 min-w-[130px]">Tempat Lahir</th>
                        <th className="py-2.5 px-2 min-w-[130px]">Tanggal Lahir</th>
                        <th className="py-2.5 px-2 min-w-[100px]">Agama</th>

                        {/* Dynamic Custom Column Headers */}
                        {allCustomColumnKeys.map((cKey) => (
                          <th
                            key={cKey}
                            className="py-2.5 px-2 min-w-[140px] bg-purple-50 text-purple-900 border-l border-purple-200"
                          >
                            <span className="flex items-center gap-1 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 inline-block"></span>
                              {cKey}
                            </span>
                          </th>
                        ))}

                        <th className="py-2.5 px-2 w-12 text-center sticky right-0 bg-slate-100 z-20 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                          Hapus
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {batchRows.map((row, rIdx) => (
                        <tr key={row.idGuru || rIdx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-2 text-center font-mono text-slate-400 bg-slate-50 sticky left-0 z-10 border-r border-slate-100">
                            {rIdx + 1}
                          </td>
                          <td className="py-1 px-2 sticky left-10 z-10 bg-white border-r border-slate-200">
                            <input
                              type="text"
                              value={row.namaGuru}
                              onChange={(e) => handleUpdateBatchRowField(rIdx, 'namaGuru', e.target.value)}
                              placeholder="Nama guru & gelar..."
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 bg-white"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              value={row.nip === '-' ? '' : row.nip}
                              onChange={(e) => handleUpdateBatchRowField(rIdx, 'nip', e.target.value)}
                              placeholder="NIP (opsional)"
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:border-purple-500 bg-white"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              value={row.nuptk === '-' ? '' : row.nuptk}
                              onChange={(e) => handleUpdateBatchRowField(rIdx, 'nuptk', e.target.value)}
                              placeholder="NUPTK (opsional)"
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:border-purple-500 bg-white"
                            />
                          </td>
                          <td className="py-1 px-1 text-center">
                            <select
                              value={row.jenisKelamin}
                              onChange={(e) => handleUpdateBatchRowField(rIdx, 'jenisKelamin', e.target.value)}
                              className="w-full px-1.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-center"
                            >
                              <option value="L">L</option>
                              <option value="P">P</option>
                            </select>
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              value={row.jabatan}
                              onChange={(e) => handleUpdateBatchRowField(rIdx, 'jabatan', e.target.value)}
                              placeholder="Guru Kelas"
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:border-purple-500 bg-white"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              value={row.mataPelajaran}
                              onChange={(e) => handleUpdateBatchRowField(rIdx, 'mataPelajaran', e.target.value)}
                              placeholder="Mapel yang diampu"
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:border-purple-500 bg-white"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <select
                              value={row.kelas}
                              onChange={(e) => handleUpdateBatchRowField(rIdx, 'kelas', e.target.value)}
                              className="w-full px-1.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
                            >
                              {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map(
                                (k) => (
                                  <option key={k} value={k}>
                                    Kelas {k}
                                  </option>
                                )
                              )}
                            </select>
                          </td>
                          <td className="py-1 px-1">
                            <select
                              value={row.status}
                              onChange={(e) => handleUpdateBatchRowField(rIdx, 'status', e.target.value)}
                              className="w-full px-1.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                            >
                              <option value="Honorer">Honorer</option>
                              <option value="PNS">PNS</option>
                              <option value="PPPK">PPPK</option>
                              <option value="Kontrak">Kontrak Daerah</option>
                              <option value="GTT">GTT</option>
                            </select>
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              value={row.golongan === '-' ? '' : row.golongan}
                              onChange={(e) => handleUpdateBatchRowField(rIdx, 'golongan', e.target.value)}
                              placeholder="III/a, IV/a"
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:border-purple-500 bg-white"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              value={row.pendidikan}
                              onChange={(e) => handleUpdateBatchRowField(rIdx, 'pendidikan', e.target.value)}
                              placeholder="S1 PGSD"
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:border-purple-500 bg-white"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              value={row.noHp === '-' ? '' : row.noHp}
                              onChange={(e) => handleUpdateBatchRowField(rIdx, 'noHp', e.target.value)}
                              placeholder="08..."
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:border-purple-500 bg-white"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              value={row.tempatLahir === '-' ? '' : row.tempatLahir}
                              onChange={(e) => handleUpdateBatchRowField(rIdx, 'tempatLahir', e.target.value)}
                              placeholder="Oksibil"
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:border-purple-500 bg-white"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="date"
                              value={row.tanggalLahir}
                              onChange={(e) => handleUpdateBatchRowField(rIdx, 'tanggalLahir', e.target.value)}
                              className="w-full px-1.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              value={row.agama}
                              onChange={(e) => handleUpdateBatchRowField(rIdx, 'agama', e.target.value)}
                              placeholder="Kristen"
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:border-purple-500 bg-white"
                            />
                          </td>

                          {/* Dynamic Custom Column Inputs per Row */}
                          {allCustomColumnKeys.map((cKey) => {
                            const val = row.customColumns?.[cKey] || '';
                            return (
                              <td key={cKey} className="py-1 px-1 bg-purple-50/20 border-l border-purple-100">
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => handleUpdateBatchRowField(rIdx, cKey, e.target.value)}
                                  placeholder={`Nilai ${cKey}...`}
                                  className="w-full px-2 py-1.5 border border-purple-200 rounded-lg text-xs focus:border-purple-500 bg-white text-purple-950"
                                />
                              </td>
                            );
                          })}

                          {/* Delete Row Button */}
                          <td className="py-1 px-1 text-center sticky right-0 bg-white z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                            <button
                              type="button"
                              onClick={() => handleDeleteBatchRow(rIdx)}
                              title="Hapus baris ini"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-white p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-600 font-medium">
                Terdapat <strong className="text-purple-700">{batchRows.length}</strong> baris di grid ({' '}
                {batchRows.filter((r) => r.namaGuru && r.namaGuru.trim().length > 0).length} baris terisi nama guru).
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-xs hover:bg-slate-50 text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveAllBatchRows}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold flex items-center gap-2 text-xs shadow-md cursor-pointer transition-all"
                >
                  <Save size={15} /> Simpan Semua Baris Guru ke Database
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MODAL TEMPEL (PASTE) DARI EXCEL / SPREADSHEET */}
      {/* ======================================================== */}
      {pasteModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-indigo-800 to-purple-800 p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ClipboardPaste size={16} /> Tempel Teks Tabel dari Excel / Spreadsheet
              </h3>
              <button
                type="button"
                onClick={() => setPasteModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Salin baris dan kolom dari Microsoft Excel, Google Sheets, atau aplikasi tabel lainnya (Ctrl+C), lalu tempel
                (Ctrl+V) di dalam kotak teks di bawah ini. Aplikasi akan mendeteksi seluruh baris dan kolom secara otomatis
                tanpa batasan.
              </p>

              <textarea
                rows={8}
                value={pasteRawText}
                onChange={(e) => setPasteRawText(e.target.value)}
                placeholder="Tempel baris tabel di sini... (Contoh: Nama Guru [Tab] NIP [Tab] JK [Tab] Jabatan [Tab] ...)"
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-slate-50"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500">
                  {pasteRawText.split(/\r?\n/).filter((l) => l.trim().length > 0).length} baris terdeteksi
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPasteRawText('');
                      setPasteModalOpen(false);
                    }}
                    className="px-4 py-2 border border-slate-300 rounded-xl font-medium text-xs hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessPasteData}
                    className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check size={14} /> Masukkan ke Grid Baris
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MODAL ATUR TAMPILAN KOLOM (COLUMN SELECTOR) */}
      {/* ======================================================== */}
      {columnSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Columns size={16} /> Pengaturan Tampilan Kolom Data Guru
              </h3>
              <button
                type="button"
                onClick={() => setColumnSelectorOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <p className="text-slate-500 text-[11px]">
                Centang kolom yang ingin ditampilkan pada tabel utama. Kolom dan baris tidak dibatasi, Anda dapat
                mengaktifkan seluruh kolom sekaligus.
              </p>

              <div className="flex items-center justify-between gap-2 pb-2 border-b">
                <span className="font-bold text-slate-800">Daftar Kolom Standar & Kustom:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShowAllColumns}
                    className="px-2 py-1 bg-purple-100 text-purple-800 hover:bg-purple-200 rounded font-bold text-[10px]"
                  >
                    Pilih Semua
                  </button>
                  <button
                    type="button"
                    onClick={handleResetColumns}
                    className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded font-semibold text-[10px]"
                  >
                    Reset Standar
                  </button>
                </div>
              </div>

              {/* Base Columns Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BASE_COLUMNS.map((col) => {
                  const isChecked = !!visibleColumns[col.key];
                  return (
                    <label
                      key={col.key}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-purple-300 bg-purple-50/50 text-slate-900 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleColumnVisibility(col.key)}
                        className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                      />
                      <span className="truncate">{col.label}</span>
                    </label>
                  );
                })}
              </div>

              {/* Dynamic Custom Columns Checkboxes */}
              {allCustomColumnKeys.length > 0 && (
                <div className="pt-3 border-t">
                  <span className="font-bold text-purple-900 block mb-2">Kolom Kustom Tambahan:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allCustomColumnKeys.map((cKey) => {
                      const isChecked = visibleColumns[cKey] !== false;
                      return (
                        <label
                          key={cKey}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-colors ${
                            isChecked
                              ? 'border-indigo-300 bg-indigo-50/50 text-indigo-950 font-semibold'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleColumnVisibility(cKey)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <span className="truncate flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 inline-block"></span>
                            {cKey}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 border-t flex justify-end">
              <button
                type="button"
                onClick={() => setColumnSelectorOpen(false)}
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs shadow-md"
              >
                Selesai & Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL FORMULIR LENGKAP 1 GURU (DENGAN KOLOM KUSTOM) */}
      {/* ======================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-purple-800 to-indigo-800 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Users size={18} /> {editingGuru ? 'Edit Data Guru' : 'Tambah Guru Baru (Formulir Lengkap)'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-white/80 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitSingle} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {/* 1. NAMA LENGKAP & GELAR GURU */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 mb-1 text-xs">
                    Nama Lengkap & Gelar Guru <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.namaGuru}
                    onChange={(e) => setFormData({ ...formData, namaGuru: e.target.value })}
                    placeholder="Contoh: Selpius Nabyal, S.Pd.Gr."
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">Jenis Kelamin</label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={(e: any) => setFormData({ ...formData, jenisKelamin: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white font-bold"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              {/* 2. NIP & NUPTK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-800 text-xs">NIP (Nomor Induk Pegawai)</label>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      Opsional / &apos;-&apos;
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.nip === '-' ? '' : formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    placeholder="Contoh: 19950312 202102 1 005"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-800 text-xs">NUPTK</label>
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                      Opsional
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.nuptk === '-' ? '' : formData.nuptk || ''}
                    onChange={(e) => setFormData({ ...formData, nuptk: e.target.value })}
                    placeholder="Contoh: 16-digit NUPTK resmi"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>
              </div>

              {/* 3. TEMPAT, TANGGAL LAHIR, AGAMA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    value={formData.tempatLahir === '-' ? '' : formData.tempatLahir}
                    onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                    placeholder="Oksibil / Balil"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formData.tanggalLahir}
                    onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Agama</label>
                  <input
                    type="text"
                    value={formData.agama || 'Kristen'}
                    onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                    placeholder="Kristen / Katolik / Islam"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              {/* 4. PENDIDIKAN & JURUSAN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pendidikan Terakhir</label>
                  <input
                    type="text"
                    value={formData.pendidikan}
                    onChange={(e) => setFormData({ ...formData, pendidikan: e.target.value })}
                    placeholder="S1 PGSD / S1 Pendidikan"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jurusan / Program Studi</label>
                  <input
                    type="text"
                    value={formData.jurusan || ''}
                    onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                    placeholder="Pendidikan Guru Sekolah Dasar"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              {/* 5. JABATAN, KELAS, STATUS, GOLONGAN */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="block font-semibold text-slate-700 mb-1">Jabatan Guru</label>
                  <input
                    type="text"
                    value={formData.jabatan}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    placeholder="Guru Kelas / Wali Kelas"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas Binaan</label>
                  <select
                    value={formData.kelas}
                    onChange={(e: any) => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  >
                    <optgroup label="── SD / MI (Kelas 1-6) ──">
                      {['I', 'II', 'III', 'IV', 'V', 'VI'].map((k) => (
                        <option key={k} value={k}>
                          Kelas {k} (SD)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="── SMP / MTs (Kelas 7-9) ──">
                      {['VII', 'VIII', 'IX'].map((k) => (
                        <option key={k} value={k}>
                          Kelas {k} (SMP)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="── SMA / MA / SMK (Kelas 10-12) ──">
                      {['X', 'XI', 'XII'].map((k) => (
                        <option key={k} value={k}>
                          Kelas {k} (SMA/SMK)
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Kepegawaian</label>
                  <select
                    value={formData.status}
                    onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="Honorer">Honorer</option>
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="Kontrak">Kontrak Daerah</option>
                    <option value="GTT">GTT</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pangkat / Golongan</label>
                  <input
                    type="text"
                    value={formData.golongan === '-' ? '' : formData.golongan || ''}
                    onChange={(e) => setFormData({ ...formData, golongan: e.target.value })}
                    placeholder="III/a, III/b, IV/a"
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* 6. MAPEL, TUGAS TAMBAHAN & KONTAK */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran yang Diampu</label>
                  <input
                    type="text"
                    value={formData.mataPelajaran}
                    onChange={(e) => setFormData({ ...formData, mataPelajaran: e.target.value })}
                    placeholder="Bahasa Indonesia, Matematika, dll"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tugas Tambahan</label>
                  <input
                    type="text"
                    value={formData.tugasTambahan === '-' ? '' : formData.tugasTambahan || ''}
                    onChange={(e) => setFormData({ ...formData, tugasTambahan: e.target.value })}
                    placeholder="Operator Dapodik, Bendahara, dll"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor HP / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.noHp === '-' ? '' : formData.noHp}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    placeholder="08XXXXXXXXXX"
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* 7. EMAIL, ALAMAT, KETERANGAN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email === '-' ? '' : formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="guru@sekolah.sch.id"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Alamat Domisili</label>
                  <input
                    type="text"
                    value={formData.alamat === '-' ? '' : formData.alamat || ''}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    placeholder="Alamat tempat tinggal"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Keterangan / Catatan</label>
                  <input
                    type="text"
                    value={formData.keterangan || ''}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    placeholder="Catatan kepegawaian lain"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              {/* 8. BAGIAN KOLOM KUSTOM BEBAS PADA FORMULIR */}
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-purple-900 flex items-center gap-1.5 text-xs">
                    <PlusCircle size={14} /> Kolom / Atribut Kustom Tambahan (Tanpa Batas):
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Tambahkan informasi khusus apa pun yang diperlukan satuan pendidikan.
                  </span>
                </div>

                {/* Display existing custom fields for this teacher */}
                {formData.customColumns && Object.keys(formData.customColumns).length > 0 && (
                  <div className="space-y-2 mb-3 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                    {Object.entries(formData.customColumns).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="w-32 font-bold text-purple-950 truncate">{key}:</span>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customColumns: {
                                ...(formData.customColumns || {}),
                                [key]: e.target.value
                              }
                            })
                          }
                          className="flex-1 px-3 py-1.5 border border-purple-200 rounded-lg text-xs bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomFieldFromForm(key)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                          title="Hapus kolom ini dari data guru"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new custom field row */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={modalCustomKey}
                    onChange={(e) => setModalCustomKey(e.target.value)}
                    placeholder="Nama Kolom Kustom (cth: Sertifikasi Pendidik)"
                    className="w-1/2 px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white"
                  />
                  <input
                    type="text"
                    value={modalCustomVal}
                    onChange={(e) => setModalCustomVal(e.target.value)}
                    placeholder="Isi Nilai Kolom"
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomFieldToForm}
                    className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus size={13} /> Tambah Kolom
                  </button>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Data Guru Otomatis Terhubung dengan Rapor & Cetak
                </span>
                <div className="flex items-center gap-2">
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
                    className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold flex items-center gap-1.5 text-xs shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Save size={14} /> {editingGuru ? 'Update Data Guru' : 'Simpan Data Guru'}
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
