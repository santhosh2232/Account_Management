import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Salary } from '../models/salary.model';
import { environment } from '../../environments/environment';

// Define the new API response structure
interface SalaryResponse {
  salaries: Salary[];
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
export class SalaryService {
  private apiUrl = environment.apiBaseUrl + '/salary';

  constructor(private http: HttpClient) { }

  getSalaries(filters?: any): Observable<SalaryResponse> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<SalaryResponse>(this.apiUrl, { params });
  }

  getSalaryById(id: number): Observable<Salary> {
    return this.http.get<Salary>(`${this.apiUrl}/${id}`);
  }

  createSalary(salary: Omit<Salary, 'sno' | 'created_at'>): Observable<Salary> {
    return this.http.post<Salary>(this.apiUrl, salary);
  }

  updateSalary(id: number, salary: Partial<Salary>): Observable<Salary> {
    return this.http.put<Salary>(`${this.apiUrl}/${id}`, salary);
  }

  deleteSalary(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getSalaryStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }
} 