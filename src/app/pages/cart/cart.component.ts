import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Cart } from '../../models/cart.model';
import { AuthResponse, AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  @ViewChild('paypalButtons') paypalButtons?: ElementRef<HTMLDivElement>;

  cart: Cart | null = null;
  statusText = 'Loading cart...';
  currentUser: AuthResponse | null = null;
  placeholderImage = 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=600&q=80';
  showCheckout = false;
  paymentMethod: 'card' | 'paypal' = 'card';
  checkout = {
    fullName: '',
    email: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    billingAddress: ''
  };
  checkoutStatus = '';
  paypalLoaded = false;

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
    if (this.paymentMethod === 'paypal') {
      this.loadPayPal();
    }
  }

  closeCheckout(): void {
    this.showCheckout = false;
  }

  submitCheckout(): void {
    if (this.paymentMethod === 'card') {
      if (!this.checkout.fullName || !this.checkout.email || !this.checkout.cardNumber
        || !this.checkout.expiry || !this.checkout.cvc) {
        this.checkoutStatus = 'Please fill all required card fields.';
        return;
      }
    }
    this.checkoutStatus = 'Payment submitted. (Demo only)';
    window.setTimeout(() => {
      this.showCheckout = false;
    }, 1400);
  }

  onPaymentMethodChange(): void {
    if (this.paymentMethod === 'paypal') {
      this.loadPayPal();
    }
  }

  private loadPayPal(): void {
    if (this.paypalLoaded) {
      this.renderPayPalButtons();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${environment.paypalClientId}&currency=MAD`;
    script.onload = () => {
      this.paypalLoaded = true;
      this.renderPayPalButtons();
    };
    document.body.appendChild(script);
  }

  private renderPayPalButtons(): void {
    if (!this.paypalButtons || !(window as any).paypal || !this.cart) {
      return;
    }
    this.paypalButtons.nativeElement.innerHTML = '';
    (window as any).paypal.Buttons({
      createOrder: () => {
        return fetch('/api/payments/paypal/create', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: this.cart?.total ?? 0,
            currency: this.cart?.currency ?? 'MAD',
            cartId: this.cart?.id
          })
        })
          .then((res) => res.json())
          .then((data) => data.orderId);
      },
      onApprove: (data: any) => {
        return fetch(`/api/payments/paypal/capture/${data.orderID}`, {
          method: 'POST',
          credentials: 'include'
        })
          .then((res) => res.json())
          .then(() => {
            this.checkoutStatus = 'Payment successful.';
            window.setTimeout(() => {
              this.showCheckout = false;
              this.loadCart();
            }, 1000);
          });
      },
      onError: () => {
        this.checkoutStatus = 'Payment failed. Please try again.';
      }
    }).render(this.paypalButtons.nativeElement);
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
