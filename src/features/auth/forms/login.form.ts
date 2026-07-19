import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Injectable()
export class LoginForm {
  readonly group: FormGroup;

  constructor(private readonly formBuilder: FormBuilder) {
    this.group = this.formBuilder.group({
      identifier: ['', Validators.required],
      password: ['', Validators.required],
    });
  }
}
