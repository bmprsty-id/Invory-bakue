import React, { useState, useEffect, useRef } from 'react';
import { X, Check, PackagePlus, AlertCircle, Sparkles, Camera, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { Product } from '../types/inventory';
import { db, compressImageFile } from '../services/storage';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBarcode?: string;
  productToEdit?: Product | null;
  onSuccess: (product: Product, isNew: boolean, continueScan?: boolean) => void;
  activeEmployeeName: string;
}

const CATEGORY_PRESETS = [
  'Tepung',
  'Mentega & Butter',
  'Cokelat & Kakao',
  'Ragi & Pengembang',
  'Keju & Dairy',
  'Gula & Pemanis',
  'Perisa & Pewarna',
  'Topping & Isian',
  'Lainnya',
];
const UNIT_PRESETS = ['pack', 'kg', 'gr', 'kaleng', 'blok', 'sak', 'botol', 'kotak', 'pcs'];

const PRESET_IMAGES = [
  { label: 'Tepung Terigu', url: '/src/assets/images/tepung_terigu_1790634902733.jpg' },
  { label: 'Mentega / Butter', url: '/src/assets/images/mentega_butter_1790634913607.jpg' },
  { label: 'Cokelat Compound', url: '/src/assets/images/cokelat_compound_1790634925251.jpg' },
  { label: 'Ragi Instan', url: '/src/assets/images/ragi_instan_1790634937004.jpg' },
  { label: 'Keju Cheddar', url: '/src/assets/images/keju_cheddar_1790634947232.jpg' },
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  initialBarcode = '',
  productToEdit,
  onSuccess,
  activeEmployeeName,
}) => {
  const [barcode, setBarcode] = useState('');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Tepung');
  const [unit, setUnit] = useState('pack');
  const [sellingPrice, setSellingPrice] = useState('0');
  const [minimumStock, setMinimumStock] = useState('10');
  const [initialWarehouseStock, setInitialWarehouseStock] = useState('0');
  const [initialDisplayStock, setInitialDisplayStock] = useState('0');
  const [imageUrl, setImageUrl] = useState<string | undefined>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isEditing = Boolean(productToEdit);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (productToEdit) {
        setBarcode(productToEdit.barcode);
        setProductName(productToEdit.product_name);
        setCategory(productToEdit.category);
        setUnit(productToEdit.unit);
        setSellingPrice(String(productToEdit.selling_price));
        setMinimumStock(String(productToEdit.minimum_stock));
        setImageUrl(productToEdit.image_url || '');
        setInitialWarehouseStock('0');
        setInitialDisplayStock('0');
      } else {
        setBarcode(initialBarcode || '');
        setProductName('');
        setCategory('Cake');
        setUnit('pcs');
        setSellingPrice('20000');
        setMinimumStock('10');
        setImageUrl('');
        setInitialWarehouseStock('20');
        setInitialDisplayStock('5');
      }
    }
  }, [isOpen, productToEdit, initialBarcode]);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      const compressedDataUrl = await compressImageFile(file, 600, 0.85);
      setImageUrl(compressedDataUrl);
    } catch (err) {
      console.error('Image compression failed:', err);
      setError('Failed to process image file.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSubmit = (continueScanMode = false) => {
    setError(null);

    const cleanBarcode = barcode.trim();
    const cleanName = productName.trim();

    if (!cleanBarcode) {
      setError('Please enter or scan a barcode.');
      return;
    }
    if (!cleanName) {
      setError('Product name cannot be empty.');
      return;
    }

    const price = Math.max(0, parseFloat(sellingPrice) || 0);
    const minStock = Math.max(0, parseInt(minimumStock, 10) || 0);
    const whStock = Math.max(0, parseInt(initialWarehouseStock, 10) || 0);
    const dispStock = Math.max(0, parseInt(initialDisplayStock, 10) || 0);

    if (isEditing && productToEdit) {
      const res = db.updateProduct(productToEdit.id, {
        barcode: cleanBarcode,
        product_name: cleanName,
        category,
        unit,
        selling_price: price,
        minimum_stock: minStock,
        image_url: imageUrl || undefined,
      });

      if (!res.success || !res.product) {
        setError(res.error || 'Failed to update product.');
        return;
      }

      onSuccess(res.product, false, false);
      onClose();
    } else {
      // Create new
      const res = db.createProduct(
        {
          barcode: cleanBarcode,
          product_name: cleanName,
          category,
          unit,
          selling_price: price,
          minimum_stock: minStock,
          image_url: imageUrl || undefined,
        },
        whStock > 0 || dispStock > 0
          ? { warehouse: whStock, display: dispStock }
          : undefined,
        activeEmployeeName
      );

      if (!res.success || !res.product) {
        setError(res.error || 'Failed to register product.');
        return;
      }

      onSuccess(res.product, true, continueScanMode);
      if (!continueScanMode) {
        onClose();
      } else {
        // Reset form for next scan in batch collection mode
        setBarcode('');
        setProductName('');
        setImageUrl('');
        setInitialWarehouseStock('20');
        setInitialDisplayStock('5');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-amber-100">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-50/80 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-neutral-900">
                {isEditing ? 'Edit Product' : 'Register New Product'}
              </h2>
              <p className="text-xs text-neutral-500">
                {isEditing ? 'Update master database details' : 'Barcode not found. Add to inventory catalog'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-200/70 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* PRODUCT PHOTO SECTION */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
              Foto Produk (Product Photo)
            </label>

            <div className="flex items-center gap-3">
              {/* Photo Preview Thumbnail */}
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0 flex items-center justify-center shadow-xs">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-neutral-300" />
                )}
                {isProcessingImage && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[10px] font-bold">
                    Saving...
                  </div>
                )}
              </div>

              {/* Action Buttons to Snap/Upload Photo */}
              <div className="space-y-1.5 flex-1">
                <div className="flex gap-2">
                  {/* Camera Snap (Environment back camera) */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 py-2 px-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Camera className="w-4 h-4" />
                    Ambil Foto
                  </button>

                  {/* Choose from Gallery / File */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Pilih File
                  </button>

                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                {/* Quick preset thumbnail pills */}
                <div className="flex items-center gap-1 overflow-x-auto pt-1 scrollbar-none">
                  <span className="text-[10px] text-neutral-400 font-semibold shrink-0">Preset:</span>
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-medium border transition-colors shrink-0 ${
                        imageUrl === preset.url
                          ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Barcode Field */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
              Product Code / Barcode <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g. 8991234567890"
                className="w-full font-mono text-base font-bold text-neutral-900 bg-amber-50/40 border border-amber-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 tracking-wider"
              />
              {!barcode && (
                <button
                  type="button"
                  onClick={() => setBarcode(`899${Math.floor(1000000000 + Math.random() * 9000000000)}`)}
                  className="absolute right-2 top-2 text-[11px] font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Auto
                </button>
              )}
            </div>
          </div>

          {/* Product Name Field */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Chocolate Brownies, Roti Keju Spesial"
              className="w-full text-base font-semibold text-neutral-900 bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              autoFocus
            />
          </div>

          {/* Category Chips */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_PRESETS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    category === cat
                      ? 'bg-amber-600 text-white shadow-xs scale-102'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Unit Chips */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
              Unit of Measurement <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {UNIT_PRESETS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    unit === u
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Price & Minimum Stock Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                Selling Price (IDR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-neutral-400">Rp</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full text-sm font-semibold text-neutral-900 bg-white border border-neutral-300 rounded-xl pl-9 pr-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                Low Stock Threshold
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(e.target.value)}
                  className="w-full text-sm font-semibold text-neutral-900 bg-white border border-neutral-300 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-neutral-400 font-medium">
                  {unit}
                </span>
              </div>
            </div>
          </div>

          {/* Initial Stock Input (Only for new products) */}
          {!isEditing && (
            <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Initial Stock Arrival (Optional)
                </span>
                <span className="text-[11px] text-amber-700 font-medium">
                  Logged by: {activeEmployeeName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Warehouse ({unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={initialWarehouseStock}
                    onChange={(e) => setInitialWarehouseStock(e.target.value)}
                    className="w-full font-bold text-neutral-900 bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Display ({unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={initialDisplayStock}
                    onChange={(e) => setInitialDisplayStock(e.target.value)}
                    className="w-full font-bold text-neutral-900 bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row gap-2.5">
          {!isEditing && (
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="flex-1 py-3 px-4 rounded-xl border border-amber-400 bg-amber-100/70 hover:bg-amber-100 text-amber-900 text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-amber-700" />
              Save &amp; Scan Next
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold shadow-md shadow-amber-600/25 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            {isEditing ? 'Save Changes' : 'Save Product'}
          </button>
        </div>
      </div>
    </div>
  );
};
