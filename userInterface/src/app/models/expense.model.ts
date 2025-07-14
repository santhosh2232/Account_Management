export interface Expense {
  sno: number;
  expense_cat: '1' | '2' | '3' | '4' | '5';
  expense_cat_remarks?: string;
  amount: number;
  spent_by: string;
  spent_on: Date;
  spent_through: string;
  remarks?: string;
  status: '1' | '2' | '3' | '4';
  created_at: Date;
}

export interface ExpenseCategory {
  value: string;
  label: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { value: '1', label: 'Travel' },
  { value: '2', label: 'Food' },
  { value: '3', label: 'Stationery' },
  { value: '4', label: 'Banking' },
  { value: '5', label: 'Others' }
];

export const EXPENSE_STATUS = [
  { value: '1', label: 'Success' },
  { value: '2', label: 'Failed' },
  { value: '3', label: 'Wrong Entry' },
  { value: '4', label: 'Inactive' }
]; 