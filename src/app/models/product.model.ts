export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  sku: string;
  stockQuantity: number;
  imageUrl: string;
  category: string;
  active: boolean;
}

export interface ProductRequest {
  name: string;
  description: string;
  price: number;
  currency: string;
  sku?: string;
  stockQuantity?: number;
  imageUrl: string;
  category?: string;
  active?: boolean;
}
