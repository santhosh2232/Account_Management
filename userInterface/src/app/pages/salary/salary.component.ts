import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SalaryService } from '../../services/salary.service';

@Component({
  selector: 'app-salary',
  templateUrl: './salary.component.html',
  styleUrls: ['./salary.component.css']
})
export class SalaryComponent implements OnInit {
  salaryForm: FormGroup;
  filterForm: FormGroup;
  salaries: any[] = [];
  loading = false;
  error = '';
  showForm = false;

  // Payment types mapping
  paymentTypes = [
    { value: '1', label: 'Shares' },
    { value: '2', label: 'Salary' },
    { value: '3', label: 'Others' }
  ];

  constructor(
    private fb: FormBuilder,
    private salaryService: SalaryService
  ) {
    this.salaryForm = this.fb.group({
      payment_type: ['', Validators.required],
      payment_type_remarks: [''],
      amount: ['', [Validators.required, Validators.min(0)]],
      payment_to_whom: ['', Validators.required],
      spent_date: ['', Validators.required],
      payment_through: ['', Validators.required],
      remarks: ['']
    });

    this.filterForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      paymentType: [''],
      search: ['']
    });

    // Watch for changes in payment_type to show/hide remarks field
    this.salaryForm.get('payment_type')?.valueChanges.subscribe(value => {
      const remarksControl = this.salaryForm.get('payment_type_remarks');
      if (value === '3') { // Others
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
    this.loadSalaries();
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

  loadSalaries(): void {
    this.loading = true;
    const filters = this.filterForm.value;
    
    // Only include non-empty filters
    const queryParams: any = {};
    if (filters.startDate) queryParams.startDate = filters.startDate;
    if (filters.endDate) queryParams.endDate = filters.endDate;
    if (filters.paymentType) queryParams.paymentType = filters.paymentType;
    if (filters.search) queryParams.search = filters.search;

    this.salaryService.getSalaries(queryParams).subscribe({
      next: (response) => {
        // Extract data array from response
        if (response && response.data && Array.isArray(response.data)) {
          this.salaries = response.data;
        } else {
          this.salaries = [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading salaries:', error);
        this.error = 'Failed to load salaries';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadSalaries();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.setDefaultDateRange();
    this.loadSalaries();
  }

  onSubmit(): void {
    if (this.salaryForm.valid) {
      this.loading = true;
      this.salaryService.createSalary(this.salaryForm.value).subscribe({
        next: () => {
          this.loadSalaries();
          this.salaryForm.reset();
          this.showForm = false;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error creating salary:', error);
          this.error = 'Failed to create salary';
          this.loading = false;
        }
      });
    }
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  getPaymentTypeLabel(value: string): string {
    const paymentType = this.paymentTypes.find(type => type.value === value);
    return paymentType ? paymentType.label : value;
  }

  get isOthersSelected(): boolean {
    return this.salaryForm.get('payment_type')?.value === '3';
  }
} 