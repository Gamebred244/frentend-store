import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
  form = {
    name: '',
    email: '',
    message: ''
  };
  statusText = '';
  isSending = false;

  constructor(private http: HttpClient) {}

  submit(): void {
    if (!this.form.name || !this.form.email || !this.form.message) {
      this.statusText = 'Please fill all fields.';
      return;
    }
    this.isSending = true;
    this.statusText = 'Sending...';
    this.http.post(`${environment.apiUrl}/support/contact`, this.form, { withCredentials: true }).subscribe({
      next: () => {
        this.isSending = false;
        this.statusText = 'Message sent. Our support will reply soon.';
        this.form = { name: '', email: '', message: '' };
      },
      error: (error) => {
        this.isSending = false;
        this.statusText = error?.error?.message || 'Unable to send message.';
      }
    });
  }
}
