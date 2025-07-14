import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IncomeService } from '../../services/income.service';
import { Income } from '../../models/income.model';

@Component({
  selector: 'app-income',
  templateUrl: './income.component.html',
  styleUrls: ['./income.component.css']
})
export class IncomeComponent implements OnInit {
  incomeForm: FormGroup;
  filterForm: FormGroup;
  incomes: any[] = [];
  loading = false;
  error = '';
  showForm = false;
  showStatusModal = false;
  showConfirmationModal = false;
  selectedIncome: any = null;
  selectedStatus: '1' | '2' | '3' | '4' | null = null;

  // Income categories mapping
  incomeCategories = [
    { value: '1', label: 'Course' },
    { value: '2', label: 'Internship' },
    { value: '3', label: 'Project' },
    { value: '4', label: 'Digital Marketing' },
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
    totalIncome: 0,
    totalCount: 0,
    successCount: 0,
    failedCount: 0,
    wrongEntryCount: 0,
    inactiveCount: 0
  };

  constructor(
    private fb: FormBuilder,
    private incomeService: IncomeService
  ) {
    this.incomeForm = this.fb.group({
      income_cat: ['', Validators.required],
      income_cat_remarks: [''],
      amount: ['', [Validators.required, Validators.min(0)]],
      received_by: ['', Validators.required],
      received_on: ['', Validators.required],
      sender_name: ['', Validators.required],
      sender_mobile: ['', Validators.required],
      remarks: ['', Validators.required],
      status: ['1']
    });

    this.filterForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      category: [''],
      status: [''],
      search: ['']
    });

    // Watch for changes in income_cat to show/hide remarks field
    this.incomeForm.get('income_cat')?.valueChanges.subscribe(value => {
      const remarksControl = this.incomeForm.get('income_cat_remarks');
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
    this.loadIncomes();
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

  loadIncomes(): void {
    this.loading = true;
    const filters = this.filterForm.value;
    
    // Only include non-empty filters
    const queryParams: any = {};
    if (filters.startDate) queryParams.startDate = filters.startDate;
    if (filters.endDate) queryParams.endDate = filters.endDate;
    if (filters.category) queryParams.category = filters.category;
    if (filters.status) queryParams.status = filters.status;
    if (filters.search) queryParams.search = filters.search;

    this.incomeService.getIncomes(queryParams).subscribe({
      next: (response) => {
        // Extract data array from response
        if (response && response.data && Array.isArray(response.data)) {
          this.incomes = response.data;
        } else {
          this.incomes = [];
        }
        this.calculateSummary();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading incomes:', error);
        this.error = 'Failed to load incomes';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadIncomes();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.setDefaultDateRange();
    this.loadIncomes();
  }

  onSubmit(): void {
    if (this.incomeForm.valid) {
      this.loading = true;
      this.incomeService.createIncome(this.incomeForm.value).subscribe({
        next: () => {
          this.loadIncomes();
          this.incomeForm.reset();
          this.showForm = false;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error creating income:', error);
          this.error = 'Failed to create income';
          this.loading = false;
        }
      });
    }
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  getCategoryLabel(value: string): string {
    const category = this.incomeCategories.find(cat => cat.value === value);
    return category ? category.label : value;
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
    if (!this.selectedIncome) {
      return this.statusOptions;
    }
    return this.statusOptions.filter(status => status.value !== this.selectedIncome.status);
  }

  openStatusModal(income: any): void {
    this.selectedIncome = income;
    this.selectedStatus = null;
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.selectedIncome = null;
    this.selectedStatus = null;
  }

  selectStatus(status: string): void {
    if (status === '1' || status === '2' || status === '3' || status === '4') {
      this.selectedStatus = status as '1' | '2' | '3' | '4';
    }
  }

  confirmStatusUpdate(): void {
    if (this.selectedIncome && this.selectedStatus) {
      this.showConfirmationModal = true;
    }
  }

  closeConfirmationModal(): void {
    this.showConfirmationModal = false;
  }

  proceedWithUpdate(): void {
    if (this.selectedIncome && this.selectedStatus) {
      this.loading = true;
      // Use the new status-only update endpoint
      this.incomeService.updateIncomeStatus(this.selectedIncome.sno, this.selectedStatus).subscribe({
        next: () => {
          this.loadIncomes(); // Reload to get updated data
          this.closeStatusModal();
          this.closeConfirmationModal();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error updating income status:', error);
          console.error('Error details:', error.error);
          console.error('Status code:', error.status);
          console.error('Status text:', error.statusText);
          this.error = 'Failed to update income status';
          this.loading = false;
        }
      });
    }
  }

  calculateSummary(): void {
    this.summary.totalCount = this.incomes.length;
    this.summary.successCount = this.incomes.filter(income => income.status === '1').length;
    this.summary.failedCount = this.incomes.filter(income => income.status === '2').length;
    this.summary.wrongEntryCount = this.incomes.filter(income => income.status === '3').length;
    this.summary.inactiveCount = this.incomes.filter(income => income.status === '4').length;
    
    // Calculate total income only from successful payments
    this.summary.totalIncome = this.incomes
      .filter(income => income.status === '1')
      .reduce((sum, income) => sum + (parseFloat(income.amount) || 0), 0);
  }

  get isOthersSelected(): boolean {
    return this.incomeForm.get('income_cat')?.value === '5';
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString()}`;
  }
} 