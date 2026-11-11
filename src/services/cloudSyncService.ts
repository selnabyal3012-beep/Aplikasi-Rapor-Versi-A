import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { DatabaseState } from '../types';

const SCHOOL_DOC_ID = 'sdn_balil_current';

export interface CloudSyncResult {
  success: boolean;
  message: string;
  timestamp?: string;
}

/**
 * Save current DatabaseState to Firebase Firestore
 */
export async function saveStateToFirestore(state: DatabaseState, userEmail?: string): Promise<CloudSyncResult> {
  const path = `schools/${SCHOOL_DOC_ID}/state/current`;
  try {
    const docRef = doc(db, 'schools', SCHOOL_DOC_ID, 'state', 'current');
    const nowIso = new Date().toISOString();
    
    // Save serialized state payload with metadata
    await setDoc(docRef, {
      id: 'current',
      schoolId: state.sekolah?.npsn || '60301140',
      namaSekolah: state.sekolah?.namaSekolah || 'SD NEGERI BALIL',
      tahunPelajaran: state.sekolah?.tahunPelajaran || '2026/2027',
      updatedAt: nowIso,
      updatedBy: userEmail || 'Guru / Operator Balil',
      payloadJson: JSON.stringify(state),
      serverTime: serverTimestamp()
    });

    // Also write to backups subcollection as a recovery point
    const backupId = `backup_${nowIso.replace(/[:.]/g, '-')}`;
    const backupRef = doc(db, 'schools', SCHOOL_DOC_ID, 'backups', backupId);
    await setDoc(backupRef, {
      id: backupId,
      schoolId: state.sekolah?.npsn || '60301140',
      updatedAt: nowIso,
      updatedBy: userEmail || 'Guru / Operator Balil',
      payloadJson: JSON.stringify(state),
      serverTime: serverTimestamp()
    });

    return {
      success: true,
      message: 'Data berhasil disinkronkan ke Cloud Firebase Firestore!',
      timestamp: nowIso
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load DatabaseState from Firebase Firestore
 */
export async function loadStateFromFirestore(): Promise<{ success: boolean; data?: DatabaseState; message: string }> {
  const path = `schools/${SCHOOL_DOC_ID}/state/current`;
  try {
    const docRef = doc(db, 'schools', SCHOOL_DOC_ID, 'state', 'current');
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return {
        success: false,
        message: 'Belum ada data di cloud Firestore untuk sekolah ini.'
      };
    }

    const docData = snapshot.data();
    if (!docData?.payloadJson) {
      return {
        success: false,
        message: 'Format data di cloud Firestore tidak valid.'
      };
    }

    const parsedState: DatabaseState = JSON.parse(docData.payloadJson);
    return {
      success: true,
      data: parsedState,
      message: `Data berhasil dimuat dari Cloud Firestore! (Terakhir diperbarui: ${docData.updatedAt || '-'})`
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * List backups from Firestore
 */
export async function listCloudBackups(): Promise<Array<{ id: string; updatedAt: string; updatedBy: string }>> {
  const path = `schools/${SCHOOL_DOC_ID}/backups`;
  try {
    const colRef = collection(db, 'schools', SCHOOL_DOC_ID, 'backups');
    const snapshot = await getDocs(colRef);
    const backups: Array<{ id: string; updatedAt: string; updatedBy: string }> = [];

    snapshot.forEach((d) => {
      const data = d.data();
      backups.push({
        id: d.id,
        updatedAt: data.updatedAt || '-',
        updatedBy: data.updatedBy || '-'
      });
    });

    return backups.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
