import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  error = '';
  busy = false;
  form = this.fb.group({
    username: ['planner', Validators.required],
    password: ['factory123', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    if (auth.isLoggedIn) {
      this.router.navigateByUrl('/dashboard');
    }
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.busy = true;
    this.error = '';
    const { username, password } = this.form.value;
    this.auth.login(username.trim(), password).subscribe(
      () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl || '/dashboard');
      },
      err => {
        this.busy = false;
        this.error = err.message;
      }
    );
  }
}
