export interface GeoPunchRecord {
  id: string;
  timestamp: string;
  type: 'IN' | 'OUT';
  verifiedBy: string;
  latitude: number;
  longitude: number;
  isWithinGeofence: boolean;
  unitName: string;
}

export interface DayAttendance {
  date: string;
  status: 'PRESENT' | 'HALF_DAY' | 'ABSENT' | 'LEAVE' | 'WEEKLY_OFF' | 'HOLIDAY' | 'UPCOMING';
  inTime?: string;
  outTime?: string;
  shiftName?: string;
  totalHours?: string;
  inImageUrl?: string;
  outImageUrl?: string;
  distance?: string;
  address?: string;
  unitCoords?: string;
  empCoords?: string;
  holidayName?: string;
}

export interface SalaryBreakdown {
  basic: number;
  hra: number;
  conveyance: number;
  specialAllowance: number;
  overtime: number;
  grossEarnings: number;
  pfDeduction: number;
  esicDeduction: number;
  professionalTax: number;
  tdsDeduction: number;
  totalDeductions: number;
  netPayable: number;
  netPayableInWords: string;
  month: string;
  year: number;
  daysPresent: number;
  daysAbsent: number;
  paidLeaves: number;
  weeklyOffs: number;
}

export interface SalarySlipSummary {
  id: string;
  month: string;
  year: number;
  netPay: string;
  pdfUrl?: string;
}

export interface AuditItem {
  id: string;
  title: string;
  category: string;
  status?: 'PASS' | 'FAIL' | 'NEEDS_ATTENTION' | 'PENDING';
  remarks?: string;
}

