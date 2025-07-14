import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { IncomeComponent } from './pages/income/income.component';
import { ExpensesComponent } from './pages/expenses/expenses.component';
import { SalaryComponent } from './pages/salary/salary.component';
import { AccountsDetailsComponent } from './pages/accounts-details/accounts-details.component';
import { LayoutComponent } from './components/layout/layout.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'income', component: IncomeComponent },
      { path: 'expenses', component: ExpensesComponent },
      { path: 'salary', component: SalaryComponent },
      { path: 'accounts-details', component: AccountsDetailsComponent }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
