export const formatCurrency = (amount) => {
  if (!amount) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatCurrencyShort = (amount) => {
  if (!amount) return "₹0";
  if (amount >= 1000000) return (amount / 1000000).toFixed(2) + "M";
  if (amount >= 100000) return (amount / 100000).toFixed(2) + "L";
  if (amount >= 1000) return (amount / 1000).toFixed(2) + "K";
  return "₹" + amount.toFixed(2);
};
