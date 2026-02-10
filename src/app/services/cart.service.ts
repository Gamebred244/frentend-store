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
  private cartKey = 'cartId';

  constructor(private http: HttpClient) {}

  getCartId(): string | null {
    return localStorage.getItem(this.cartKey);
  }

  setCartId(cartId: number): void {
    localStorage.setItem(this.cartKey, String(cartId));
  }

  createCart(): Observable<Cart> {
    return this.http.post<Cart>(`${this.apiUrl}/carts`, {}, { withCredentials: true });
  }

  getCart(cartId: string | number): Observable<Cart> {
    return this.http.get<Cart>(`${this.apiUrl}/carts/${cartId}`, { withCredentials: true });
  }

  addItem(cartId: string | number, productId: number, quantity: number): Observable<Cart> {
    return this.http.post<Cart>(
      `${this.apiUrl}/carts/${cartId}/items`,
      { productId, quantity },
      { withCredentials: true }
    );
  }

  updateItem(cartId: string | number, itemId: number, productId: number, quantity: number): Observable<Cart> {
    return this.http.put<Cart>(
      `${this.apiUrl}/carts/${cartId}/items/${itemId}`,
      { productId, quantity },
      { withCredentials: true }
    );
  }

  removeItem(cartId: string | number, itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/carts/${cartId}/items/${itemId}`, { withCredentials: true });
  }
}
