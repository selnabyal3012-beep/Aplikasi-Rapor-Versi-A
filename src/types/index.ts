export type FaseType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type SemesterType = 'Ganjil' | 'Genap' | '1' | '2';
export type ClassLevel =
  // SD / MI
  | 'I'
  | 'II'
  | 'III'
  | 'IV'
  | 'V'
  | 'VI'
  // SMP / MTs
  | 'VII'
  | 'VIII'
  | 'IX'
  // SMA / MA & SMK / MAK
  | 'X'
  | 'XI'
  | 'XII'
  | 'XIII';

export const SD_CLASSES: ClassLevel[] = ['I', 'II', 'III', 'IV', 'V', 'VI'];
export const SMP_CLASSES: ClassLevel[] = ['VII', 'VIII', 'IX'];
export const SMA_CLASSES: ClassLevel[] = ['X', 'XI', 'XII'];
export const SMK_CLASSES: ClassLevel[] = ['X', 'XI', 'XII', 'XIII'];
export const ALL_CLASSES: ClassLevel[] = [
  'I', 'II', 'III', 'IV', 'V', 'VI',
  'VII', 'VIII', 'IX',
  'X', 'XI', 'XII', 'XIII'
];

export interface SchoolIdentity {
  idSekolah?: string;
  namaPemerintah: string;
  namaInstansi: string;
  logoKiriUrl?: string;
  logoKananUrl?: string;
  npsn: string;
  namaSekolah: string;
  nss: string;
  fase?: FaseType | string;
  kelas?: ClassLevel | string;
  rombel?: string;
  waliKelas?: string;
  nipWaliKelas?: string;
  alamat: string;
  desaKelurahan: string;
  distrikKecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  telepon?: string;
  emailSekolah?: string;
  website?: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  tahunPelajaran: string;
  semester: SemesterType;
  logoUrl?: string;
  tempatRapor: string;
  tanggalRapor: string;
}

export interface Teacher {
  idGuru: string;
  nip: string;
  namaGuru: string;
  jenisKelamin: 'L' | 'P';
  tempatLahir: string;
  tanggalLahir: string;
  pendidikan: string;
  jabatan: string;
  mataPelajaran: string;
  kelas: ClassLevel;
  status: 'PNS' | 'PPPK' | 'Honorer' | string;
  noHp: string;
  // Kolom fleksibel tambahan tanpa batasan
  nuptk?: string;
  agama?: string;
  jurusan?: string;
  tugasTambahan?: string;
  golongan?: string;
  email?: string;
  alamat?: string;
  keterangan?: string;
  customColumns?: Record<string, string>;
  [key: string]: any;
}

export interface Student {
  idSiswa: string;
  nisn: string;
  nis: string;
  namaSiswa: string;
  jenisKelamin: 'L' | 'P';
  tempatLahir: string;
  tanggalLahir: string;
  nik: string;
  agama: 'Kristen' | 'Katolik' | 'Islam' | 'Hindu' | 'Buddha' | 'Konghucu' | 'Khonghucu' | string;
  kelas: ClassLevel;
  fase: FaseType;
  semester: SemesterType;
  tahunPelajaran: string;
  namaAyah: string;
  namaIbu: string;
  alamat: string;
  statusSiswa: 'Aktif' | 'Mutasi' | 'Lulus';
  fotoUrl?: string;
  pekerjaanAyah?: string;
  pekerjaanIbu?: string;
  namaWali?: string;
  pekerjaanWali?: string;
  alamatWali?: string;
  telepon?: string;
  sekolahAsal?: string;
  diterimaKelas?: string;
  diterimaTanggal?: string;
}

export interface ClassData {
  idKelas: string;
  namaKelas: ClassLevel;
  fase: FaseType;
  waliKelas: string;
  tahunPelajaran: string;
  semester: SemesterType;
  jumlahSiswa: number;
}

export interface Subject {
  kode?: string;
  mataPelajaran: string;
  kelompok: 'Wajib' | 'Pilihan' | 'Muatan Lokal';
  urutan: number;
  kkm?: number;
  kompleksitas?: number;
  dayaDukung?: number;
  intake?: number;
}

export interface LearningObjective {
  id: string;
  kodeTp: string;
  mataPelajaran: string;
  fase: FaseType;
  kelas: ClassLevel;
  tujuanPembelajaran: string;
  agama?: 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Khonghucu' | 'Semua' | string;
}

export interface AcademicScore {
  idNilai: string;
  tahunPelajaran: string;
  semester: SemesterType;
  kelas: ClassLevel;
  nisn: string;
  namaSiswa: string;
  mataPelajaran: string;
  kkm?: number;
  // Detail penilaian
  formatif: number;
  sumatif: number;
  ph1?: number;
  ph2?: number;
  ph3?: number;
  pts?: number;
  pas?: number;
  praktik?: number;
  nilaiAkhir: number;
  predikat: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan';
  capaianKompetensi: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Pendampingan';
  deskripsiTercapai: string;
  deskripsiPerluPeningkatan: string;
  deskripsiRapor: string;
}

export interface Extracurricular {
  id: string;
  nisn: string;
  namaSiswa: string;
  kelas: ClassLevel;
  semester: SemesterType;
  tahunPelajaran: string;
  jenisEkstrakurikuler: string;
  predikat: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan';
  keterangan: string;
}

export interface Attendance {
  id: string;
  nisn: string;
  namaSiswa: string;
  kelas: ClassLevel;
  semester: SemesterType;
  tahunPelajaran: string;
  sakit: number;
  izin: number;
  alpa: number;
  totalHari: number;
}

export interface TeacherNote {
  id: string;
  nisn: string;
  namaSiswa: string;
  kelas: ClassLevel;
  semester: SemesterType;
  tahunPelajaran: string;
  catatanWaliKelas: string;
}

export interface P5Project {
  idProjek: string;
  namaProjek: string;
  tema: string;
  fase: FaseType;
  kelas: ClassLevel;
  tahunPelajaran: string;
  semester: SemesterType;
  deskripsiProjek: string;
}

export interface P5Stage {
  id: string;
  idProjek: string;
  tahap: 'Pengenalan' | 'Kontekstualisasi' | 'Aksi' | 'Refleksi' | 'Tindak Lanjut';
  kegiatan: string;
  tanggal: string;
}

export type P5Predicate = 'BB' | 'MB' | 'BSH' | 'SB';

export interface P5DimensionItem {
  id: string;
  dimensi: string;
  elemen: string;
  subElemen: string;
}

export interface P5Score {
  id: string;
  idProjek: string;
  nisn: string;
  namaSiswa: string;
  kelas: ClassLevel;
  semester: SemesterType;
  tahunPelajaran: string;
  dimensi: string;
  elemen: string;
  capaian: P5Predicate;
  deskripsi: string;
}

export interface UserAccount {
  username: string;
  password: string;
  namaLengkap: string;
  role: 'Administrator' | 'Wali Kelas' | 'Guru Mapel' | 'Kepala Sekolah';
  nip?: string;
  createdAt: string;
}

export interface PiagamAward {
  idPiagam: string;
  nomorPiagam: string;
  nisn: string;
  namaSiswa: string;
  kelas: ClassLevel;
  semester: SemesterType;
  tahunPelajaran: string;
  kategoriPrestasi: string;
  judulPenghargaan: string;
  keterangan: string;
  peringkat?: number;
  nilaiRataRata?: number;
  tanggalPenetapan: string;
  tempatPenetapan: string;
  temaBingkai: 'gold' | 'navy' | 'emerald';
}

export interface StudentDecision {
  id?: string;
  nisn: string;
  namaSiswa?: string;
  kelas: ClassLevel;
  semester: SemesterType;
  tahunPelajaran: string;
  statusKeputusan: 'Naik Kelas' | 'Tinggal di Kelas' | 'Lulus' | 'Belum Ditetapkan';
  naikKelas: string;
  tinggalKelas: string;
  keteranganTambahan?: string;
}

export interface DatabaseState {
  sekolah: SchoolIdentity;
  guru: Teacher[];
  siswa: Student[];
  kelas: ClassData[];
  mataPelajaran: Subject[];
  tujuanPembelajaran: LearningObjective[];
  nilaiAkademik: AcademicScore[];
  ekstrakurikuler: Extracurricular[];
  kehadiran: Attendance[];
  catatanWali: TeacherNote[];
  p5Projek: P5Project[];
  p5Tahapan: P5Stage[];
  p5Dimensi: P5DimensionItem[];
  p5Nilai: P5Score[];
  users: UserAccount[];
  piagam?: PiagamAward[];
  keputusanSiswa?: StudentDecision[];
}

export function getFaseFromKelas(kelas: ClassLevel | string): FaseType {
  if (kelas === 'I' || kelas === 'II') return 'A';
  if (kelas === 'III' || kelas === 'IV') return 'B';
  if (kelas === 'V' || kelas === 'VI') return 'C';
  if (kelas === 'VII' || kelas === 'VIII' || kelas === 'IX') return 'D';
  if (kelas === 'X') return 'E';
  if (kelas === 'XI' || kelas === 'XII' || kelas === 'XIII') return 'F';
  return 'B';
}

export function getNextClass(current: ClassLevel | string): string {
  switch (current) {
    case 'I':
      return 'II (Dua)';
    case 'II':
      return 'III (Tiga)';
    case 'III':
      return 'IV (Empat)';
    case 'IV':
      return 'V (Lima)';
    case 'V':
      return 'VI (Enam)';
    case 'VI':
      return 'Lulus / Lanjut ke SMP (Fase D)';
    case 'VII':
      return 'VIII (Delapan)';
    case 'VIII':
      return 'IX (Sembilan)';
    case 'IX':
      return 'Lulus / Lanjut ke SMA (Fase E)';
    case 'X':
      return 'XI (Sebelas)';
    case 'XI':
      return 'XII (Dua Belas)';
    case 'XII':
      return 'Lulus';
    default:
      return 'Naik ke Kelas Berikutnya';
  }
}

export type ActionToolbarMode = 'full' | 'compact' | 'hidden';
