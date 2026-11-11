/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

// Sections
import { DashboardSection } from './components/sections/DashboardSection';
import { SchoolIdentitySection } from './components/sections/SchoolIdentitySection';
import { TeacherSection } from './components/sections/TeacherSection';
import { StudentSection } from './components/sections/StudentSection';
import { ClassSection } from './components/sections/ClassSection';
import { SubjectSection } from './components/sections/SubjectSection';
import { KkmSection } from './components/sections/KkmSection';
import { LearningObjectiveSection } from './components/sections/LearningObjectiveSection';
import { AcademicScoreSection } from './components/sections/AcademicScoreSection';
import { AcademicRecapSection } from './components/sections/AcademicRecapSection';
import { ReportDescriptionSection } from './components/sections/ReportDescriptionSection';
import { ExtracurricularSection } from './components/sections/ExtracurricularSection';
import { AttendanceSection } from './components/sections/AttendanceSection';
import { TeacherNoteSection } from './components/sections/TeacherNoteSection';
import { PtsReportViewSection } from './components/sections/PtsReportViewSection';
import { AcademicReportViewSection } from './components/sections/AcademicReportViewSection';
import { P5ProjectSection } from './components/sections/P5ProjectSection';
import { P5StagesSection } from './components/sections/P5StagesSection';
import { P5DimensionSection } from './components/sections/P5DimensionSection';
import { P5ScoreSection } from './components/sections/P5ScoreSection';
import { P5ReportViewSection } from './components/sections/P5ReportViewSection';
import { ReportSummarySection } from './components/sections/ReportSummarySection';
import { PiagamSection } from './components/sections/PiagamSection';
import { TemplateDataSection } from './components/sections/TemplateDataSection';
import { PrintReportSection } from './components/sections/PrintReportSection';
import { SettingsSection } from './components/sections/SettingsSection';
import { BackupRestoreSection } from './components/sections/BackupRestoreSection';
import { UserGuideSection } from './components/sections/UserGuideSection';
import { SaveNotificationToast } from './components/common/SaveNotificationToast';
import { ReportPreviewModal } from './components/modals/ReportPreviewModal';

const MainContent: React.FC = () => {
  const {
    activeMenu,
    displayMode,
    isReportPreviewModalOpen,
    setIsReportPreviewModalOpen
  } = useApp();

  const renderSection = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <DashboardSection />;
      case 'identitas_sekolah':
        return <SchoolIdentitySection />;
      case 'data_guru':
        return <TeacherSection />;
      case 'data_siswa':
        return <StudentSection />;
      case 'data_kelas':
        return <ClassSection />;
      case 'mata_pelajaran':
        return <SubjectSection />;
      case 'kkm_pelajaran':
        return <KkmSection />;
      case 'tujuan_pembelajaran':
        return <LearningObjectiveSection />;
      case 'input_nilai':
        return <AcademicScoreSection />;
      case 'rekap_nilai':
        return <AcademicRecapSection />;
      case 'deskripsi_rapor':
        return <ReportDescriptionSection />;
      case 'ekstrakurikuler':
        return <ExtracurricularSection />;
      case 'kehadiran':
        return <AttendanceSection />;
      case 'catatan_wali':
        return <TeacherNoteSection />;
      case 'rapor_pts':
        return <PtsReportViewSection />;
      case 'rapor_semester_1':
        return <AcademicReportViewSection forcedSemester="Ganjil" />;
      case 'rapor_semester_2':
        return <AcademicReportViewSection forcedSemester="Genap" />;
      case 'rapor_akademik':
        return <AcademicReportViewSection />;
      case 'p5_projek':
        return <P5ProjectSection />;
      case 'p5_tahapan':
        return <P5StagesSection />;
      case 'p5_dimensi':
        return <P5DimensionSection />;
      case 'p5_nilai':
        return <P5ScoreSection />;
      case 'rapor_p5':
        return <P5ReportViewSection />;
      case 'rekap_rapor':
        return <ReportSummarySection />;
      case 'piagam':
        return <PiagamSection />;
      case 'template_data':
        return <TemplateDataSection />;
      case 'cetak_rapor_semester_1':
        return <PrintReportSection forcedSemester="Ganjil" />;
      case 'cetak_rapor_semester_2':
        return <PrintReportSection forcedSemester="Genap" />;
      case 'cetak_rapor':
        return <PrintReportSection />;
      case 'pengaturan':
        return <SettingsSection />;
      case 'backup_restore':
        return <BackupRestoreSection />;
      case 'buku_panduan':
        return <UserGuideSection />;
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased print:bg-white print:h-auto print:min-h-0 print:block">
      <Header />
      <div className="flex flex-1 overflow-hidden print:overflow-visible print:h-auto print:block">
        <Sidebar />
        <main
          className={`flex-1 overflow-y-auto h-[calc(100vh-89px)] print:overflow-visible print:h-auto print:block print:p-0 print:m-0 print:w-full print:max-w-none print:bg-white ${
            displayMode === 'full'
              ? 'p-2 sm:p-4'
              : displayMode === 'hp'
              ? 'p-2 sm:p-3 bg-slate-200/50'
              : 'p-4 sm:p-6 lg:p-8'
          }`}
        >
          <div
            className={`${
              displayMode === 'full'
                ? 'max-w-none w-full'
                : displayMode === 'hp'
                ? 'max-w-3xl mx-auto'
                : 'max-w-7xl mx-auto'
            } print:max-w-none print:w-full print:p-0 print:m-0 print:bg-white`}
          >
            {renderSection()}
          </div>
        </main>
      </div>
      <SaveNotificationToast />
      <ReportPreviewModal
        isOpen={isReportPreviewModalOpen}
        onClose={() => setIsReportPreviewModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
