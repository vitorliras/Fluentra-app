import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Injectable()
export class RegisterForm {
  readonly group: FormGroup;

  constructor(private readonly formBuilder: FormBuilder) {
    this.group = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      username: ['', [Validators.required, Validators.maxLength(30)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/\d/),
          Validators.pattern(/[^\w\s]/),
        ],
      ],
    });
  }
}
