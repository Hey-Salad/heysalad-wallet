export const formatTrx = (amount: number): string => {
  const value = Number.isFinite(amount) ? amount : 0;
  return `${value.toFixed(2)} TRX`;
};

export const formatFiat = (amount: number, currency: string = "£"): string => {
  const value = Number.isFinite(amount) ? amount : 0;
  return `${currency}${value.toFixed(2)}`;
};

export const formatGBP = (amount: number): string => {
  const value = Number.isFinite(amount) ? amount : 0;
  return `£${value.toFixed(2)}`;
};

export const shortAddr = (addr: string): string => {
  if (!addr) return "";
  return addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
};

// TRX to GBP conversion (example rate: 1 TRX = £0.12)
export const trxToGBP = (trxAmount: number): number => {
  return trxAmount * 0.12;
};

// GBP to TRX conversion
export const gbpToTRX = (gbpAmount: number): number => {
  return gbpAmount / 0.12;
};