import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Cart } from '../../models/cart.model';
import { AuthResponse, AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  statusKey: string | null = 'CART.STATUS.LOADING';
  isLoadingCart = false;
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
  checkoutStatusKey = '';

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadCart();
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
    this.loadUser();
  }

  async loadCart(): Promise<void> {
    try {
      this.isLoadingCart = true;
      this.cart = await firstValueFrom(this.cartService.getCart());
      this.statusKey = this.cart.items.length ? '' : 'CART.STATUS.EMPTY';
    } catch (error) {
      this.statusKey = 'CART.STATUS.NEED_SIGNIN';
    } finally {
      this.isLoadingCart = false;
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
    await firstValueFrom(this.cartService.updateItem(itemId, productId, quantity));
    await this.loadCart();
  }

  async removeItem(itemId: number): Promise<void> {
    if (!this.cart) {
      return;
    }
    await firstValueFrom(this.cartService.removeItem(itemId));
    await this.loadCart();
  }

  openCheckout(): void {
    this.checkoutStatusKey = '';
    this.showCheckout = true;
  }

  closeCheckout(): void {
    this.showCheckout = false;
  }

  submitCheckout(): void {
    if (!this.checkout.fullName || !this.checkout.email || !this.checkout.cardNumber
      || !this.checkout.expiry || !this.checkout.cvc) {
      this.checkoutStatusKey = 'CART.CHECKOUT.ERROR_REQUIRED';
      return;
    }
    this.checkoutStatusKey = 'CART.CHECKOUT.SUBMITTED';
    window.setTimeout(() => {
      this.showCheckout = false;
    }, 1400);
  }

  changeLanguage(lang: string): void {
    this.languageService.setLanguage(lang);
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
