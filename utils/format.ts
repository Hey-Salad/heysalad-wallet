export const formatTrx = (amount: number): string => {
  const value = Number.isFinite(amount) ? amount : 0;
  return `${value.toFixed(2)} TRX`;
};

export const formatFiat = (amount: number): string => {
  const value = Number.isFinite(amount) ? amount : 0;
  return `${value.toFixed(2)}`;
};

export const shortAddr = (addr: string): string => {
  if (!addr) return "";
  return addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
};