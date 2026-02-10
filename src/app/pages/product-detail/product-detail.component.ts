import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Product } from '../../models/product.model';
import { AuthResponse, AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { LanguageService } from '../../services/language.service';
import { ProductService } from '../../services/product.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  similarProducts: Product[] = [];
  allProducts: Product[] = [];
  statusKey: string | null = 'PRODUCT.STATUS.LOADING';
  isLoadingProduct = false;
  currentUser: AuthResponse | null = null;
  placeholderImage = 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=80';
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  showToast = false;
  searchQuery = '';
  suggestions: Product[] = [];
  showSuggestions = false;
  highlightedIndex = -1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private languageService: LanguageService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
    this.authService.me().subscribe({
      error: () => {
        this.currentUser = null;
      }
    });
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      this.loadProduct(id);
    });
    this.loadAllProducts();
  }

  changeLanguage(lang: string): void {
    this.languageService.setLanguage(lang);
  }

  onSearch(): void {
    const query = this.searchQuery.trim();
    if (!query) {
      return;
    }
    this.router.navigate(['/'], { queryParams: { q: query } });
  }

  updateSuggestions(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.suggestions = [];
      this.showSuggestions = false;
      this.highlightedIndex = -1;
      return;
    }
    this.suggestions = this.allProducts
      .filter((product) =>
        product.name.toLowerCase().includes(query) ||
        (product.category || '').toLowerCase().includes(query)
      )
      .slice(0, 6);
    this.showSuggestions = this.suggestions.length > 0;
    this.highlightedIndex = this.showSuggestions ? 0 : -1;
  }

  selectSuggestion(product: Product): void {
    this.searchQuery = product.name;
    this.showSuggestions = false;
    this.highlightedIndex = -1;
    this.goToProduct(product.id);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (!this.showSuggestions || !this.suggestions.length) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlightedIndex = (this.highlightedIndex + 1) % this.suggestions.length;
      this.searchQuery = this.suggestions[this.highlightedIndex].name;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightedIndex =
        (this.highlightedIndex - 1 + this.suggestions.length) % this.suggestions.length;
      this.searchQuery = this.suggestions[this.highlightedIndex].name;
    } else if (event.key === 'Enter') {
      if (this.highlightedIndex >= 0 && this.highlightedIndex < this.suggestions.length) {
        event.preventDefault();
        this.selectSuggestion(this.suggestions[this.highlightedIndex]);
      }
    } else if (event.key === 'Escape') {
      this.showSuggestions = false;
      this.highlightedIndex = -1;
    }
  }

  hideSuggestions(): void {
    window.setTimeout(() => {
      this.showSuggestions = false;
      this.highlightedIndex = -1;
    }, 150);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.currentUser = null;
      }
    });
  }

  async addToCart(productId: number): Promise<void> {
    try {
      await firstValueFrom(this.cartService.addItem(productId, 1));
      this.showToastMessage(this.translate.instant('PRODUCT.TOAST.ADDED'), 'success');
    } catch (error: any) {
      const status = error?.status;
      const fallback = this.translate.instant('PRODUCT.TOAST.ADD_FAILED');
      const message =
        status === 401 || status === 403
          ? this.translate.instant('PRODUCT.TOAST.SIGN_IN')
          : error?.error?.message || fallback;
      this.showToastMessage(message, 'error');
    }
  }

  goToProduct(productId: number): void {
    this.router.navigate(['/product', productId]);
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (target) {
      target.src = this.placeholderImage;
    }
  }

  private loadProduct(id: number): void {
    if (!id) {
      this.statusKey = 'PRODUCT.STATUS.NOT_FOUND';
      return;
    }
    this.statusKey = 'PRODUCT.STATUS.LOADING';
    this.isLoadingProduct = true;
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.product = product;
        this.statusKey = '';
        this.loadSimilarProducts(product);
        this.isLoadingProduct = false;
      },
      error: () => {
        this.statusKey = 'PRODUCT.STATUS.NOT_FOUND';
        this.isLoadingProduct = false;
      }
    });
  }

  private loadSimilarProducts(product: Product): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.similarProducts = products
          .filter((item) => item.id !== product.id && item.category === product.category)
          .slice(0, 6);
      }
    });
  }

  private loadAllProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.allProducts = products;
      }
    });
  }

  private showToastMessage(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    window.setTimeout(() => {
      this.showToast = false;
    }, 2200);
  }
}
