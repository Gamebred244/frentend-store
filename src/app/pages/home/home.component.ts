import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Product, ProductRequest } from '../../models/product.model';
import { AuthResponse, AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { LanguageService } from '../../services/language.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  products: Product[] = [];
  displayedProducts: Product[] = [];
  pagedProducts: Product[] = [];
  categories: string[] = [];
  selectedCategory = 'All';
  statusKey: string | null = 'HOME.STATUS.LOADING';
  isLoadingProducts = false;
  currentPage = 1;
  pageSize = 12;
  totalPages = 1;
  searchQuery = '';
  suggestions: Product[] = [];
  showSuggestions = false;
  highlightedIndex = -1;
  currentUser: AuthResponse | null = null;
  placeholderImage = 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=600&q=80';
  showAddModal = false;
  showEditModal = false;
  addError = '';
  editError = '';
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  showToast = false;
  editTargetId: number | null = null;
  isNavCompact = false;
  addForm: ProductRequest = {
    name: '',
    description: '',
    price: 0,
    currency: 'USD',
    imageUrl: '',
    category: '',
    sku: '',
    stockQuantity: 100,
    active: true
  };
  editForm: ProductRequest = {
    name: '',
    description: '',
    price: 0,
    currency: 'USD',
    imageUrl: '',
    category: '',
    sku: '',
    stockQuantity: 100,
    active: true
  };

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private languageService: LanguageService,
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const query = params.get('q') || '';
      this.searchQuery = query;
      this.loadProducts(query || undefined);
    });
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
    this.loadUser();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isNavCompact = window.scrollY > 40;
  }

  loadProducts(query?: string): void {
    this.statusKey = 'HOME.STATUS.LOADING';
    this.isLoadingProducts = true;
    this.currentPage = 1;
    this.productService.getProducts(query).subscribe({
      next: (products) => {
        this.products = products;
        this.refreshCategories();
        this.applyFilters();
        this.statusKey = this.displayedProducts.length ? '' : 'HOME.STATUS.NO_RESULTS';
        this.isLoadingProducts = false;
      },
      error: () => {
        this.statusKey = 'HOME.STATUS.NEED_SIGNIN';
        this.isLoadingProducts = false;
      }
    });
  }

  onSearch(): void {
    this.loadProducts(this.searchQuery.trim());
    this.showSuggestions = false;
  }

  updateSuggestions(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.suggestions = [];
      this.showSuggestions = false;
      this.highlightedIndex = -1;
      return;
    }
    this.suggestions = this.products
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

  changeLanguage(lang: string): void {
    this.languageService.setLanguage(lang);
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.currentPage = 1;
    this.applyFilters();
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

  async addToCart(productId: number): Promise<void> {
    try {
      await firstValueFrom(this.cartService.addItem(productId, 1));
      this.showToastMessage(this.translate.instant('HOME.TOAST.ADDED'), 'success');
    } catch (error: any) {
      const status = error?.status;
      const fallback = this.translate.instant('HOME.TOAST.ADD_FAILED');
      const message =
        status === 401 || status === 403
          ? this.translate.instant('HOME.TOAST.SIGN_IN')
          : error?.error?.message || fallback;
      this.showToastMessage(message, 'error');
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

  openAddModal(): void {
    this.addError = '';
    this.addForm = {
      name: '',
      description: '',
      price: 0,
      currency: 'USD',
      imageUrl: '',
      category: '',
      sku: '',
      stockQuantity: 100,
      active: true
    };
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  submitProduct(): void {
    this.addError = '';
    if (!this.addForm.name || !this.addForm.description || !this.addForm.imageUrl || this.addForm.price <= 0) {
      this.addError = this.translate.instant('HOME.ERRORS.REQUIRED_FIELDS');
      return;
    }
    this.productService.createProduct(this.addForm).subscribe({
      next: (product) => {
        this.products = [product, ...this.products];
        this.refreshCategories();
        this.applyFilters();
        this.showAddModal = false;
      },
      error: (error) => {
        this.addError = error?.error?.message || this.translate.instant('HOME.ERRORS.ADD_FAILED');
      }
    });
  }

  openEditModal(product: Product): void {
    this.editError = '';
    this.editTargetId = product.id;
    this.editForm = {
      name: product.name,
      description: product.description,
      price: Number(product.price),
      currency: product.currency,
      imageUrl: product.imageUrl,
      category: product.category,
      sku: product.sku,
      stockQuantity: product.stockQuantity,
      active: product.active
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editTargetId = null;
  }

  submitEdit(): void {
    if (this.editTargetId == null) {
      return;
    }
    this.editError = '';
    if (!this.editForm.name || !this.editForm.description || !this.editForm.imageUrl || this.editForm.price <= 0) {
      this.editError = this.translate.instant('HOME.ERRORS.REQUIRED_FIELDS');
      return;
    }
    this.productService.updateProduct(this.editTargetId, this.editForm).subscribe({
      next: (updated) => {
        this.products = this.products.map((item) => (item.id === updated.id ? updated : item));
        this.refreshCategories();
        this.applyFilters();
        this.closeEditModal();
      },
      error: (error) => {
        this.editError = error?.error?.message || this.translate.instant('HOME.ERRORS.UPDATE_FAILED');
      }
    });
  }

  deleteProduct(product: Product): void {
    if (!confirm(this.translate.instant('HOME.CONFIRM.DELETE', { name: product.name }))) {
      return;
    }
    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.products = this.products.filter((item) => item.id !== product.id);
        this.refreshCategories();
        this.applyFilters();
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

  private refreshCategories(): void {
    const set = new Set(this.products.map((product) => product.category).filter((value) => value));
    this.categories = ['All', ...Array.from(set)];
    if (!this.categories.includes(this.selectedCategory)) {
      this.selectedCategory = 'All';
    }
  }

  private applyFilters(): void {
    if (this.selectedCategory === 'All') {
      this.displayedProducts = [...this.products];
    } else {
      this.displayedProducts = this.products.filter(
        (product) => product.category === this.selectedCategory
      );
    }
    this.updatePagination();
  }

  private updatePagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.displayedProducts.length / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedProducts = this.displayedProducts.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.updatePagination();
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }
}
