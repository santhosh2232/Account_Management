import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Income } from '../models/income.model';

// Define the new API response structure
interface IncomeResponse {
  incomes: Income[];
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
export class IncomeService {
  private apiUrl = 'http://localhost:3000/api/income';

  constructor(private http: HttpClient) { }

  getIncomes(filters?: any): Observable<IncomeResponse> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<IncomeResponse>(this.apiUrl, { params });
  }

  getIncomeById(id: number): Observable<Income> {
    return this.http.get<Income>(`${this.apiUrl}/${id}`);
  }

  createIncome(income: Omit<Income, 'sno' | 'created_at'>): Observable<Income> {
    return this.http.post<Income>(this.apiUrl, income);
  }

  updateIncome(id: number, income: Partial<Income>): Observable<Income> {
    return this.http.put<Income>(`${this.apiUrl}/${id}`, income);
  }

  updateIncomeStatus(id: number, status: string): Observable<Income> {
    return this.http.patch<Income>(`${this.apiUrl}/${id}/status`, { status });
  }

  deleteIncome(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getIncomeStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }
} 