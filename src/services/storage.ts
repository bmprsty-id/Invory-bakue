import {
  Product,
  InventoryStock,
  StockTransaction,
  StockMoveInput,
  Employee
} from '../types/inventory';

const STORAGE_KEYS = {
  PRODUCTS: 'tokobahankue_products_v2',
  INVENTORY: 'tokobahankue_inventory_v2',
  TRANSACTIONS: 'tokobahankue_transactions_v2',
  ACTIVE_EMPLOYEE: 'tokobahankue_active_employee_v2',
  EMPLOYEES: 'tokobahankue_employees_v2',
};

export const DEFAULT_EMPLOYEES: Employee[] = [
  { id: 'emp_1', name: 'Budi Santoso', role: 'Staff Toko Bahan Kue' },
  { id: 'emp_2', name: 'Siti Rahma', role: 'Kepala Gudang Bahan' },
  { id: 'emp_3', name: 'Dewi Lestari', role: 'Staff Display Rak' },
  { id: 'emp_4', name: 'Andi Pratama', role: 'Karyawan Baru' },
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    barcode: '8991234567890',
    product_name: 'Tepung Terigu Cakra Kembar Emas 1kg',
    category: 'Tepung',
    unit: 'pack',
    selling_price: 15500,
    minimum_stock: 25,
    image_url: '/src/assets/images/tepung_terigu_1790634902733.jpg',
    created_at: '2026-09-27T08:00:00.000Z',
    updated_at: '2026-09-28T10:00:00.000Z',
    is_active: true,
  },
  {
    id: 'prod_2',
    barcode: '8991234567891',
    product_name: 'Wijsman Dutch Butter 1kg (Mentega Kaleng)',
    category: 'Mentega & Butter',
    unit: 'kaleng',
    selling_price: 315000,
    minimum_stock: 8,
    image_url: '/src/assets/images/mentega_butter_1790634913607.jpg',
    created_at: '2026-09-27T08:15:00.000Z',
    updated_at: '2026-09-28T09:30:00.000Z',
    is_active: true,
  },
  {
    id: 'prod_3',
    barcode: '8991234567892',
    product_name: 'Colatta Dark Compound Chocolate 1kg',
    category: 'Cokelat & Kakao',
    unit: 'blok',
    selling_price: 54000,
    minimum_stock: 15,
    image_url: '/src/assets/images/cokelat_compound_1790634925251.jpg',
    created_at: '2026-09-27T08:30:00.000Z',
    updated_at: '2026-09-28T07:45:00.000Z',
    is_active: true,
  },
  {
    id: 'prod_4',
    barcode: '8991234567893',
    product_name: 'Saf-Instant Red Yeast Ragi Kering 500g',
    category: 'Ragi & Pengembang',
    unit: 'pack',
    selling_price: 42000,
    minimum_stock: 12,
    image_url: '/src/assets/images/ragi_instan_1790634937004.jpg',
    created_at: '2026-09-27T08:45:00.000Z',
    updated_at: '2026-09-28T11:20:00.000Z',
    is_active: true,
  },
  {
    id: 'prod_5',
    barcode: '8991234567894',
    product_name: 'Keju Cheddar Prochiz Gold Blok 2kg',
    category: 'Keju & Dairy',
    unit: 'blok',
    selling_price: 118000,
    minimum_stock: 8,
    image_url: '/src/assets/images/keju_cheddar_1790634947232.jpg',
    created_at: '2026-09-27T09:00:00.000Z',
    updated_at: '2026-09-28T12:00:00.000Z',
    is_active: true,
  },
  {
    id: 'prod_6',
    barcode: '8991234567895',
    product_name: 'Tepung Terigu Segitiga Biru 1kg',
    category: 'Tepung',
    unit: 'pack',
    selling_price: 13500,
    minimum_stock: 30,
    created_at: '2026-09-27T09:10:00.000Z',
    updated_at: '2026-09-28T06:30:00.000Z',
    is_active: true,
  },
  {
    id: 'prod_7',
    barcode: '8991234567896',
    product_name: 'Gula Halus Claris Icing Sugar 500g',
    category: 'Gula & Pemanis',
    unit: 'pack',
    selling_price: 14000,
    minimum_stock: 15,
    created_at: '2026-09-27T09:20:00.000Z',
    updated_at: '2026-09-28T09:15:00.000Z',
    is_active: true,
  },
  {
    id: 'prod_8',
    barcode: '8991234567897',
    product_name: 'Baking Powder Hercules Double Acting 450g',
    category: 'Ragi & Pengembang',
    unit: 'kaleng',
    selling_price: 38500,
    minimum_stock: 10,
    created_at: '2026-09-27T09:30:00.000Z',
    updated_at: '2026-09-28T08:00:00.000Z',
    is_active: true,
  }
];

export const DEFAULT_INVENTORY: Record<string, { warehouse: number; display: number }> = {
  prod_1: { warehouse: 80, display: 20 }, // Tepung Cakra total: 100
  prod_2: { warehouse: 24, display: 6 },  // Wijsman total: 30
  prod_3: { warehouse: 35, display: 15 }, // Colatta Dark total: 50
  prod_4: { warehouse: 5, display: 3 },   // Saf-Instant total: 8 (Low stock! min 12)
  prod_5: { warehouse: 12, display: 4 },  // Prochiz 2kg total: 16
  prod_6: { warehouse: 70, display: 25 }, // Segitiga Biru total: 95
  prod_7: { warehouse: 40, display: 18 }, // Gula halus total: 58
  prod_8: { warehouse: 4, display: 2 },   // Baking powder total: 6 (Low stock! min 10)
};

export const DEFAULT_TRANSACTIONS: StockTransaction[] = [
  {
    id: 'tx_1',
    product_id: 'prod_1',
    product_name: 'Tepung Terigu Cakra Kembar Emas 1kg',
    barcode: '8991234567890',
    unit: 'pack',
    transaction_type: 'IN',
    to_location: 'warehouse',
    quantity: 50,
    reference_note: 'Penerimaan muatan distributor Indofood',
    created_by: 'Siti Rahma',
    created_at: '2026-09-28T07:30:00.000Z',
    previous_stock: { warehouse: 30, display: 20 },
    new_stock: { warehouse: 80, display: 20 },
  },
  {
    id: 'tx_2',
    product_id: 'prod_2',
    product_name: 'Wijsman Dutch Butter 1kg (Mentega Kaleng)',
    barcode: '8991234567891',
    unit: 'kaleng',
    transaction_type: 'TRANSFER',
    from_location: 'warehouse',
    to_location: 'display',
    quantity: 6,
    reference_note: 'Restok rak pajang depan',
    created_by: 'Budi Santoso',
    created_at: '2026-09-28T08:15:00.000Z',
    previous_stock: { warehouse: 30, display: 0 },
    new_stock: { warehouse: 24, display: 6 },
  },
  {
    id: 'tx_3',
    product_id: 'prod_3',
    product_name: 'Colatta Dark Compound Chocolate 1kg',
    barcode: '8991234567892',
    unit: 'blok',
    transaction_type: 'OUT',
    from_location: 'display',
    quantity: 3,
    reference_note: 'Penjualan kasir ke pelanggan UMKM',
    created_by: 'Dewi Lestari',
    created_at: '2026-09-28T09:40:00.000Z',
    previous_stock: { warehouse: 35, display: 18 },
    new_stock: { warehouse: 35, display: 15 },
  }
];

class InventoryDatabase {
  private products: Product[] = [];
  private inventory: Record<string, { warehouse: number; display: number }> = {};
  private transactions: StockTransaction[] = [];
  private employees: Employee[] = [];
  private activeEmployee: Employee = DEFAULT_EMPLOYEES[0];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    try {
      const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      const storedInventory = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      const storedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const storedEmployees = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      const storedActiveEmp = localStorage.getItem(STORAGE_KEYS.ACTIVE_EMPLOYEE);

      if (storedProducts && storedInventory) {
        this.products = JSON.parse(storedProducts);
        // Backfill image_url from defaults if missing
        let hasImageUpdates = false;
        this.products = this.products.map(p => {
          if (!p.image_url) {
            const def = DEFAULT_PRODUCTS.find(d => d.barcode === p.barcode);
            if (def && def.image_url) {
              hasImageUpdates = true;
              return { ...p, image_url: def.image_url };
            }
          }
          return p;
        });
        if (hasImageUpdates) {
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
        }
        this.inventory = JSON.parse(storedInventory);
        this.transactions = storedTransactions ? JSON.parse(storedTransactions) : [];
        this.employees = storedEmployees ? JSON.parse(storedEmployees) : DEFAULT_EMPLOYEES;
        this.activeEmployee = storedActiveEmp ? JSON.parse(storedActiveEmp) : DEFAULT_EMPLOYEES[0];
      } else {
        this.resetToDefaults();
      }
    } catch {
      this.resetToDefaults();
    }
  }

  private save() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(this.inventory));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(this.employees));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_EMPLOYEE, JSON.stringify(this.activeEmployee));
    } catch {
      console.error('Failed to persist inventory state to localStorage');
    }
  }

  resetToDefaults() {
    this.products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
    this.inventory = JSON.parse(JSON.stringify(DEFAULT_INVENTORY));
    this.transactions = JSON.parse(JSON.stringify(DEFAULT_TRANSACTIONS));
    this.employees = JSON.parse(JSON.stringify(DEFAULT_EMPLOYEES));
    this.activeEmployee = this.employees[0];
    this.save();
  }

  // Employee Methods
  getEmployees(): Employee[] {
    return [...this.employees];
  }

  getActiveEmployee(): Employee {
    return this.activeEmployee;
  }

  setActiveEmployee(emp: Employee) {
    this.activeEmployee = emp;
    this.save();
  }

  addEmployee(name: string, role: string): Employee {
    const newEmp: Employee = {
      id: `emp_${Date.now()}`,
      name: name.trim(),
      role: role.trim() || 'Staff',
    };
    this.employees.push(newEmp);
    this.save();
    return newEmp;
  }

  // Product Methods
  getProducts(includeArchived = false): Product[] {
    if (includeArchived) return [...this.products];
    return this.products.filter(p => p.is_active);
  }

  getProductById(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  getProductByBarcode(barcode: string): Product | undefined {
    const clean = barcode.trim();
    return this.products.find(p => p.is_active && p.barcode.toLowerCase() === clean.toLowerCase());
  }

  getStock(productId: string): InventoryStock {
    const stock = this.inventory[productId] || { warehouse: 0, display: 0 };
    return {
      warehouse: stock.warehouse || 0,
      display: stock.display || 0,
      total: (stock.warehouse || 0) + (stock.display || 0),
    };
  }

  // Check unique barcode
  isBarcodeTaken(barcode: string, excludeProductId?: string): boolean {
    const clean = barcode.trim().toLowerCase();
    return this.products.some(
      p => p.is_active && p.barcode.toLowerCase() === clean && p.id !== excludeProductId
    );
  }

  // Register new product with atomic stock entry
  createProduct(
    productData: {
      barcode: string;
      product_name: string;
      category: string;
      unit: string;
      selling_price: number;
      minimum_stock: number;
      image_url?: string;
    },
    initialStock?: {
      warehouse: number;
      display: number;
    },
    employeeName?: string
  ): { success: boolean; product?: Product; error?: string } {
    const barcode = productData.barcode.trim();
    if (!barcode) return { success: false, error: 'Product barcode is required.' };
    if (!productData.product_name.trim()) return { success: false, error: 'Product name is required.' };

    if (this.isBarcodeTaken(barcode)) {
      return { success: false, error: 'This product is already registered.' };
    }

    const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newProduct: Product = {
      id,
      barcode,
      product_name: productData.product_name.trim(),
      category: productData.category.trim() || 'General',
      unit: productData.unit.trim() || 'pcs',
      selling_price: Math.max(0, productData.selling_price || 0),
      minimum_stock: Math.max(0, productData.minimum_stock || 0),
      image_url: productData.image_url,
      created_at: now,
      updated_at: now,
      is_active: true,
    };

    const whQty = Math.max(0, initialStock?.warehouse || 0);
    const dispQty = Math.max(0, initialStock?.display || 0);

    this.products.unshift(newProduct);
    this.inventory[id] = {
      warehouse: whQty,
      display: dispQty,
    };

    // If initial stock provided, log transaction
    if (whQty > 0 || dispQty > 0) {
      const emp = employeeName || this.activeEmployee.name;
      if (whQty > 0) {
        this.transactions.unshift({
          id: `tx_${Date.now()}_wh`,
          product_id: id,
          product_name: newProduct.product_name,
          barcode: newProduct.barcode,
          unit: newProduct.unit,
          transaction_type: 'IN',
          to_location: 'warehouse',
          quantity: whQty,
          reference_note: 'Initial stock registration (Warehouse)',
          created_by: emp,
          created_at: now,
          previous_stock: { warehouse: 0, display: 0 },
          new_stock: { warehouse: whQty, display: 0 },
        });
      }
      if (dispQty > 0) {
        this.transactions.unshift({
          id: `tx_${Date.now()}_disp`,
          product_id: id,
          product_name: newProduct.product_name,
          barcode: newProduct.barcode,
          unit: newProduct.unit,
          transaction_type: 'IN',
          to_location: 'display',
          quantity: dispQty,
          reference_note: 'Initial stock registration (Display)',
          created_by: emp,
          created_at: now,
          previous_stock: { warehouse: whQty, display: 0 },
          new_stock: { warehouse: whQty, display: dispQty },
        });
      }
    }

    this.save();
    return { success: true, product: newProduct };
  }

  updateProduct(
    id: string,
    updates: Partial<Omit<Product, 'id' | 'created_at'>>
  ): { success: boolean; product?: Product; error?: string } {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) return { success: false, error: 'Product not found.' };

    if (updates.barcode) {
      if (this.isBarcodeTaken(updates.barcode, id)) {
        return { success: false, error: 'Another product with this barcode already exists.' };
      }
    }

    const updated: Product = {
      ...this.products[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.products[index] = updated;
    this.save();
    return { success: true, product: updated };
  }

  // Rule 6: Deleting a product should NOT delete historical transactions.
  // We archive it by setting is_active = false.
  archiveProduct(id: string): { success: boolean; error?: string } {
    const product = this.getProductById(id);
    if (!product) return { success: false, error: 'Product not found.' };

    product.is_active = false;
    product.updated_at = new Date().toISOString();
    this.save();
    return { success: true };
  }

  // Atomic Stock Movement
  processStockMovement(input: StockMoveInput): {
    success: boolean;
    error?: string;
    transaction?: StockTransaction;
    newStock?: InventoryStock;
  } {
    const product = this.getProductById(input.productId);
    if (!product) return { success: false, error: 'Product not found in system.' };

    if (input.quantity <= 0 || !Number.isFinite(input.quantity)) {
      return { success: false, error: 'Please enter a valid positive quantity.' };
    }

    const current = this.inventory[product.id] || { warehouse: 0, display: 0 };
    const prevWarehouse = current.warehouse || 0;
    const prevDisplay = current.display || 0;

    let newWarehouse = prevWarehouse;
    let newDisplay = prevDisplay;
    const now = new Date().toISOString();
    const employee = input.employeeName || this.activeEmployee.name;

    // Movement validation and atomic calculation
    if (input.type === 'IN') {
      const target = input.location || 'warehouse';
      if (target === 'warehouse') {
        newWarehouse += input.quantity;
      } else {
        newDisplay += input.quantity;
      }
    } else if (input.type === 'OUT') {
      const source = input.location || 'display';
      if (source === 'warehouse') {
        if (prevWarehouse < input.quantity) {
          return {
            success: false,
            error: `Insufficient warehouse stock. Current: ${prevWarehouse} ${product.unit}. Requested: ${input.quantity} ${product.unit}.`,
          };
        }
        newWarehouse -= input.quantity;
      } else {
        if (prevDisplay < input.quantity) {
          return {
            success: false,
            error: `Insufficient display stock. Current: ${prevDisplay} ${product.unit}. Requested: ${input.quantity} ${product.unit}.`,
          };
        }
        newDisplay -= input.quantity;
      }
    } else if (input.type === 'TRANSFER') {
      const from = input.fromLocation || 'warehouse';
      const to = input.toLocation || 'display';

      if (from === to) {
        return { success: false, error: 'Source and destination locations cannot be the same.' };
      }

      if (from === 'warehouse') {
        if (prevWarehouse < input.quantity) {
          return {
            success: false,
            error: `Insufficient warehouse stock to transfer. Current: ${prevWarehouse} ${product.unit}. Requested: ${input.quantity} ${product.unit}.`,
          };
        }
        newWarehouse -= input.quantity;
        newDisplay += input.quantity;
      } else {
        if (prevDisplay < input.quantity) {
          return {
            success: false,
            error: `Insufficient display stock to transfer. Current: ${prevDisplay} ${product.unit}. Requested: ${input.quantity} ${product.unit}.`,
          };
        }
        newDisplay -= input.quantity;
        newWarehouse += input.quantity;
      }

      // Rule 3: Transfers do not change total inventory!
      const prevTotal = prevWarehouse + prevDisplay;
      const nextTotal = newWarehouse + newDisplay;
      if (prevTotal !== nextTotal) {
        return { success: false, error: 'Data integrity violation: Transfer altered total stock!' };
      }
    } else {
      return { success: false, error: 'Unknown transaction type.' };
    }

    // Rule 4: Stock cannot become negative!
    if (newWarehouse < 0 || newDisplay < 0) {
      return { success: false, error: 'Stock calculation resulted in negative inventory!' };
    }

    // Apply update atomically
    this.inventory[product.id] = {
      warehouse: newWarehouse,
      display: newDisplay,
    };

    // Rule 5: Every stock change must create a transaction history record.
    const transaction: StockTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      product_id: product.id,
      product_name: product.product_name,
      barcode: product.barcode,
      unit: product.unit,
      transaction_type: input.type,
      from_location: input.type === 'TRANSFER' ? input.fromLocation : (input.type === 'OUT' ? input.location : undefined),
      to_location: input.type === 'TRANSFER' ? input.toLocation : (input.type === 'IN' ? input.location : undefined),
      quantity: input.quantity,
      reference_note: input.note?.trim() || `${input.type} processed`,
      created_by: employee,
      created_at: now,
      previous_stock: {
        warehouse: prevWarehouse,
        display: prevDisplay,
      },
      new_stock: {
        warehouse: newWarehouse,
        display: newDisplay,
      },
    };

    this.transactions.unshift(transaction);
    this.save();

    return {
      success: true,
      transaction,
      newStock: {
        warehouse: newWarehouse,
        display: newDisplay,
        total: newWarehouse + newDisplay,
      },
    };
  }

  getTransactions(limit = 100): StockTransaction[] {
    return this.transactions.slice(0, limit);
  }

  getTransactionsByProduct(productId: string): StockTransaction[] {
    return this.transactions.filter(t => t.product_id === productId);
  }

  // Dashboard Stats
  getDashboardStats() {
    const activeProducts = this.getProducts();
    let totalStockPcs = 0;
    let totalWarehousePcs = 0;
    let totalDisplayPcs = 0;
    let lowStockCount = 0;

    activeProducts.forEach(prod => {
      const stock = this.getStock(prod.id);
      totalWarehousePcs += stock.warehouse;
      totalDisplayPcs += stock.display;
      totalStockPcs += stock.total;

      if (stock.total <= prod.minimum_stock) {
        lowStockCount++;
      }
    });

    return {
      totalProducts: activeProducts.length,
      totalStockPcs,
      totalWarehousePcs,
      totalDisplayPcs,
      lowStockCount,
    };
  }

  // Bulk CSV Import
  importCsv(csvContent: string): {
    totalRows: number;
    imported: number;
    skipped: number;
    errors: string[];
  } {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) {
      return { totalRows: 0, imported: 0, skipped: 0, errors: ['CSV content is empty or contains only headers.'] };
    }

    const header = lines[0].toLowerCase();
    const rows = lines.slice(1);
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    rows.forEach((line, index) => {
      const rowNum = index + 2;
      const parts = line.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      if (parts.length < 2) return;

      const barcode = parts[0];
      const name = parts[1];
      const category = parts[2] || 'Cake';
      const unit = parts[3] || 'pcs';
      const price = parseFloat(parts[4]) || 0;
      const minStock = parseInt(parts[5], 10) || 5;
      const initialWarehouse = parseInt(parts[6], 10) || 0;

      if (!barcode || !name) {
        skipped++;
        errors.push(`Row ${rowNum}: Barcode and product name are required.`);
        return;
      }

      if (this.isBarcodeTaken(barcode)) {
        skipped++;
        errors.push(`Row ${rowNum}: Barcode "${barcode}" already exists.`);
        return;
      }

      const res = this.createProduct(
        {
          barcode,
          product_name: name,
          category,
          unit,
          selling_price: price,
          minimum_stock: minStock,
        },
        initialWarehouse > 0 ? { warehouse: initialWarehouse, display: 0 } : undefined,
        'CSV Import'
      );

      if (res.success) {
        imported++;
      } else {
        skipped++;
        errors.push(`Row ${rowNum}: ${res.error}`);
      }
    });

    return {
      totalRows: rows.length,
      imported,
      skipped,
      errors,
    };
  }

  // Export CSV
  exportCsv(): string {
    const headers = ['barcode', 'product_name', 'category', 'unit', 'selling_price', 'minimum_stock', 'warehouse_stock', 'display_stock', 'total_stock'];
    const rows = this.getProducts().map(prod => {
      const stock = this.getStock(prod.id);
      return [
        `"${prod.barcode}"`,
        `"${prod.product_name.replace(/"/g, '""')}"`,
        `"${prod.category}"`,
        `"${prod.unit}"`,
        prod.selling_price,
        prod.minimum_stock,
        stock.warehouse,
        stock.display,
        stock.total,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}

export const db = new InventoryDatabase();

// Compress image uploaded by user or snapped from mobile camera into a compact data URL
export function compressImageFile(file: File, maxDimension = 600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
