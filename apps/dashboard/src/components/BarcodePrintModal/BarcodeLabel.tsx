'use client';

import Barcode from 'react-barcode';

interface BarcodeLabelProps {
  productName: string;
  variantName?: string;
  price: number;
  barcode: string;
}

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/**
 * A standard 50mm x 25mm barcode label for retail items.
 * Uses CSS break-inside: avoid to ensure clean printing in lists.
 */
export function BarcodeLabel({
  productName,
  variantName,
  price,
  barcode,
}: BarcodeLabelProps) {
  return (
    <div 
      className="barcode-label" 
      style={{
        width: '50mm',
        height: '25mm',
        padding: '2mm',
        background: 'white',
        color: 'black',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        border: '1px dashed #ddd',
        boxSizing: 'border-box',
        overflow: 'hidden',
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
        margin: '0 auto',
      }}
    >
      <div style={{ marginBottom: '1mm' }}>
        <div style={{ fontSize: '10px', fontWeight: 'bold', lineHeight: '1', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', width: '46mm' }}>
          {productName}
        </div>
        {variantName && variantName !== 'Regular' && (
          <div style={{ fontSize: '8px', color: '#666', marginTop: '1px' }}>{variantName}</div>
        )}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', margin: '-2px 0' }}>
        <Barcode
          value={barcode}
          width={1.2}
          height={30}
          fontSize={10}
          margin={0}
          background="transparent"
        />
      </div>

      <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '1px' }}>
        {inr.format(price)}
      </div>

      <style jsx global>{`
        @media print {
          .barcode-label {
            border: none !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
