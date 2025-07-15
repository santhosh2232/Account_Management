import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { IncomeService } from '../../services/income.service';
import { ExpenseService } from '../../services/expense.service';
import { SalaryService } from '../../services/salary.service';

@Component({
  selector: 'app-accounts-details',
  templateUrl: './accounts-details.component.html',
  styleUrls: ['./accounts-details.component.css']
})
export class AccountsDetailsComponent implements OnInit, OnDestroy {
  incomes: any[] = [];
  expenses: any[] = [];
  salaries: any[] = [];
  filteredIncomes: any[] = [];
  filteredExpenses: any[] = [];
  filteredSalaries: any[] = [];
  loading = false;
  error = '';
  showFilters = false;

  // Filter form
  filterForm: FormGroup;

  // Filter options
  incomeCategories = [
    { value: '', label: 'All Categories' },
    { value: '1', label: 'Course' },
    { value: '2', label: 'Internship' },
    { value: '3', label: 'Project' },
    { value: '4', label: 'Digital Marketing' },
    { value: '5', label: 'Others' }
  ];

  expenseCategories = [
    { value: '', label: 'All Categories' },
    { value: '1', label: 'Travel' },
    { value: '2', label: 'Food' },
    { value: '3', label: 'Stationery' },
    { value: '4', label: 'Banking' },
    { value: '5', label: 'Others' }
  ];

  salaryTypes = [
    { value: '', label: 'All Types' },
    { value: '1', label: 'Shares' },
    { value: '2', label: 'Salary' },
    { value: '3', label: 'Others' }
  ];

  // Summary statistics
  summary = {
    totalIncome: 0,
    totalExpenses: 0,
    totalSalary: 0,
    netBalance: 0,
    incomeCount: 0,
    expenseCount: 0,
    salaryCount: 0
  };

  constructor(
    private fb: FormBuilder,
    private incomeService: IncomeService,
    private expenseService: ExpenseService,
    private salaryService: SalaryService
  ) {
    this.filterForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      incomeCategory: [''],
      expenseCategory: [''],
      salaryType: ['']
    });
  }

  ngOnInit(): void {
    this.setDefaultDateRange();
    this.loadAccountDetails();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  setDefaultDateRange(): void {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    firstDay.setHours(12, 0, 0, 0);
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    this.filterForm.patchValue({
      startDate: firstDay.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
  }

  loadAccountDetails(): void {
    this.loading = true;
    this.error = '';

    // Use forkJoin for better error handling and performance
    const incomeCall = this.incomeService.getIncomes().pipe(
      catchError(error => {
        console.error('Error loading income data:', error);
        return of({ data: [] });
      })
    );

    const expenseCall = this.expenseService.getExpenses().pipe(
      catchError(error => {
        console.error('Error loading expense data:', error);
        return of({ data: [] });
      })
    );

    const salaryCall = this.salaryService.getSalaries().pipe(
      catchError(error => {
        console.error('Error loading salary data:', error);
        return of({ data: [] });
      })
    );

    forkJoin({
      incomes: incomeCall,
      expenses: expenseCall,
      salaries: salaryCall
    }).pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (data: any) => {
        try {
          // Extract data arrays from responses with proper error handling
          this.incomes = this.extractDataArray(data.incomes);
          this.expenses = this.extractDataArray(data.expenses);
          this.salaries = this.extractDataArray(data.salaries);

          // Apply initial filters
          this.applyFilters();
        } catch (error) {
          console.error('Error processing account details:', error);
          this.error = 'Error processing account details. Please try again.';
        }
      },
      error: (error) => {
        console.error('Error loading account details:', error);
        this.error = 'Failed to load account details. Please try again.';
        this.loading = false;
      }
    });
  }

  private extractDataArray(response: any): any[] {
    
    if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (Array.isArray(response)) {
      return response;
    } else if (response && typeof response === 'object') {
      // Try to find any array property
      for (const key in response) {
        if (Array.isArray(response[key])) {
          return response[key];
        }
      }
    }
    
    return [];
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    // Filter incomes with proper field names
    this.filteredIncomes = this.incomes.filter(income => {
      const dateMatch = this.isDateInRange(income.received_on, filters.startDate, filters.endDate);
      const categoryMatch = !filters.incomeCategory || income.income_cat === filters.incomeCategory;
      return dateMatch && categoryMatch;
    });

    // Filter expenses with proper field names
    this.filteredExpenses = this.expenses.filter(expense => {
      const dateMatch = this.isDateInRange(expense.spent_on, filters.startDate, filters.endDate);
      const categoryMatch = !filters.expenseCategory || expense.expense_cat === filters.expenseCategory;
      return dateMatch && categoryMatch;
    });

    // Filter salaries with proper field names
    this.filteredSalaries = this.salaries.filter(salary => {
      const dateMatch = this.isDateInRange(salary.spent_date, filters.startDate, filters.endDate);
      const typeMatch = !filters.salaryType || salary.payment_type === filters.salaryType;
      return dateMatch && typeMatch;
    });

    // Recalculate summary with filtered data
    this.calculateSummary();
  }

  isDateInRange(date: string, startDate: string, endDate: string): boolean {
    if (!startDate && !endDate) return true;
    
    if (!date) return false;
    
    const itemDate = new Date(date);
    if (isNaN(itemDate.getTime())) return false; // Invalid date
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && end) {
      return itemDate >= start && itemDate <= end;
    } else if (start) {
      return itemDate >= start;
    } else if (end) {
      return itemDate <= end;
    }
    
    return true;
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.setDefaultDateRange();
    this.applyFilters();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  calculateSummary(): void {
    this.summary.totalIncome = this.calculateIncomeTotal(this.filteredIncomes);
    this.summary.totalExpenses = this.calculateTotal(this.filteredExpenses, 'amount');
    this.summary.totalSalary = this.calculateTotal(this.filteredSalaries, 'amount');
    this.summary.netBalance = this.summary.totalIncome - this.summary.totalExpenses - this.summary.totalSalary;
    this.summary.incomeCount = this.filteredIncomes.length;
    this.summary.expenseCount = this.filteredExpenses.length;
    this.summary.salaryCount = this.filteredSalaries.length;
  }

  private calculateTotal(data: any[], field: string): number {
    return data.reduce((sum: number, item: any) => {
      const value = parseFloat(item[field]) || 0;
      return sum + value;
    }, 0);
  }

  private calculateIncomeTotal(data: any[]): number {
    return data
      .filter(income => income.status === '1') // Only successful payments
      .reduce((sum: number, income: any) => {
        const value = parseFloat(income.amount) || 0;
        return sum + value;
      }, 0);
  }

  getCategoryLabel(categoryValue: string, categories: any[]): string {
    const category = categories.find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  }

  getSalaryTypeLabel(typeValue: string): string {
    const type = this.salaryTypes.find(t => t.value === typeValue);
    return type ? type.label : typeValue;
  }

  refreshData(): void {
    this.loadAccountDetails();
  }

  // Helper method to format currency
  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString()}`;
  }

  // Helper method to get description for salary records
  getSalaryDescription(salary: any): string {
    if (salary.payment_type_remarks) {
      return salary.payment_type_remarks;
    }
    if (salary.payment_to_whom) {
      return `Paid to: ${salary.payment_to_whom}`;
    }
    return 'Salary payment';
  }
} 