import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  AlertTriangle,
  ArrowDownRight,
  ArrowRightLeft,
  ArrowUpRight,
  Clock,
  Edit2,
  Copy,
  CheckCheck,
  Package,
  Camera,
  Upload
} from 'lucide-react';
import { Product, InventoryStock, StockTransaction, MovementType } from '../types/inventory';
import { db, compressImageFile } from '../services/storage';
import { BarcodeBadge } from './BarcodeBadge';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onOpenMovement: (product: Product, type: MovementType) => void;
  onEditProduct: (product: Product) => void;
  onProductUpdated?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  onOpenMovement,
  onEditProduct,
  onProductUpdated,
}) => {
  const [stock, setStock] = useState<InventoryStock>({ warehouse: 0, display: 0, total: 0 });
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | undefined>('');
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && product) {
      setStock(db.getStock(product.id));
      setTransactions(db.getTransactionsByProduct(product.id));
      setCurrentImage(product.image_url);
      setShowHistory(false);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const isLowStock = stock.total <= product.minimum_stock;

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(product.barcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleQuickImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUpdatingImage(true);
      const compressedDataUrl = await compressImageFile(file, 600, 0.85);
      const res = db.updateProduct(product.id, { image_url: compressedDataUrl });
      if (res.success && res.product) {
        setCurrentImage(compressedDataUrl);
        if (onProductUpdated) onProductUpdated();
      }
    } catch (err) {
      console.error('Failed to update image:', err);
    } finally {
      setIsUpdatingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-amber-100">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-600 flex items-center justify-center text-white">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100">
                {product.category}
              </span>
              <h2 className="font-extrabold text-lg leading-tight truncate max-w-[240px]">
                {product.product_name}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEditProduct(product)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
              title="Edit product info"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Low Stock Warning Banner */}
        {isLowStock && (
          <div className="bg-rose-50 border-b border-rose-200 px-5 py-2.5 flex items-center gap-2 text-rose-700 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>LOW STOCK ALERT — Below minimum threshold ({product.minimum_stock} {product.unit})</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* PRODUCT PHOTO BANNER */}
          <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200 shadow-xs group">
            {currentImage ? (
              <div className="relative aspect-16/10 w-full bg-neutral-800">
                <img
                  src={currentImage}
                  alt={product.product_name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>
            ) : (
              <div className="aspect-16/9 w-full bg-gradient-to-tr from-amber-100 to-amber-50 flex flex-col items-center justify-center text-amber-800 p-4">
                <Package className="w-12 h-12 text-amber-400 mb-1" />
                <span className="text-xs font-bold">Belum ada foto produk</span>
                <span className="text-[11px] text-amber-600">Ambil foto produk menggunakan kamera</span>
              </div>
            )}

            {/* Quick Camera Capture overlay button */}
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="px-3 py-1.5 bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentImage ? 'Ganti Foto' : 'Ambil Foto'}</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white rounded-full text-xs font-bold flex items-center shadow-md active:scale-95 transition-all"
                title="Pilih file dari galeri"
              >
                <Upload className="w-3.5 h-3.5 text-neutral-300" />
              </button>
            </div>

            {isUpdatingImage && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold">
                Menyimpan foto...
              </div>
            )}

            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleQuickImageChange}
              className="hidden"
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleQuickImageChange}
              className="hidden"
            />
          </div>

          {/* Barcode Visualizer */}
          <div className="flex flex-col items-center justify-center p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80">
            <BarcodeBadge value={product.barcode} height={40} />
            <button
              onClick={handleCopyBarcode}
              className="mt-2 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-neutral-200 shadow-2xs transition-colors"
            >
              {copied ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied Barcode</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Stock Display Cards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                Current Stock Position
              </span>
              <span className="text-xs font-semibold text-neutral-400">
                Min threshold: {product.minimum_stock} {product.unit}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-center">
                <span className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wide">
                  Warehouse
                </span>
                <span className="text-2xl font-black text-amber-950">
                  {stock.warehouse}
                </span>
                <span className="block text-[10px] text-amber-700 font-medium">
                  {product.unit}
                </span>
              </div>

              <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200/80 text-center">
                <span className="block text-[11px] font-semibold text-sky-800 uppercase tracking-wide">
                  Display
                </span>
                <span className="text-2xl font-black text-sky-950">
                  {stock.display}
                </span>
                <span className="block text-[10px] text-sky-700 font-medium">
                  {product.unit}
                </span>
              </div>

              <div className={`p-3 rounded-2xl border text-center ${
                isLowStock
                  ? 'bg-rose-50 border-rose-300'
                  : 'bg-emerald-50 border-emerald-200/80'
              }`}>
                <span className={`block text-[11px] font-semibold uppercase tracking-wide ${
                  isLowStock ? 'text-rose-800' : 'text-emerald-800'
                }`}>
                  Total Stock
                </span>
                <span className={`text-2xl font-black ${
                  isLowStock ? 'text-rose-950' : 'text-emerald-950'
                }`}>
                  {stock.total}
                </span>
                <span className={`block text-[10px] font-medium ${
                  isLowStock ? 'text-rose-700 font-bold' : 'text-emerald-700'
                }`}>
                  {product.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing & Unit Info */}
          <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-200/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-neutral-500 font-medium block">Selling Price</span>
              <span className="text-base font-extrabold text-neutral-900">
                Rp {product.selling_price.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-neutral-500 font-medium block">Packaging Unit</span>
              <span className="text-sm font-bold text-neutral-800 uppercase">
                {product.unit}
              </span>
            </div>
          </div>

          {/* Actions: Stock In, Transfer, Stock Out */}
          <div>
            <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">
              Stock Operations
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMovement(product, 'IN');
                }}
                className="py-3 px-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex flex-col items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                STOCK IN
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMovement(product, 'TRANSFER');
                }}
                className="py-3 px-2 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex flex-col items-center gap-1.5 shadow-md shadow-amber-600/20 active:scale-95 transition-all"
              >
                <ArrowRightLeft className="w-5 h-5 stroke-[2.5]" />
                TRANSFER
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMovement(product, 'OUT');
                }}
                className="py-3 px-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex flex-col items-center gap-1.5 shadow-md shadow-rose-600/20 active:scale-95 transition-all"
              >
                <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                STOCK OUT
              </button>
            </div>
          </div>

          {/* History Accordion */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="w-full py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200/80 rounded-xl text-neutral-700 text-xs font-bold flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-500" />
                <span>Transaction History ({transactions.length})</span>
              </div>
              <span className="text-neutral-500">{showHistory ? 'Hide' : 'Show'}</span>
            </button>

            {showHistory && (
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                {transactions.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-3 text-center">
                    No movements recorded yet for this product.
                  </p>
                ) : (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-xl border border-neutral-200 bg-white text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              tx.transaction_type === 'IN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tx.transaction_type === 'TRANSFER'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {tx.transaction_type}
                          </span>
                          <span className="font-semibold text-neutral-800">
                            {tx.transaction_type === 'IN' && `+${tx.quantity} to ${tx.to_location}`}
                            {tx.transaction_type === 'TRANSFER' && `${tx.from_location} → ${tx.to_location} (${tx.quantity})`}
                            {tx.transaction_type === 'OUT' && `-${tx.quantity} from ${tx.from_location}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {tx.reference_note} • By {tx.created_by}
                        </p>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                        {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-50 border-t border-neutral-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-neutral-600 hover:text-neutral-900 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
