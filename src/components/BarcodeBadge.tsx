import React from 'react';

interface BarcodeBadgeProps {
  value: string;
  className?: string;
  showText?: boolean;
  height?: number;
}

// Generates pseudo-deterministic 1D barcode lines for EAN/UPC/Code128 representation
export const BarcodeBadge: React.FC<BarcodeBadgeProps> = ({
  value,
  className = '',
  showText = true,
  height = 42,
}) => {
  // Deterministic bar widths based on char codes
  const bars: { width: number; isBlack: boolean }[] = [];
  let isBlack = true;

  // Add guard bar
  bars.push({ width: 2, isBlack: true });
  bars.push({ width: 1, isBlack: false });
  bars.push({ width: 2, isBlack: true });

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    const w1 = (code % 3) + 1;
    const w2 = ((code >> 1) % 3) + 1;
    const w3 = ((code >> 2) % 2) + 1;

    bars.push({ width: w1, isBlack });
    isBlack = !isBlack;
    bars.push({ width: w2, isBlack });
    isBlack = !isBlack;
    bars.push({ width: w3, isBlack });
    isBlack = !isBlack;
  }

  // End guard
  bars.push({ width: 2, isBlack: true });
  bars.push({ width: 1, isBlack: false });
  bars.push({ width: 2, isBlack: true });

  const totalWidth = bars.reduce((acc, b) => acc + b.width, 0);

  let currentX = 0;

  return (
    <div className={`inline-flex flex-col items-center bg-white p-2 rounded-lg border border-amber-200/80 shadow-xs ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full max-w-[200px]"
        style={{ height: `${height}px` }}
        preserveAspectRatio="none"
      >
        {bars.map((bar, idx) => {
          const x = currentX;
          currentX += bar.width;
          if (!bar.isBlack) return null;
          return (
            <rect
              key={idx}
              x={x}
              y={0}
              width={bar.width}
              height={height}
              fill="#1e1e1e"
            />
          );
        })}
      </svg>
      {showText && (
        <span className="font-mono text-xs tracking-widest text-neutral-800 font-semibold mt-1">
          {value}
        </span>
      )}
    </div>
  );
};
