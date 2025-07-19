import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { IncomeService } from '../../services/income.service';
import { ExpenseService } from '../../services/expense.service';
import { SalaryService } from '../../services/salary.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {},
      y: {
        min: 0,
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    }
  };
  public barChartType: ChartType = 'bar';

  public barChartData: ChartData<'bar'> = {
    labels: ['Income', 'Expenses', 'Salary'],
    datasets: [
      { 
        data: [0, 0, 0], 
        label: 'Amount (₹)',
        backgroundColor: ['#10B981', '#EF4444', '#3B82F6']
      }
    ]
  };

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      }
    }
  };
  public pieChartType: ChartType = 'pie';

  // Income Pie Chart
  public incomePieChartData: ChartData<'pie'> = {
    labels: ['Course', 'Internship', 'Project', 'Digital Marketing', 'Others'],
    datasets: [
      {
        data: [0, 0, 0, 0, 0],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  // Expense Pie Chart
  public expensePieChartData: ChartData<'pie'> = {
    labels: ['Travel', 'Food', 'stationery', 'Banking', 'Others'],
    datasets: [
      {
        data: [0, 0, 0, 0, 0],
        backgroundColor: ['#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#10B981'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  // Salary Pie Chart
  public salaryPieChartData: ChartData<'pie'> = {
    labels: ['Shares', 'Salary', 'Others'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#8B5CF6', '#3B82F6', '#10B981'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  // Income Status Pie Chart
  public incomeStatusPieChartData: ChartData<'pie'> = {
    labels: ['Success', 'Failed', 'Wrong Entry', 'Inactive'],
    datasets: [
      {
        data: [0, 0, 0, 0],
        backgroundColor: ['#10B981', '#EF4444', '#F59E0B', '#6B7280'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  // Expense Status Pie Chart
  public expenseStatusPieChartData: ChartData<'pie'> = {
    labels: ['Success', 'Failed', 'Wrong Entry', 'Inactive'],
    datasets: [
      {
        data: [0, 0, 0, 0],
        backgroundColor: ['#10B981', '#EF4444', '#F59E0B', '#6B7280'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  stats = {
    totalIncome: 0,
    totalExpenses: 0,
    totalSalary: 0,
    netBalance: 0,
    incomeCount: 0,
    expenseCount: 0,
    salaryCount: 0
  };

  loading = true;
  error = '';
  currentUser: any;

  constructor(
    private incomeService: IncomeService,
    private expenseService: ExpenseService,
    private salaryService: SalaryService,
    private authService: AuthService
  ) {
    this.currentUser = this.authService.currentUserValue;
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = '';
    
    // Use forkJoin to handle all API calls together
    const incomeCall = this.incomeService.getIncomes().pipe(
      catchError(error => {
        console.error('Error loading income data:', error);
        return of({ incomes: [] } as any);
      })
    );

    const expenseCall = this.expenseService.getExpenses().pipe(
      catchError(error => {
        console.error('Error loading expense data:', error);
        return of({ expenses: [] } as any);
      })
    );

    const salaryCall = this.salaryService.getSalaries().pipe(
      catchError(error => {
        console.error('Error loading salary data:', error);
        return of({ salaries: [] } as any);
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
          // Extract data arrays from the new response structure
          // Handle both new structure (incomes/expenses/salaries) and old structure (data)
          const incomeData = data.incomes?.incomes || data.incomes?.data || data.incomes || [];
          const expenseData = data.expenses?.expenses || data.expenses?.data || data.expenses || [];
          const salaryData = data.salaries?.salaries || data.salaries?.data || data.salaries || [];

          // Ensure data is an array before processing
          if (!Array.isArray(incomeData)) {
            console.error('Income data is not an array:', incomeData);
            this.error = 'Invalid income data format. Please try again.';
            return;
          }

          if (!Array.isArray(expenseData)) {
            console.error('Expense data is not an array:', expenseData);
            this.error = 'Invalid expense data format. Please try again.';
            return;
          }

          if (!Array.isArray(salaryData)) {
            console.error('Salary data is not an array:', salaryData);
            this.error = 'Invalid salary data format. Please try again.';
            return;
          }

          // Process income data
          this.stats.totalIncome = this.calculateIncomeTotal(incomeData);
          this.stats.incomeCount = incomeData.length;

          // Process expense data
          this.stats.totalExpenses = this.calculateExpenseTotal(expenseData);
          this.stats.expenseCount = expenseData.length;

          // Process salary data
          this.stats.totalSalary = this.calculateTotal(salaryData, 'amount');
          this.stats.salaryCount = salaryData.length;

          // Update pie charts using the main data arrays
          this.updateIncomePieChart(incomeData);
          this.updateExpensePieChart(expenseData);
          this.updateSalaryPieChart(salaryData);
          this.updateIncomeStatusPieChart(incomeData);
          this.updateExpenseStatusPieChart(expenseData);

          this.updateCharts();
        } catch (error) {
          console.error('Error processing dashboard data:', error);
          this.error = 'Error processing dashboard data. Please try again.';
        }
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.error = 'Failed to load dashboard data. Please try again.';
        this.loading = false;
      }
    });
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

  private calculateExpenseTotal(data: any[]): number {
    return data
      .filter(expense => expense.status === '1') // Only successful payments
      .reduce((sum: number, item: any) => {
        const value = parseFloat(item.amount) || 0;
        return sum + value;
      }, 0);
  }

  private updateIncomePieChart(data: any[]): void {
    const incomeStats = {
      course: 0,
      internship: 0,
      project: 0,
      digitalMarketing: 0,
      others: 0
    };

    // Calculate amounts by category (only successful payments)
    data.forEach(income => {
      if (income.status === '1') { // Only successful payments
        const amount = parseFloat(income.amount) || 0;
        switch(income.income_cat) {
          case '1': incomeStats.course += amount; break;
          case '2': incomeStats.internship += amount; break;
          case '3': incomeStats.project += amount; break;
          case '4': incomeStats.digitalMarketing += amount; break;
          case '5': incomeStats.others += amount; break;
        }
      }
    });

    this.incomePieChartData.datasets[0].data = [
      incomeStats.course,
      incomeStats.internship,
      incomeStats.project,
      incomeStats.digitalMarketing,
      incomeStats.others
    ];
  }

  private updateExpensePieChart(data: any[]): void {
    const expenseStats = {
      travel: 0,
      food: 0,
      stationery: 0,
      banking: 0,
      others: 0
    };

    // Calculate amounts by category (only successful payments)
    data.forEach(expense => {
      if (expense.status === '1') { // Only successful payments
        const amount = parseFloat(expense.amount) || 0;
        switch(expense.expense_cat) {
          case '1': expenseStats.travel += amount; break;
          case '2': expenseStats.food += amount; break;
          case '3': expenseStats.stationery += amount; break;
          case '4': expenseStats.banking += amount; break;
          case '5': expenseStats.others += amount; break;
        }
      }
    });

    this.expensePieChartData.datasets[0].data = [
      expenseStats.travel,
      expenseStats.food,
      expenseStats.stationery,
      expenseStats.banking,
      expenseStats.others
    ];
  }

  private updateSalaryPieChart(data: any[]): void {
    const salaryStats = {
      shares: 0,
      salary: 0,
      others: 0
    };

    // Calculate amounts by payment type
    data.forEach(salary => {
      const amount = parseFloat(salary.amount) || 0;
      switch(salary.payment_type) {
        case '1': salaryStats.shares += amount; break;
        case '2': salaryStats.salary += amount; break;
        case '3': salaryStats.others += amount; break;
      }
    });

    this.salaryPieChartData.datasets[0].data = [
      salaryStats.shares,
      salaryStats.salary,
      salaryStats.others
    ];
  }

  private updateIncomeStatusPieChart(data: any[]): void {
    const statusStats = {
      success: 0,
      failed: 0,
      wrongEntry: 0,
      inactive: 0
    };

    // Calculate amounts by status
    data.forEach(income => {
      const amount = parseFloat(income.amount) || 0;
      switch(income.status) {
        case '1': statusStats.success += amount; break;
        case '2': statusStats.failed += amount; break;
        case '3': statusStats.wrongEntry += amount; break;
        case '4': statusStats.inactive += amount; break;
      }
    });

    this.incomeStatusPieChartData.datasets[0].data = [
      statusStats.success,
      statusStats.failed,
      statusStats.wrongEntry,
      statusStats.inactive
    ];
  }

  private updateExpenseStatusPieChart(data: any[]): void {
    const statusStats = {
      success: 0,
      failed: 0,
      wrongEntry: 0,
      inactive: 0
    };

    // Calculate amounts by status
    data.forEach(expense => {
      const amount = parseFloat(expense.amount) || 0;
      switch(expense.status) {
        case '1': statusStats.success += amount; break;
        case '2': statusStats.failed += amount; break;
        case '3': statusStats.wrongEntry += amount; break;
        case '4': statusStats.inactive += amount; break;
      }
    });

    this.expenseStatusPieChartData.datasets[0].data = [
      statusStats.success,
      statusStats.failed,
      statusStats.wrongEntry,
      statusStats.inactive
    ];
  }

  updateCharts(): void {
    this.stats.netBalance = this.stats.totalIncome - this.stats.totalExpenses - this.stats.totalSalary;
    
    this.barChartData.datasets[0].data = [
      this.stats.totalIncome,
      this.stats.totalExpenses,
      this.stats.totalSalary
    ];
  }

  refreshData(): void {
    this.loadDashboardData();
  }
} 