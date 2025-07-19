import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense } from '../models/expense.model';
import { environment } from '../../environments/environment';

// Define the new API response structure
interface ExpenseResponse {
  expenses: Expense[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiUrl = environment.apiBaseUrl + '/expenses';

  constructor(private http: HttpClient) { }

  getExpenses(filters?: any): Observable<ExpenseResponse> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<ExpenseResponse>(this.apiUrl, { params });
  }

  getExpenseById(id: number): Observable<Expense> {
    return this.http.get<Expense>(`${this.apiUrl}/${id}`);
  }

  createExpense(expense: Omit<Expense, 'sno' | 'created_at'>): Observable<Expense> {
    return this.http.post<Expense>(this.apiUrl, expense);
  }

  updateExpense(id: number, expense: Partial<Expense>): Observable<Expense> {
    return this.http.put<Expense>(`${this.apiUrl}/${id}`, expense);
  }

  updateExpenseStatus(id: number, status: string): Observable<Expense> {
    return this.http.patch<Expense>(`${this.apiUrl}/${id}/status`, { status });
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getExpenseStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }
} 