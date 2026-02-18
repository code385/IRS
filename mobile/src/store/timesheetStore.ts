import { create } from 'zustand';
import {
  saveDayDraft as firebaseSaveDayDraft,
  submitWeek as firebaseSubmitWeek,
  setWeekStatus as firebaseSetWeekStatus,
  getWeeksByEmployee,
  getWeeksByStatus,
  getAllWeeks,
} from '../services/firebaseTimesheets';
import { getUserById } from '../services/firebaseUsers';

export type TimesheetStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';

export interface DayDraft {
  id: string;
  label: string;
  hours: number;
  jobNo?: string;
  location?: string;
  shiftType?: string;
  lunchTaken?: string;
  livingAway?: string;
  startTime?: string;
  finishTime?: string;
  description?: string;
}

export interface WeekTimesheet {
  id: string;
  label: string;
  weekStart: string;
  status: TimesheetStatus;
  employeeId: string;
  employeeName?: string;
  days: DayDraft[];
  rejectionComment?: string;
}

interface TimesheetState {
  weeks: WeekTimesheet[];
  isLoading: boolean;
  loadWeeks: (employeeId?: string) => Promise<void>;
  loadWeeksByStatus: (status: TimesheetStatus) => Promise<void>;
  saveDayDraft: (
    userId: string,
    weekId: string,
    weekLabel: string,
    weekStart: string,
    day: DayDraft
  ) => Promise<void>;
  submitWeek: (weekId: string) => Promise<void>;
  setWeekStatus: (weekId: string, status: TimesheetStatus, rejectionComment?: string) => Promise<void>;
}

const enrichWeeksWithEmployeeNames = async (
  weeks: WeekTimesheet[]
): Promise<WeekTimesheet[]> => {
  const enriched = await Promise.all(
    weeks.map(async (week) => {
      if (week.employeeName) return week;
      try {
        const user = await getUserById(week.employeeId);
        return { ...week, employeeName: user?.name || 'Unknown' };
      } catch {
        return { ...week, employeeName: 'Unknown' };
      }
    })
  );
  return enriched;
};

export const useTimesheetStore = create<TimesheetState>((set, get) => ({
  weeks: [],
  isLoading: false,
  loadWeeks: async (employeeId?: string) => {
    set({ isLoading: true });
    try {
      let weeks: WeekTimesheet[];
      if (employeeId) {
        weeks = await getWeeksByEmployee(employeeId);
      } else {
        weeks = await getAllWeeks();
      }
      const enriched = await enrichWeeksWithEmployeeNames(weeks);
      set({ weeks: enriched, isLoading: false });
    } catch (error) {
      console.error('Error loading weeks:', error);
      set({ isLoading: false });
    }
  },
  loadWeeksByStatus: async (status: TimesheetStatus) => {
    set({ isLoading: true });
    try {
      const weeks = await getWeeksByStatus(status);
      const enriched = await enrichWeeksWithEmployeeNames(weeks);
      set({ weeks: enriched, isLoading: false });
    } catch (error) {
      console.error('Error loading weeks by status:', error);
      set({ isLoading: false });
    }
  },
  saveDayDraft: async (
    userId: string,
    weekId: string,
    weekLabel: string,
    weekStart: string,
    day: DayDraft
  ) => {
    try {
      await firebaseSaveDayDraft(userId, weekId, weekLabel, weekStart, day);
      await get().loadWeeks(userId);
    } catch (error) {
      console.error('Error saving day draft:', error);
      throw error;
    }
  },
  submitWeek: async (weekId: string) => {
    try {
      await firebaseSubmitWeek(weekId);
      await get().loadWeeks();
    } catch (error) {
      console.error('Error submitting week:', error);
      throw error;
    }
  },
  setWeekStatus: async (weekId: string, status: TimesheetStatus, rejectionComment?: string) => {
    try {
      await firebaseSetWeekStatus(weekId, status, rejectionComment);
      await get().loadWeeks();
    } catch (error) {
      console.error('Error setting week status:', error);
      throw error;
    }
  },
}));
