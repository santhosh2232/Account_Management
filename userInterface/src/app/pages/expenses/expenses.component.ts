import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css']
})
export class ExpensesComponent implements OnInit {
  expenseForm: FormGroup;
  filterForm: FormGroup;
  expenses: any[] = [];
  loading = false;
  error = '';
  showForm = false;
  showStatusModal = false;
  showConfirmationModal = false;
  selectedExpense: any = null;
  selectedStatus: '1' | '2' | '3' | '4' | null = null;

  // Expense categories mapping
  expenseCategories = [
    { value: '1', label: 'Travel' },
    { value: '2', label: 'Food' },
    { value: '3', label: 'stationery' },
    { value: '4', label: 'Banking' },
    { value: '5', label: 'Others' }
  ];

  // Status options
  statusOptions = [
    { value: '1', label: 'Success', color: 'green' },
    { value: '2', label: 'Failed', color: 'red' },
    { value: '3', label: 'Wrong Entry', color: 'yellow' },
    { value: '4', label: 'Inactive', color: 'gray' }
  ];

  // Summary statistics
  summary = {
    totalExpense: 0,
    totalCount: 0,
    successCount: 0,
    failedCount: 0,
    wrongEntryCount: 0,
    inactiveCount: 0
  };

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService
  ) {
    this.expenseForm = this.fb.group({
      expense_cat: ['', Validators.required],
      expense_cat_remarks: [''],
      amount: ['', [Validators.required, Validators.min(0)]],
      spent_by: ['', Validators.required],
      spent_on: ['', Validators.required],
      spent_through: ['', Validators.required],
      remarks: ['', Validators.required],
      status: ['1']
    });

    this.filterForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      category: [''],
      spentBy: [''],
      paymentMethod: ['']
    });

    // Watch for changes in expense_cat to show/hide remarks field
    this.expenseForm.get('expense_cat')?.valueChanges.subscribe(value => {
      const remarksControl = this.expenseForm.get('expense_cat_remarks');
      if (value === '5') { // Others
        remarksControl?.setValidators([Validators.required]);
      } else {
        remarksControl?.clearValidators();
        remarksControl?.setValue('');
      }
      remarksControl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.setDefaultDateRange();
    this.loadExpenses();
  }

  setDefaultDateRange(): void {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    this.filterForm.patchValue({
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    });
  }

  loadExpenses(): void {
    this.loading = true;
    const filters = this.filterForm.value;
    
    // Only include non-empty filters
    const queryParams: any = {};
    if (filters.startDate) queryParams.startDate = filters.startDate;
    if (filters.endDate) queryParams.endDate = filters.endDate;
    if (filters.category) queryParams.category = filters.category;
    if (filters.spentBy) queryParams.spentBy = filters.spentBy;
    if (filters.paymentMethod) queryParams.paymentMethod = filters.paymentMethod;

    this.expenseService.getExpenses(queryParams).subscribe({
      next: (response) => {
        // Extract data array from response
        if (response && response.data && Array.isArray(response.data)) {
          this.expenses = response.data;
        } else {
          this.expenses = [];
        }
        this.calculateSummary();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
        this.error = 'Failed to load expenses';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadExpenses();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.setDefaultDateRange();
    this.loadExpenses();
  }

  onSubmit(): void {
    if (this.expenseForm.valid) {
      this.loading = true;
      this.expenseService.createExpense(this.expenseForm.value).subscribe({
        next: () => {
          this.loadExpenses();
          this.expenseForm.reset();
          this.showForm = false;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error creating expense:', error);
          this.error = 'Failed to create expense';
          this.loading = false;
        }
      });
    }
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  getCategoryLabel(value: string): string {
    const category = this.expenseCategories.find(cat => cat.value === value);
    return category ? category.label : value;
  }

  get isOthersSelected(): boolean {
    return this.expenseForm.get('expense_cat')?.value === '5';
  }

  openStatusModal(expense: any): void {
    this.selectedExpense = expense;
    this.selectedStatus = null;
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.selectedExpense = null;
    this.selectedStatus = null;
  }

  selectStatus(status: string): void {
    if (status === '1' || status === '2' || status === '3' || status === '4') {
      this.selectedStatus = status as '1' | '2' | '3' | '4';
    }
  }

  confirmStatusUpdate(): void {
    if (this.selectedExpense && this.selectedStatus) {
      this.showConfirmationModal = true;
    }
  }

  closeConfirmationModal(): void {
    this.showConfirmationModal = false;
  }

  proceedWithUpdate(): void {
    if (this.selectedExpense && this.selectedStatus) {
      this.loading = true;
      // Use the new status-only update endpoint
      this.expenseService.updateExpenseStatus(this.selectedExpense.sno, this.selectedStatus).subscribe({
        next: () => {
          this.loadExpenses(); // Reload to get updated data
          this.closeStatusModal();
          this.closeConfirmationModal();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error updating expense status:', error);
          console.error('Error details:', error.error);
          console.error('Status code:', error.status);
          console.error('Status text:', error.statusText);
          this.error = 'Failed to update expense status';
          this.loading = false;
        }
      });
    }
  }

  getStatusLabel(value: string): string {
    const status = this.statusOptions.find(s => s.value === value);
    return status ? status.label : value;
  }

  getStatusColor(value: string): string {
    const status = this.statusOptions.find(s => s.value === value);
    return status ? status.color : 'gray';
  }

  // Get filtered status options excluding current status
  get filteredStatusOptions() {
    if (!this.selectedExpense) {
      return this.statusOptions;
    }
    return this.statusOptions.filter(status => status.value !== this.selectedExpense.status);
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString()}`;
  }

  calculateSummary(): void {
    this.summary.totalCount = this.expenses.length;
    this.summary.successCount = this.expenses.filter(expense => expense.status === '1').length;
    this.summary.failedCount = this.expenses.filter(expense => expense.status === '2').length;
    this.summary.wrongEntryCount = this.expenses.filter(expense => expense.status === '3').length;
    this.summary.inactiveCount = this.expenses.filter(expense => expense.status === '4').length;
    
    // Calculate total expense only from successful payments
    this.summary.totalExpense = this.expenses
      .filter(expense => expense.status === '1')
      .reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
  }
} 