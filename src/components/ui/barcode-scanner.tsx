"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  buttonText?: string;
  className?: string;
}

export function BarcodeScanner({ onScan, buttonText = "Scan Camera", className }: BarcodeScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
      return;
    }

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
      /* verbose= */ false
    );
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // Stop scanning when a result is found
        scanner.clear().then(() => {
          scannerRef.current = null;
          setIsOpen(false);
          onScan(decodedText);
        }).catch(console.error);
      },
      (error) => {
        // Ignore scan errors, they happen continuously until a barcode is found
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScan]);

  return (
    <>
      <Button 
        type="button" 
        variant="outline" 
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <Camera className="mr-2 h-4 w-4" />
        {buttonText}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Scan Barcode</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            <div id="reader" className="w-full max-w-[400px] bg-slate-100 rounded-lg overflow-hidden"></div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Point your camera at a barcode or QR code. It will scan automatically.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
