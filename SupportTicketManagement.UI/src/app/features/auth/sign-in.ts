import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css'
})
export class SignIn {
  protected readonly auth = inject(AuthService);
}
