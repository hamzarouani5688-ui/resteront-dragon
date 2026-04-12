
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  isPopular?: boolean;
  isChefSpecial?: boolean;
  isNew?: boolean;
  isVeg?: boolean;
  isAvailable?: boolean;
  spiciness?: number;
  meta?: string;
}

export interface CartItem extends MenuItem {
  cartId: string;
  quantity: number;
  notes?: string;
}

export enum OrderType {
  COLLECTION = 'collection',
  DELIVERY = 'delivery',
  DINE_IN = 'dine_in'
}

export interface Order {
  id: string;
  customerName?: string;
  phone?: string;
  address?: string;
  tableNumber?: string;
  notes?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  serviceFee: number;
  total: number;
  type: OrderType;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export type ViewState = 'landing' | 'menu' | 'details' | 'success' | 'admin' | 'login';
