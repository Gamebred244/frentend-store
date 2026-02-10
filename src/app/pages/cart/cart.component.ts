import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Cart } from '../../models/cart.model';
import { AuthResponse, AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  statusText = 'Loading cart...';
  currentUser: AuthResponse | null = null;
  placeholderImage = 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=600&q=80';
  showCheckout = false;
  checkout = {
    fullName: '',
    email: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    billingAddress: ''
  };
  checkoutStatus = '';

  constructor(private cartService: CartService, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadCart();
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
    this.loadUser();
  }

  async loadCart(): Promise<void> {
    try {
      const cartId = await this.ensureCart();
      this.cart = await firstValueFrom(this.cartService.getCart(cartId));
      this.statusText = this.cart.items.length ? '' : 'Your cart is empty.';
    } catch (error) {
      this.statusText = 'Please sign in to view your cart.';
    }
  }

  async updateQty(itemId: number, productId: number, quantity: number): Promise<void> {
    if (!this.cart) {
      return;
    }
    if (quantity <= 0) {
      await this.removeItem(itemId);
      return;
    }
    await firstValueFrom(this.cartService.updateItem(this.cart.id, itemId, productId, quantity));
    await this.loadCart();
  }

  async removeItem(itemId: number): Promise<void> {
    if (!this.cart) {
      return;
    }
    await firstValueFrom(this.cartService.removeItem(this.cart.id, itemId));
    await this.loadCart();
  }

  openCheckout(): void {
    this.checkoutStatus = '';
    this.showCheckout = true;
  }

  closeCheckout(): void {
    this.showCheckout = false;
  }

  submitCheckout(): void {
    if (!this.checkout.fullName || !this.checkout.email || !this.checkout.cardNumber
      || !this.checkout.expiry || !this.checkout.cvc) {
      this.checkoutStatus = 'Please fill all required card fields.';
      return;
    }
    this.checkoutStatus = 'Payment submitted. (Demo only)';
    window.setTimeout(() => {
      this.showCheckout = false;
    }, 1400);
  }

  private async ensureCart(): Promise<string> {
    const existing = this.cartService.getCartId();
    if (existing) {
      return existing;
    }
    const cart = await firstValueFrom(this.cartService.createCart());
    this.cartService.setCartId(cart.id);
    return String(cart.id);
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (target) {
      target.src = this.placeholderImage;
    }
  }

  loadUser(): void {
    this.authService.me().subscribe({
      error: () => {
        this.currentUser = null;
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.currentUser = null;
      }
    });
  }
}
