import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Cart } from '../models/cart.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCart(): Observable<Cart> {
    return this.http.get<Cart>(`${this.apiUrl}/carts/me`, { withCredentials: true });
  }

  addItem(productId: number, quantity: number): Observable<Cart> {
    return this.http.post<Cart>(
      `${this.apiUrl}/carts/me/items`,
      { productId, quantity },
      { withCredentials: true }
    );
  }

  updateItem(itemId: number, productId: number, quantity: number): Observable<Cart> {
    return this.http.put<Cart>(
      `${this.apiUrl}/carts/me/items/${itemId}`,
      { productId, quantity },
      { withCredentials: true }
    );
  }

  removeItem(itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/carts/me/items/${itemId}`, { withCredentials: true });
  }
}
