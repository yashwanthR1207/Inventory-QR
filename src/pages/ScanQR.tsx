import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import toast from 'react-hot-toast';

export const ScanQR: React.FC = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState<string | null>(null);
  
  useEffect(() => {
    // Only initialize scanner if we don't have a result
    if (scanResult) return;

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    const onScanSuccess = (decodedText: string) => {
      scanner.clear();
      setScanResult(decodedText);
      
      // Extract QR ID
      // It might be a full URL (e.g., http://localhost:5173/product/INV-2026-123456)
      // or just the ID itself (INV-2026-123456)
      let qrId = decodedText;
      if (decodedText.includes('/product/')) {
        const parts = decodedText.split('/product/');
        qrId = parts[parts.length - 1];
      }
      
      toast.success('QR Code scanned successfully!');
      navigate(`/product/${qrId}`);
    };

    const onScanFailure = (_error: any) => {
      // Ignore background scan failures
    };

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [scanResult, navigate]);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="page-title">
        <h1>Scan Product QR Code</h1>
      </div>
      
      <div className="card">
        <p className="text-secondary mb-4 text-center">
          Position the QR code within the camera frame to scan.
        </p>
        
        <div id="qr-reader" style={{ width: '100%' }}></div>
        
        {scanResult && (
          <div className="mt-4 text-center">
            <p className="mb-2">Scanned Result: <strong>{scanResult}</strong></p>
            <button className="btn btn-primary" onClick={() => setScanResult(null)}>
              Scan Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
