import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Product, ProductRequest } from '../../models/product.model';
import { AuthResponse, AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  products: Product[] = [];
  displayedProducts: Product[] = [];
  categories: string[] = [];
  selectedCategory = 'All';
  statusText = 'Loading products...';
  searchQuery = '';
  suggestions: Product[] = [];
  showSuggestions = false;
  highlightedIndex = -1;
  panelProduct: Product | null = null;
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
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
    this.loadUser();
  }

  loadProducts(query?: string): void {
    this.statusText = 'Loading products...';
    this.productService.getProducts(query).subscribe({
      next: (products) => {
        this.products = products;
        this.refreshCategories();
        this.applyFilters();
        this.statusText = this.displayedProducts.length ? '' : 'No products found.';
      },
      error: () => {
        this.statusText = 'Unable to load products. Please sign in.';
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
    this.showPanel(product);
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

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  showPanel(product: Product): void {
    this.panelProduct = product;
  }

  hidePanel(): void {
    this.panelProduct = null;
  }

  onBackdropClose(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target && target.classList.contains('modal-backdrop')) {
      this.hidePanel();
    }
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (target) {
      target.src = this.placeholderImage;
    }
  }

  async addToCart(productId: number): Promise<void> {
    try {
      const cartId = await this.ensureCart();
      await firstValueFrom(this.cartService.addItem(cartId, productId, 1));
      this.showToastMessage('Added to cart.', 'success');
    } catch (error) {
      this.showToastMessage('Please sign in as user to add items.', 'error');
    }
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
      this.addError = 'Name, description, image, and price are required.';
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
        this.addError = error?.error?.message || 'Unable to add product.';
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
      this.editError = 'Name, description, image, and price are required.';
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
        this.editError = error?.error?.message || 'Unable to update product.';
      }
    });
  }

  deleteProduct(product: Product): void {
    if (!confirm(`Delete ${product.name}?`)) {
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
      return;
    }
    this.displayedProducts = this.products.filter(
      (product) => product.category === this.selectedCategory
    );
  }
}
