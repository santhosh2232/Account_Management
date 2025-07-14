export interface Income {
  sno: number;
  income_cat: '1' | '2' | '3' | '4' | '5';
  income_cat_remarks?: string;
  amount: number;
  received_by: string;
  received_on: Date;
  sender_name: string;
  sender_mobile: string;
  remarks?: string;
  status: '1' | '2' | '3' | '4';
  created_at: Date;
}

export interface IncomeCategory {
  value: string;
  label: string;
}

export const INCOME_CATEGORIES: IncomeCategory[] = [
  { value: '1', label: 'Course' },
  { value: '2', label: 'Internship' },
  { value: '3', label: 'Project' },
  { value: '4', label: 'Digital Marketing' },
  { value: '5', label: 'Others' }
];

export const INCOME_STATUS = [
  { value: '1', label: 'Success' },
  { value: '2', label: 'Failed' },
  { value: '3', label: 'Wrong Entry' },
  { value: '4', label: 'Inactive' }
]; 