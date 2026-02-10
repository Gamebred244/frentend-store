import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product, ProductRequest } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProducts(query?: string): Observable<Product[]> {
    const url = query ? `${this.apiUrl}/products?q=${encodeURIComponent(query)}` : `${this.apiUrl}/products`;
    return this.http.get<Product[]>(url, { withCredentials: true });
  }

  createProduct(payload: ProductRequest): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, payload, { withCredentials: true });
  }

  updateProduct(id: number, payload: ProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${id}`, payload, { withCredentials: true });
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`, { withCredentials: true });
  }
}
