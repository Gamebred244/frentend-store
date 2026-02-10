import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Example: Get all items from backend
  getItems(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/items`);
  }

  // Example: Get item by ID
  getItem(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/items/${id}`);
  }

  // Example: Create item
  createItem(item: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/items`, item);
  }

  // Example: Update item
  updateItem(id: number, item: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/items/${id}`, item);
  }

  // Example: Delete item
  deleteItem(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/items/${id}`);
  }
}
