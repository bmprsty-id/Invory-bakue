import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowRightLeft, ArrowUpRight, Check, AlertCircle, Sparkles } from 'lucide-react';
import { Product, MovementType, LocationType, InventoryStock } from '../types/inventory';
import { db } from '../services/storage';
import { scannerFeedback } from '../utils/audio';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  defaultType?: MovementType;
  onSuccess: () => void;
  activeEmployeeName: string;
  onScanNextRequested?: () => void;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  product,
  defaultType = 'IN',
  onSuccess,
  activeEmployeeName,
  onScanNextRequested,
}) => {
  const [movementType, setMovementType] = useState<MovementType>(defaultType);
  const [targetLocation, setTargetLocation] = useState<LocationType>('warehouse');
  const [fromLocation, setFromLocation] = useState<LocationType>('warehouse');
  const [toLocation, setToLocation] = useState<LocationType>('display');
  const [quantity, setQuantity] = useState<string>('10');
  const [reasonNote, setReasonNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [currentStock, setCurrentStock] = useState<InventoryStock>({ warehouse: 0, display: 0, total: 0 });

  useEffect(() => {
    if (isOpen && product) {
      setMovementType(defaultType);
      const stock = db.getStock(product.id);
      setCurrentStock(stock);
      setError(null);

      if (defaultType === 'IN') {
        setTargetLocation('warehouse');
        setQuantity('20');
        setReasonNote('Fresh baking production batch');
      } else if (defaultType === 'TRANSFER') {
        setFromLocation('warehouse');
        setToLocation('display');
        const defaultQty = Math.min(10, stock.warehouse || 10);
        setQuantity(String(defaultQty > 0 ? defaultQty : 5));
        setReasonNote('Replenish front display shelf');
      } else if (defaultType === 'OUT') {
        setTargetLocation('display');
        const defaultQty = Math.min(5, stock.display || 5);
        setQuantity(String(defaultQty > 0 ? defaultQty : 1));
        setReasonNote('Customer sale');
      }
    }
  }, [isOpen, product, defaultType]);

  if (!isOpen || !product) return null;

  const currentAvailable =
    movementType === 'TRANSFER'
      ? fromLocation === 'warehouse'
        ? currentStock.warehouse
        : currentStock.display
      : movementType === 'OUT'
      ? targetLocation === 'warehouse'
        ? currentStock.warehouse
        : currentStock.display
      : 999999;

  const handleQuickAdd = (num: number) => {
    const currentNum = parseInt(quantity, 10) || 0;
    setQuantity(String(Math.max(1, currentNum + num)));
  };

  const handleSetMax = () => {
    if (currentAvailable > 0 && currentAvailable < 999999) {
      setQuantity(String(currentAvailable));
    }
  };

  const handleSubmit = (scanNextAfter = false) => {
    setError(null);
    const qtyNum = parseInt(quantity, 10);

    if (!qtyNum || qtyNum <= 0 || isNaN(qtyNum)) {
      setError('Please enter a valid positive quantity.');
      scannerFeedback.playErrorBeep();
      return;
    }

    if (movementType === 'TRANSFER' && fromLocation === toLocation) {
      setError('Source and destination cannot be identical.');
      scannerFeedback.playErrorBeep();
      return;
    }

    if (movementType === 'TRANSFER' || movementType === 'OUT') {
      if (qtyNum > currentAvailable) {
        setError(`Insufficient stock! Available in ${movementType === 'TRANSFER' ? fromLocation : targetLocation}: ${currentAvailable} ${product.unit}`);
        scannerFeedback.playErrorBeep();
        return;
      }
    }

    const res = db.processStockMovement({
      productId: product.id,
      type: movementType,
      location: movementType === 'TRANSFER' ? undefined : targetLocation,
      fromLocation: movementType === 'TRANSFER' ? fromLocation : undefined,
      toLocation: movementType === 'TRANSFER' ? toLocation : undefined,
      quantity: qtyNum,
      note: reasonNote.trim() || undefined,
      employeeName: activeEmployeeName,
    });

    if (!res.success) {
      setError(res.error || 'Failed to process stock movement.');
      scannerFeedback.playErrorBeep();
      return;
    }

    scannerFeedback.playSuccessBeep();
    onSuccess();

    if (scanNextAfter && onScanNextRequested) {
      onClose();
      onScanNextRequested();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-amber-100">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.product_name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-2xl object-cover border-2 border-white/40 shrink-0 shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-amber-600/80 border-2 border-white/20 flex items-center justify-center shrink-0">
                <span className="font-bold text-base text-amber-100 uppercase">{product.category.slice(0, 2)}</span>
              </div>
            )}
            <div className="min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-100 block">
                Stock Movement
              </span>
              <h2 className="font-extrabold text-base leading-tight truncate">
                {product.product_name}
              </h2>
              <p className="text-xs text-amber-100/90 font-mono truncate">
                {product.barcode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Stock Snapshot Card */}
        <div className="bg-neutral-900 text-white px-5 py-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-neutral-800/80 p-2 rounded-xl">
            <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Warehouse</span>
            <span className="font-extrabold text-base text-amber-400">
              {currentStock.warehouse} <span className="text-xs font-normal text-neutral-300">{product.unit}</span>
            </span>
          </div>
          <div className="bg-neutral-800/80 p-2 rounded-xl">
            <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Display</span>
            <span className="font-extrabold text-base text-sky-400">
              {currentStock.display} <span className="text-xs font-normal text-neutral-300">{product.unit}</span>
            </span>
          </div>
          <div className="bg-neutral-800/80 p-2 rounded-xl">
            <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Total Stock</span>
            <span className="font-extrabold text-base text-white">
              {currentStock.total} <span className="text-xs font-normal text-neutral-300">{product.unit}</span>
            </span>
          </div>
        </div>

        {/* Body Form */}
        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Movement Type Tabs */}
          <div>
            <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">
              Action Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMovementType('IN');
                  setTargetLocation('warehouse');
                  setReasonNote('Production batch / Stock In');
                }}
                className={`py-2.5 px-2 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                  movementType === 'IN'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                STOCK IN
              </button>

              <button
                type="button"
                onClick={() => {
                  setMovementType('TRANSFER');
                  setFromLocation('warehouse');
                  setToLocation('display');
                  setReasonNote('Replenish front display shelf');
                }}
                className={`py-2.5 px-2 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                  movementType === 'TRANSFER'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                TRANSFER
              </button>

              <button
                type="button"
                onClick={() => {
                  setMovementType('OUT');
                  setTargetLocation('display');
                  setReasonNote('Customer sale');
                }}
                className={`py-2.5 px-2 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                  movementType === 'OUT'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                STOCK OUT
              </button>
            </div>
          </div>

          {/* Location Selection */}
          {movementType === 'TRANSFER' ? (
            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
                <span>STOCK ROUTE</span>
                <button
                  type="button"
                  onClick={() => {
                    const prevFrom = fromLocation;
                    setFromLocation(toLocation);
                    setToLocation(prevFrom);
                  }}
                  className="text-amber-600 hover:text-amber-700 text-xs font-semibold flex items-center gap-1"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Swap Route
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                    From Source:
                  </label>
                  <select
                    value={fromLocation}
                    onChange={(e) => {
                      const val = e.target.value as LocationType;
                      setFromLocation(val);
                      setToLocation(val === 'warehouse' ? 'display' : 'warehouse');
                    }}
                    className="w-full font-bold text-sm bg-white border border-neutral-300 rounded-xl px-3 py-2 text-neutral-800"
                  >
                    <option value="warehouse">Warehouse ({currentStock.warehouse} {product.unit})</option>
                    <option value="display">Display ({currentStock.display} {product.unit})</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                    To Target:
                  </label>
                  <select
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value as LocationType)}
                    className="w-full font-bold text-sm bg-white border border-neutral-300 rounded-xl px-3 py-2 text-neutral-800"
                  >
                    <option value="display">Display Area</option>
                    <option value="warehouse">Warehouse Storage</option>
                  </select>
                </div>
              </div>
              <p className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200/60 font-medium">
                Note: Stock transfer does not alter total inventory.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                {movementType === 'IN' ? 'Deposit To Location' : 'Deduct From Location'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetLocation('warehouse')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    targetLocation === 'warehouse'
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  Warehouse ({currentStock.warehouse} {product.unit})
                </button>
                <button
                  type="button"
                  onClick={() => setTargetLocation('display')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    targetLocation === 'display'
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  Display Area ({currentStock.display} {product.unit})
                </button>
              </div>
            </div>
          )}

          {/* Quantity Input with Mobile Quick-Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Quantity ({product.unit}) <span className="text-rose-500">*</span>
              </label>
              {(movementType === 'TRANSFER' || movementType === 'OUT') && (
                <span className="text-xs font-semibold text-neutral-500">
                  Max available: <strong className="text-neutral-900">{currentAvailable}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={movementType !== 'IN' ? currentAvailable : undefined}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full text-2xl font-black text-center text-neutral-900 bg-amber-50/40 border-2 border-amber-400 rounded-2xl py-3 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                autoFocus
              />
            </div>

            {/* Touch-Friendly Increment Chips */}
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleQuickAdd(1)}
                className="flex-1 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-lg transition-colors active:scale-95"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(5)}
                className="flex-1 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-lg transition-colors active:scale-95"
              >
                +5
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(10)}
                className="flex-1 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-lg transition-colors active:scale-95"
              >
                +10
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(20)}
                className="flex-1 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-lg transition-colors active:scale-95"
              >
                +20
              </button>
              {movementType !== 'IN' && currentAvailable > 0 && (
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold rounded-lg transition-colors active:scale-95"
                >
                  All ({currentAvailable})
                </button>
              )}
            </div>
          </div>

          {/* Reference Note / Reason */}
          <div>
            <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
              Reason / Reference Note
            </label>
            <input
              type="text"
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              placeholder="e.g. Fresh bake, Shelf restock, Customer order, Damaged..."
              className="w-full text-xs font-medium text-neutral-800 bg-white border border-neutral-300 rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div className="text-[11px] text-neutral-400 font-medium text-right">
            Staff in charge: <span className="font-semibold text-neutral-700">{activeEmployeeName}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row gap-2.5">
          {onScanNextRequested && (
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
            className={`flex-1 py-3.5 px-4 rounded-xl text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 ${
              movementType === 'IN'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                : movementType === 'TRANSFER'
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            Save Movement
          </button>
        </div>
      </div>
    </div>
  );
};
