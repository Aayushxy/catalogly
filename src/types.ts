/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Business {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  whatsappNum: string; // Indian format: e.g. "919876543210" or "9876543210"
  upiId: string;       // e.g. "name@okpay"
  address: string;
  instagram: string;
  themeId: string;     // Color scheme key
  plan: "FREE" | "PREMIUM";
  categories: string[];
  views: number;
  ordersCount: number;
  createdAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description: string;
  price: number;
  discountPrice: number | null;
  image: string; // Main image base64 or placeholder URL
  images: string[]; // Additional images
  category: string;
  stockStatus: "IN_STOCK" | "OUT_OF_STOCK";
  variants: ProductVariant[];
  sortOrder: number;
}

export interface ProductVariant {
  name: string; // e.g. "Size" or "Color"
  options: string[]; // e.g. ["S", "M", "L"]
}

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  variantStr?: string; // e.g. "Size: M, Color: Blue"
}

export interface Order {
  id: string;
  businessId: string;
  items: OrderItem[];
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  paymentMethod: "UPI" | "CASH_ON_DELIVERY";
  paymentStatus: "PENDING" | "PAID";
  status: "NEW" | "COMPLETED" | "CANCELLED";
  createdAt: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  primary: string; // tailwind color or hex
  secondary: string;
  bg: string;
  text: string;
  cardBg: string;
  badge: string;
  preview: string; // Tailwind class background color for visual selectors
}

export interface VisitorStats {
  viewsByDay: { [date: string]: number };
  ordersByDay: { [date: string]: number };
  popularProducts: { productId: string; count: number }[];
  deviceStats: { mobile: number; desktop: number };
}
