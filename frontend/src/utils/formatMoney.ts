/** 1500000 → "1 500 000 so'm" */
export const formatMoney = (amount: number): string => {
  const formatted = new Intl.NumberFormat('uz-UZ').format(amount)
  return `${formatted} so'm`
}

/** 1500000 → "1 500 000" (birliksiz) */
export const formatNumber = (amount: number): string =>
  new Intl.NumberFormat('uz-UZ').format(amount)
