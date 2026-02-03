export const safeDivide = (numerator: number, denominator: number) => {
  if (denominator === 0) return null;
  return numerator / denominator;
};

export const toPercent = (value: number | null, decimals = 2) => {
  if (value === null) return null;
  return Number((value * 100).toFixed(decimals));
};

export const toCurrency = (value: number | null, decimals = 2) => {
  if (value === null) return null;
  return Number((value / 100).toFixed(decimals));
};

export const formatCurrency = (value: number | null, currency = "THB") => {
  if (value === null) return "ไม่มีข้อมูล";
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

export const formatNumber = (value: number | null) => {
  if (value === null) return "ไม่มีข้อมูล";
  return new Intl.NumberFormat("th-TH").format(value);
};
