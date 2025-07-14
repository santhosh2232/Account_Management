import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense } from '../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiUrl = 'http://localhost:3000/api/expenses';

  constructor(private http: HttpClient) { }

  getExpenses(filters?: any): Observable<{ data: Expense[] }> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<{ data: Expense[] }>(this.apiUrl, { params });
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