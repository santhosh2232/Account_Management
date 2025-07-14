export interface AccountsDetails {
  sno: number;
  entry_type: '1' | '2' | '3';
  income_sno?: number;
  expenses_sno?: number;
  salary_sno?: number;
  entry_by: string;
  ip_address: string;
  browser_name: string;
  browser_ver: string;
  operating_sys: string;
  created_at: Date;
}

export interface EntryType {
  value: string;
  label: string;
}

export const ENTRY_TYPES: EntryType[] = [
  { value: '1', label: 'Income' },
  { value: '2', label: 'Expense' },
  { value: '3', label: 'Salary' }
]; 