export type LocationType = 'warehouse' | 'display';

export type MovementType = 'IN' | 'TRANSFER' | 'OUT';

export interface Product {
  id: string;
  barcode: string;
  product_name: string;
  category: string;
  unit: string;
  selling_price: number;
  minimum_stock: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface InventoryStock {
  warehouse: number;
  display: number;
  total: number;
}

export interface StockTransaction {
  id: string;
  product_id: string;
  product_name: string;
  barcode: string;
  unit: string;
  transaction_type: MovementType;
  from_location?: LocationType;
  to_location?: LocationType;
  quantity: number;
  reference_note: string;
  created_by: string;
  created_at: string;
  previous_stock?: {
    warehouse: number;
    display: number;
  };
  new_stock?: {
    warehouse: number;
    display: number;
  };
}

export interface Employee {
  id: string;
  name: string;
  role: string;
}

export interface StockMoveInput {
  productId: string;
  type: MovementType;
  location?: LocationType;
  fromLocation?: LocationType;
  toLocation?: LocationType;
  quantity: number;
  note?: string;
  employeeName: string;
}
