import { Capacitor, registerPlugin } from '@capacitor/core';

type UsbPrinterPlugin = {
  print(options: { data: string }): Promise<void>;
};

const UsbPrinter = registerPlugin<UsbPrinterPlugin>('UsbPrinter');

export type UsbReceiptPayload = {
  shopName: string;
  address: string;
  billNo: string;
  date: string;
  items: Array<{ name: string; qty: number; price: number }>;
  total: number;
};

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function esc(input: string): string {
  return String(input ?? '').replace(/\r?\n/g, ' ').trim();
}

function money(n: number): string {
  return `Rs ${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
}

export function isNativeUsbPrinterAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export function buildEscPosReceipt(payload: UsbReceiptPayload): Uint8Array {
  let out = '';
  out += '\x1B\x40'; // init
  out += '\x1B\x61\x01'; // center
  out += '\x1B\x45\x01'; // bold on
  out += '\x1D\x21\x11'; // double width + height
  out += `${esc(payload.shopName)}\n`;
  out += '\x1D\x21\x00'; // normal
  out += '\x1B\x45\x00'; // bold off
  out += `${esc(payload.address)}\n`;
  out += '--------------------------------\n';
  out += '\x1B\x61\x00'; // left
  out += `Bill: ${esc(payload.billNo)}\n`;
  out += `${esc(new Date(payload.date).toLocaleString('en-IN'))}\n`;
  out += '--------------------------------\n';

  for (const item of payload.items) {
    const line = `${esc(item.name).slice(0, 20)} x ${item.qty}`;
    const amt = money(item.qty * item.price);
    out += `${line}\n`;
    out += `${amt}\n`;
  }

  out += '--------------------------------\n';
  out += '\x1B\x45\x01';
  out += `TOTAL: ${money(payload.total)}\n`;
  out += '\x1B\x45\x00';
  out += '--------------------------------\n';
  out += '\x1B\x61\x01';
  out += 'Thank You!\n\n';
  out += '\x1D\x56\x41'; // cut

  return new TextEncoder().encode(out);
}

export async function printReceiptViaUsb(payload: UsbReceiptPayload): Promise<void> {
  if (!isNativeUsbPrinterAvailable()) {
    throw new Error('USB printing is available only in Android app.');
  }
  const bytes = buildEscPosReceipt(payload);
  const data = toBase64(bytes);
  await UsbPrinter.print({ data });
}
