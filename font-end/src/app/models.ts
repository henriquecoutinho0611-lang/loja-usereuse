export interface Product {
  id: string;
  title: string;
  description: string;
  department: string;
  price: number;
  oldPrice?: number | null;
  width: number;
  height: number;
  image: string;
  ambientImage?: string | null;
  featured: boolean;
  active?: boolean;
  ironColors: string[];
  woodColors: string[];
  woodTypes: string[];
  upholsteryColors: string[];
}

export interface Banner {
  id?: string;
  eyebrow?: string;
  title: string;
  text?: string;
  cta?: string;
  image: string;
  tag?: string;
}

export interface AccountProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  role: "customer" | "merchant";
  name: string;
  email: string;
  phone?: string;
}

export interface StoreOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  deliveryDate: string | null;
  shippingCost: number;
  shippingCategory: ShippingQuote["category"];
  items: {
    productId: string;
    title: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    selection: ProductSelection;
  }[];
}

export interface MerchantOrder extends StoreOrder {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  zipCode: string;
  address: string;
  items: StoreOrder["items"];
}

export interface ProductSelection {
  ironColor: string | null;
  woodColor: string | null;
  woodType: string | null;
  upholsteryColor: string | null;
}

export interface ShippingQuote {
  price?: number | null;
  estimatedDays?: number | null;
  demo: boolean;
  city: string;
  state: string;
  category: "SAO_PAULO_CITY" | "SAO_PAULO_STATE" | "CONTACT";
  message: string;
}

export interface StoreSettings {
  whatsappNumber: string;
  saoPauloCityPrice: number | null;
  saoPauloStatePrice: number | null;
  deliveryOutsideStateMessage: string;
  paymentMessage: string;
}

export interface OrderRequest {
  customer: { name: string; email: string; phone: string } | null;
  zipCode: string;
  address: string;
  items: { productId: string; quantity: number; selection: ProductSelection }[];
}

export interface ProductRequest {
  title: string;
  description: string;
  department: string;
  price: number;
  oldPrice: number | null;
  width: number;
  height: number;
  image: string;
  ambientImage: string | null;
  featured: boolean;
  ironColors: string[];
  woodColors: string[];
  woodTypes: string[];
  upholsteryColors: string[];
}
