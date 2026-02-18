import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { DayDraft, WeekTimesheet, TimesheetStatus } from '../store/timesheetStore';

const COLLECTION_TIMESHEETS = 'timesheets';

export async function saveDayDraft(
  userId: string,
  weekId: string,
  weekLabel: string,
  weekStart: string,
  day: DayDraft
): Promise<void> {
  const weekRef = doc(db, COLLECTION_TIMESHEETS, weekId);
  const weekDoc = await getDoc(weekRef);
  
  const existingDays = weekDoc.exists() ? (weekDoc.data().days || []) : [];
  const dayIndex = existingDays.findIndex((d: DayDraft) => d.id === day.id);
  
  let updatedDays: DayDraft[];
  if (dayIndex === -1) {
    updatedDays = [...existingDays, day];
  } else {
    updatedDays = [...existingDays];
    updatedDays[dayIndex] = day;
  }
  
  const weekData: Partial<WeekTimesheet> = {
    id: weekId,
    label: weekLabel,
    weekStart,
    status: 'Draft',
    employeeId: userId,
    days: updatedDays,
    updatedAt: Timestamp.now(),
  };
  
  if (!weekDoc.exists()) {
    weekData.createdAt = Timestamp.now();
  }
  
  await setDoc(weekRef, weekData, { merge: true });
}

export async function submitWeek(weekId: string): Promise<void> {
  const weekRef = doc(db, COLLECTION_TIMESHEETS, weekId);
  await updateDoc(weekRef, {
    status: 'Submitted',
    submittedAt: Timestamp.now(),
  });
}

export async function setWeekStatus(
  weekId: string,
  status: TimesheetStatus,
  rejectionComment?: string
): Promise<void> {
  const weekRef = doc(db, COLLECTION_TIMESHEETS, weekId);
  const updateData: any = { status };
  
  if (status === 'Approved' || status === 'Rejected') {
    updateData.reviewedAt = Timestamp.now();
  }
  if (status === 'Rejected' && rejectionComment?.trim()) {
    updateData.rejectionComment = rejectionComment.trim();
  }
  
  await updateDoc(weekRef, updateData);
}

export async function getWeeksByEmployee(employeeId: string): Promise<WeekTimesheet[]> {
  try {
    const q = query(
      collection(db, COLLECTION_TIMESHEETS),
      where('employeeId', '==', employeeId),
      orderBy('weekStart', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as WeekTimesheet[];
  } catch (error: any) {
    // If orderBy fails (index not created), try without orderBy
    if (error.code === 'failed-precondition') {
      console.warn('Firestore index missing, fetching without orderBy');
      const q = query(
        collection(db, COLLECTION_TIMESHEETS),
        where('employeeId', '==', employeeId)
      );
      const snapshot = await getDocs(q);
      const weeks = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as WeekTimesheet[];
      // Sort manually
      return weeks.sort((a, b) => {
        const dateA = a.weekStart.split('/').reverse().join('-');
        const dateB = b.weekStart.split('/').reverse().join('-');
        return dateB.localeCompare(dateA);
      });
    }
    throw error;
  }
}

export async function getWeeksByStatus(status: TimesheetStatus): Promise<WeekTimesheet[]> {
  try {
    const q = query(
      collection(db, COLLECTION_TIMESHEETS),
      where('status', '==', status),
      orderBy('weekStart', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as WeekTimesheet[];
  } catch (error: any) {
    // If orderBy fails (index not created), try without orderBy
    if (error.code === 'failed-precondition') {
      console.warn('Firestore index missing, fetching without orderBy');
      const q = query(
        collection(db, COLLECTION_TIMESHEETS),
        where('status', '==', status)
      );
      const snapshot = await getDocs(q);
      const weeks = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as WeekTimesheet[];
      // Sort manually
      return weeks.sort((a, b) => {
        const dateA = a.weekStart.split('/').reverse().join('-');
        const dateB = b.weekStart.split('/').reverse().join('-');
        return dateB.localeCompare(dateA);
      });
    }
    throw error;
  }
}

export async function getAllWeeks(): Promise<WeekTimesheet[]> {
  try {
    const q = query(
      collection(db, COLLECTION_TIMESHEETS),
      orderBy('weekStart', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as WeekTimesheet[];
  } catch (error: any) {
    // If orderBy fails (index not created), try without orderBy
    if (error.code === 'failed-precondition') {
      console.warn('Firestore index missing, fetching without orderBy');
      const snapshot = await getDocs(collection(db, COLLECTION_TIMESHEETS));
      const weeks = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as WeekTimesheet[];
      // Sort manually
      return weeks.sort((a, b) => {
        const dateA = a.weekStart.split('/').reverse().join('-');
        const dateB = b.weekStart.split('/').reverse().join('-');
        return dateB.localeCompare(dateA);
      });
    }
    throw error;
  }
}

export async function getWeekById(weekId: string): Promise<WeekTimesheet | null> {
  const weekRef = doc(db, COLLECTION_TIMESHEETS, weekId);
  const weekDoc = await getDoc(weekRef);
  
  if (!weekDoc.exists()) return null;
  
  return {
    ...weekDoc.data(),
    id: weekDoc.id,
  } as WeekTimesheet;
}
