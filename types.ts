
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
  image?: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Sale {
  id: string;
  timestamp: number;
  items: SaleItem[];
  total: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  voided?: boolean;
}

export interface AppState {
  products: Product[];
  sales: Sale[];
  config: {
    storeName: string;
    currency: string;
    backupEnabled: boolean;
    lastBackup: number | null;
  };
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  TERMINAL = 'TERMINAL',
  INVENTORY = 'INVENTORY',
  REPORTS = 'REPORTS',
  BACKUP = 'BACKUP',
  AI_INSIGHTS = 'AI_INSIGHTS',
  SUPERUSER = 'SUPERUSER'
}
