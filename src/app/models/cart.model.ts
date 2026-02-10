export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total: number;
  currency: string;
}
