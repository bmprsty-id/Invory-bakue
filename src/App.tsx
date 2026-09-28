import React, { useState, useEffect, useMemo } from 'react';
import {
  Camera,
  Package,
  Layers,
  Clock,
  Plus,
  Search,
  ArrowRightLeft,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  RotateCcw,
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Store,
  Warehouse,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { Product, MovementType, Employee } from './types/inventory';
import { db } from './services/storage';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { ProductFormModal } from './components/ProductFormModal';
import { StockMovementModal } from './components/StockMovementModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { EmployeeSelector } from './components/EmployeeSelector';
import { CsvImportModal } from './components/CsvImportModal';
import { BarcodeBadge } from './components/BarcodeBadge';

type NavTab = 'dashboard' | 'products' | 'stock' | 'history';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Database snapshot version for reactivity
  const [dbVersion, setDbVersion] = useState(0);
  const refreshDb = () => setDbVersion((v) => v + 1);

  // Active Employee
  const [activeEmployee, setActiveEmployee] = useState<Employee>(() => db.getActiveEmployee());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Modal contexts
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [movementDefaultType, setMovementDefaultType] = useState<MovementType>('IN');
  const [scannedBarcodeForNew, setScannedBarcodeForNew] = useState<string>('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Sync products and stats when dbVersion changes
  const products = useMemo(() => {
    // depend on dbVersion
    void dbVersion;
    return db.getProducts();
  }, [dbVersion]);

  const dashboardStats = useMemo(() => {
    void dbVersion;
    return db.getDashboardStats();
  }, [dbVersion]);

  const recentTransactions = useMemo(() => {
    void dbVersion;
    return db.getTransactions(15);
  }, [dbVersion]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchSearch =
        !q ||
        p.product_name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;

      if (showLowStockOnly) {
        const stock = db.getStock(p.id);
        const isLow = stock.total <= p.minimum_stock;
        return matchSearch && matchCategory && isLow;
      }

      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, selectedCategory, showLowStockOnly, dbVersion]);

  // Core Workflow: User scans a barcode
  const handleScanResult = (barcode: string) => {
    setIsScannerOpen(false);
    const existing = db.getProductByBarcode(barcode);

    if (existing) {
      // PRODUCT FOUND: Open stock movement or detail
      setSelectedProduct(existing);
      setMovementDefaultType('IN');
      setIsMovementModalOpen(true);
      showToast(`Product identified: ${existing.product_name}`);
    } else {
      // PRODUCT NOT FOUND: Open product registration prefilled with this barcode
      setScannedBarcodeForNew(barcode);
      setEditingProduct(null);
      setIsProductFormOpen(true);
      showToast(`New barcode detected: ${barcode}`);
    }
  };

  // Handlers for modal actions
  const handleProductSaved = (product: Product, isNew: boolean, continueScanMode?: boolean) => {
    refreshDb();
    if (isNew) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      showToast(`Added: ${product.product_name}`);
    } else {
      showToast(`Updated: ${product.product_name}`);
    }

    if (continueScanMode) {
      // Reopen scanner immediately for initial data collection mode
      setTimeout(() => {
        setIsScannerOpen(true);
      }, 350);
    }
  };

  const handleStockMoveSuccess = () => {
    refreshDb();
    showToast('Stock updated successfully.');
  };

  const openProductDetail = (prod: Product) => {
    setSelectedProduct(prod);
    setIsDetailModalOpen(true);
  };

  const openStockMovement = (prod: Product, type: MovementType) => {
    setSelectedProduct(prod);
    setMovementDefaultType(type);
    setIsMovementModalOpen(true);
  };

  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsProductFormOpen(true);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all inventory and transaction records to default bakery sample data?')) {
      db.resetToDefaults();
      refreshDb();
      showToast('Database reset to bakery defaults.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 flex flex-col font-sans select-none antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 inset-x-0 z-60 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="bg-neutral-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-neutral-800 flex items-center gap-2 text-xs font-semibold backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-amber-200/70 shadow-2xs">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-white flex items-center justify-center shadow-sm shadow-amber-500/30">
              <Store className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-base tracking-tight text-neutral-900 leading-none">
                  TOKO BAHAN KUE
                </h1>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 uppercase tracking-wider">
                  TBK
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 font-medium">Inventaris Bahan &amp; Barcode Scanner</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <EmployeeSelector
              currentEmployee={activeEmployee}
              onEmployeeChange={(emp) => setActiveEmployee(emp)}
            />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 pb-28 space-y-4">
        {/* ======================================================== */}
        {/* DASHBOARD TAB */}
        {/* ======================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* BIG PROMINENT SCAN BUTTON (Mobile Primary Action) */}
            <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-3xl p-5 text-white shadow-xl shadow-amber-600/25 relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-200 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Fast Mobile Workflow
                </span>
                <h2 className="text-xl sm:text-2xl font-black mb-1">
                  Kelola Stok Bahan Kue
                </h2>
                <p className="text-xs text-amber-100 mb-4 max-w-xs font-medium">
                  Scan barcode kemasan tepung, butter, cokelat, atau ragi untuk stok masuk, pindah rak, atau cek stok
                </p>

                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-neutral-50 active:scale-97 text-neutral-900 font-black text-base shadow-lg shadow-black/15 flex items-center justify-center gap-3 transition-transform cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                    <Camera className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <span>SCAN PRODUCT</span>
                </button>
              </div>
            </div>

            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Total Products */}
              <button
                type="button"
                onClick={() => {
                  setShowLowStockOnly(false);
                  setActiveTab('products');
                }}
                className="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-2xs text-left hover:border-amber-400 transition-colors"
              >
                <div className="flex items-center justify-between text-neutral-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Catalog</span>
                  <Package className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-neutral-900 leading-none">
                  {dashboardStats.totalProducts}
                </div>
                <span className="text-[11px] text-neutral-400 font-medium">Products</span>
              </button>

              {/* Total Stock */}
              <button
                type="button"
                onClick={() => setActiveTab('stock')}
                className="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-2xs text-left hover:border-amber-400 transition-colors"
              >
                <div className="flex items-center justify-between text-neutral-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-neutral-900 leading-none">
                  {dashboardStats.totalStockPcs.toLocaleString()}
                </div>
                <span className="text-[11px] text-neutral-400 font-medium">Items in shop</span>
              </button>

              {/* Low Stock */}
              <button
                type="button"
                onClick={() => {
                  setShowLowStockOnly(true);
                  setActiveTab('products');
                }}
                className={`p-3.5 rounded-2xl border shadow-2xs text-left transition-colors ${
                  dashboardStats.lowStockCount > 0
                    ? 'bg-rose-50 border-rose-200 hover:border-rose-400'
                    : 'bg-white border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between text-neutral-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Alert</span>
                  <AlertTriangle className={`w-4 h-4 ${dashboardStats.lowStockCount > 0 ? 'text-rose-600' : 'text-neutral-400'}`} />
                </div>
                <div className={`text-2xl font-black leading-none ${dashboardStats.lowStockCount > 0 ? 'text-rose-700' : 'text-neutral-900'}`}>
                  {dashboardStats.lowStockCount}
                </div>
                <span className={`text-[11px] font-medium ${dashboardStats.lowStockCount > 0 ? 'text-rose-600 font-bold' : 'text-neutral-400'}`}>
                  Low Stock
                </span>
              </button>
            </div>

            {/* LOCATION BREAKDOWN STRIP */}
            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                  Stock Separation
                </span>
                <span className="text-xs text-neutral-400 font-medium">Warehouse + Display</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Warehouse className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">Warehouse</span>
                    <span className="text-lg font-black text-neutral-900 leading-none">
                      {dashboardStats.totalWarehousePcs.toLocaleString()} <span className="text-xs font-medium text-neutral-500">pcs</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/60">
                  <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-sky-800 uppercase block">Display Area</span>
                    <span className="text-lg font-black text-neutral-900 leading-none">
                      {dashboardStats.totalDisplayPcs.toLocaleString()} <span className="text-xs font-medium text-neutral-500">pcs</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS BAR */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setScannedBarcodeForNew('');
                  setEditingProduct(null);
                  setIsProductFormOpen(true);
                }}
                className="py-2.5 px-3 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-800 flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-4 h-4 text-amber-600" />
                Add Product
              </button>

              <button
                type="button"
                onClick={() => {
                  if (products.length > 0) {
                    openStockMovement(products[0], 'TRANSFER');
                  }
                }}
                className="py-2.5 px-3 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-800 flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                Transfer
              </button>

              <button
                type="button"
                onClick={() => setIsCsvModalOpen(true)}
                className="py-2.5 px-3 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-800 flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                CSV Bulk
              </button>
            </div>

            {/* RECENT ACTIVITY FEED */}
            <div className="bg-white rounded-3xl border border-neutral-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neutral-500" />
                  <h3 className="font-black text-sm text-neutral-900 uppercase tracking-wider">
                    Recent Activity
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                >
                  View All ({recentTransactions.length})
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-neutral-100">
                {recentTransactions.slice(0, 6).map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          tx.transaction_type === 'IN'
                            ? 'bg-emerald-100 text-emerald-700'
                            : tx.transaction_type === 'TRANSFER'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {tx.transaction_type === 'IN' && <ArrowDownRight className="w-4 h-4" />}
                        {tx.transaction_type === 'TRANSFER' && <ArrowRightLeft className="w-4 h-4" />}
                        {tx.transaction_type === 'OUT' && <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-neutral-900 truncate">
                          {tx.product_name}
                        </p>
                        <p className="text-[11px] text-neutral-500 truncate">
                          {tx.transaction_type === 'IN' && `+${tx.quantity} ${tx.unit} to ${tx.to_location}`}
                          {tx.transaction_type === 'TRANSFER' && `${tx.from_location} → ${tx.to_location} (${tx.quantity} ${tx.unit})`}
                          {tx.transaction_type === 'OUT' && `-${tx.quantity} ${tx.unit} (${tx.from_location})`}
                          {' • '}{tx.created_by}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-black text-xs ${
                          tx.transaction_type === 'IN'
                            ? 'text-emerald-600'
                            : tx.transaction_type === 'TRANSFER'
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {tx.transaction_type === 'IN' ? `+${tx.quantity}` : tx.transaction_type === 'OUT' ? `-${tx.quantity}` : tx.quantity}
                      </span>
                      <span className="block text-[10px] text-neutral-400 font-mono">
                        {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PRODUCTS CATALOG TAB */}
        {/* ======================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, barcode, or category..."
                className="w-full bg-white border border-neutral-300 rounded-2xl pl-10 pr-10 py-2.5 text-xs font-medium text-neutral-900 placeholder-neutral-400 focus:outline-hidden focus:border-amber-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
                  showLowStockOnly
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-rose-600 border border-rose-200 hover:bg-rose-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Low Stock ({dashboardStats.lowStockCount})
              </button>

              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedCategory === cat && !showLowStockOnly
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Header with count and add button */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Products ({filteredProducts.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  setScannedBarcodeForNew('');
                  setEditingProduct(null);
                  setIsProductFormOpen(true);
                }}
                className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Register Item
              </button>
            </div>

            {/* Product List */}
            <div className="space-y-2">
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-neutral-200">
                  <Package className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-neutral-700">No products found</p>
                  <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                    Try another search keyword or scan a barcode to register this bakery item.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" /> Scan Barcode
                  </button>
                </div>
              ) : (
                filteredProducts.map((prod) => {
                  const stock = db.getStock(prod.id);
                  const isLow = stock.total <= prod.minimum_stock;

                  return (
                    <div
                      key={prod.id}
                      onClick={() => openProductDetail(prod)}
                      className="bg-white hover:bg-amber-50/40 border border-neutral-200 hover:border-amber-300 rounded-2xl p-3 shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-99"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {prod.image_url ? (
                          <img
                            src={prod.image_url}
                            alt={prod.product_name}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-neutral-200 shadow-2xs"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-amber-100/80 border border-amber-200/80 text-amber-800 flex items-center justify-center font-black text-xs uppercase shrink-0">
                            {prod.category.slice(0, 3)}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600">
                              {prod.category}
                            </span>
                            {isLow && (
                              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Low
                              </span>
                            )}
                          </div>

                          <h4 className="font-extrabold text-sm text-neutral-900 truncate">
                            {prod.product_name}
                          </h4>

                          <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                            <span className="font-mono text-[11px] text-neutral-400">
                              {prod.barcode}
                            </span>
                            <span>•</span>
                            <span>
                              Wh: <strong className="text-neutral-700">{stock.warehouse}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Disp: <strong className="text-neutral-700">{stock.display}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Total Stock Indicator */}
                      <div className="text-right shrink-0 flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                            Total
                          </span>
                          <span
                            className={`text-xl font-black ${
                              isLow ? 'text-rose-600' : 'text-neutral-900'
                            }`}
                          >
                            {stock.total}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-medium block">
                            {prod.unit}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-300" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STOCK MOVEMENTS & LOCATION BREAKDOWN TAB */}
        {/* ======================================================== */}
        {activeTab === 'stock' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Header info */}
            <div className="bg-white rounded-3xl p-4 border border-neutral-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-neutral-900">
                    Location Inventory Balance
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Warehouse vs Display distribution
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Scan to Move
                </button>
              </div>

              {/* Progress visual comparison */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-neutral-600">
                  <span className="text-amber-700">Warehouse: {dashboardStats.totalWarehousePcs} pcs</span>
                  <span className="text-sky-700">Display: {dashboardStats.totalDisplayPcs} pcs</span>
                </div>
                <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden flex">
                  <div
                    className="bg-amber-500 h-full transition-all"
                    style={{
                      width: `${
                        dashboardStats.totalStockPcs > 0
                          ? (dashboardStats.totalWarehousePcs / dashboardStats.totalStockPcs) * 100
                          : 50
                      }%`,
                    }}
                  />
                  <div
                    className="bg-sky-500 h-full transition-all"
                    style={{
                      width: `${
                        dashboardStats.totalStockPcs > 0
                          ? (dashboardStats.totalDisplayPcs / dashboardStats.totalStockPcs) * 100
                          : 50
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* List with Quick Transfer Buttons */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block px-1">
                Quick Transfer &amp; Restock
              </span>

              {products.map((prod) => {
                const stock = db.getStock(prod.id);
                return (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl p-3 border border-neutral-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {prod.image_url ? (
                        <img
                          src={prod.image_url}
                          alt={prod.product_name}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-xl object-cover shrink-0 border border-neutral-200"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {prod.category.slice(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 uppercase">
                            {prod.category}
                          </span>
                          <h4 className="font-extrabold text-sm text-neutral-900 truncate">
                            {prod.product_name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs mt-0.5">
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-semibold border border-amber-200/50">
                            Wh: {stock.warehouse} {prod.unit}
                          </span>
                          <span className="text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md font-semibold border border-sky-200/50">
                            Disp: {stock.display} {prod.unit}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => openStockMovement(prod, 'IN')}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-colors flex items-center gap-1"
                      >
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        In
                      </button>
                      <button
                        type="button"
                        onClick={() => openStockMovement(prod, 'TRANSFER')}
                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition-colors flex items-center gap-1"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        Transfer
                      </button>
                      <button
                        type="button"
                        onClick={() => openStockMovement(prod, 'OUT')}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs rounded-xl border border-rose-200 transition-colors flex items-center gap-1"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Out
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* AUDIT / TRANSACTION HISTORY TAB */}
        {/* ======================================================== */}
        {activeTab === 'history' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-neutral-900">
                  Audit Transaction History
                </h3>
                <p className="text-xs text-neutral-500">
                  Every inventory change with operator name &amp; notes
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-neutral-500 hover:text-neutral-700 text-xs font-semibold flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-neutral-200"
                title="Reset sample data"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Demo
              </button>
            </div>

            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-white rounded-2xl p-3.5 border border-neutral-200 shadow-2xs flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                        tx.transaction_type === 'IN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tx.transaction_type === 'TRANSFER'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {tx.transaction_type === 'IN' && <ArrowDownRight className="w-5 h-5" />}
                      {tx.transaction_type === 'TRANSFER' && <ArrowRightLeft className="w-5 h-5" />}
                      {tx.transaction_type === 'OUT' && <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`font-black text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            tx.transaction_type === 'IN'
                              ? 'bg-emerald-100 text-emerald-900'
                              : tx.transaction_type === 'TRANSFER'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-rose-100 text-rose-900'
                          }`}
                        >
                          {tx.transaction_type}
                        </span>
                        <h4 className="font-extrabold text-sm text-neutral-900 truncate">
                          {tx.product_name}
                        </h4>
                      </div>

                      <p className="text-xs text-neutral-600 mt-1">
                        {tx.transaction_type === 'IN' && (
                          <span>Added <strong>+{tx.quantity} {tx.unit}</strong> to {tx.to_location}</span>
                        )}
                        {tx.transaction_type === 'TRANSFER' && (
                          <span>Transferred <strong>{tx.quantity} {tx.unit}</strong> from {tx.from_location} → {tx.to_location}</span>
                        )}
                        {tx.transaction_type === 'OUT' && (
                          <span>Deducted <strong>-{tx.quantity} {tx.unit}</strong> from {tx.from_location}</span>
                        )}
                      </p>

                      <p className="text-[11px] text-neutral-400 mt-0.5 italic">
                        "{tx.reference_note}"
                      </p>

                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-neutral-400 font-medium">
                        <span>Operator: <strong className="text-neutral-600">{tx.created_by}</strong></span>
                        <span>•</span>
                        <span className="font-mono">{tx.barcode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-[11px] text-neutral-400 font-mono">
                      {new Date(tx.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="block text-[11px] text-neutral-400 font-mono">
                      {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {/* ======================================================== */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-neutral-200 z-40 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-around">
          {/* HOME */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-colors ${
              activeTab === 'dashboard'
                ? 'text-amber-600 font-extrabold'
                : 'text-neutral-400 hover:text-neutral-600 font-medium'
            }`}
          >
            <Store className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Home</span>
          </button>

          {/* PRODUCTS */}
          <button
            type="button"
            onClick={() => {
              setShowLowStockOnly(false);
              setActiveTab('products');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-colors ${
              activeTab === 'products'
                ? 'text-amber-600 font-extrabold'
                : 'text-neutral-400 hover:text-neutral-600 font-medium'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Products</span>
          </button>

          {/* SCANNER FLOATING CENTER BUTTON */}
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex flex-col items-center -mt-6 group active:scale-95 transition-transform"
            aria-label="Scan Barcode"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-white shadow-lg shadow-amber-500/40 flex items-center justify-center border-4 border-white group-hover:scale-105 transition-transform">
              <Camera className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-black text-amber-700 tracking-wider uppercase mt-1">
              Scan
            </span>
          </button>

          {/* STOCK */}
          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-colors ${
              activeTab === 'stock'
                ? 'text-amber-600 font-extrabold'
                : 'text-neutral-400 hover:text-neutral-600 font-medium'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Stock</span>
          </button>

          {/* HISTORY */}
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-colors ${
              activeTab === 'history'
                ? 'text-amber-600 font-extrabold'
                : 'text-neutral-400 hover:text-neutral-600 font-medium'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">History</span>
          </button>
        </div>
      </nav>

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}

      {/* 1. Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanResult={handleScanResult}
      />

      {/* 2. Product Registration / Edit Modal */}
      <ProductFormModal
        isOpen={isProductFormOpen}
        onClose={() => setIsProductFormOpen(false)}
        initialBarcode={scannedBarcodeForNew}
        productToEdit={editingProduct}
        onSuccess={handleProductSaved}
        activeEmployeeName={activeEmployee.name}
      />

      {/* 3. Stock Movement Modal (Stock In / Transfer / Stock Out) */}
      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        product={selectedProduct}
        defaultType={movementDefaultType}
        onSuccess={handleStockMoveSuccess}
        activeEmployeeName={activeEmployee.name}
        onScanNextRequested={() => {
          setIsMovementModalOpen(false);
          setIsScannerOpen(true);
        }}
      />

      {/* 4. Product Detail View Modal */}
      <ProductDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        product={selectedProduct}
        onOpenMovement={(prod, type) => openStockMovement(prod, type)}
        onEditProduct={(prod) => {
          setIsDetailModalOpen(false);
          openEditProduct(prod);
        }}
        onProductUpdated={refreshDb}
      />

      {/* 5. Bulk CSV Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportCompleted={() => {
          refreshDb();
          showToast('CSV import completed successfully.');
        }}
      />
    </div>
  );
}
