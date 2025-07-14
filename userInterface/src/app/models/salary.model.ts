export interface Salary {
  sno: number;
  payment_type: '1' | '2' | '3';
  payment_type_remarks?: string;
  amount: number;
  payment_to_whom: string;
  spent_date: Date;
  payment_through: string;
  remarks?: string;
  created_at: Date;
}

export interface PaymentType {
  value: string;
  label: string;
}

export const PAYMENT_TYPES: PaymentType[] = [
  { value: '1', label: 'Shares' },
  { value: '2', label: 'Salary' },
  { value: '3', label: 'Others' }
]; 