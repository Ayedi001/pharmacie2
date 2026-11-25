export function formatTND(amount, suffix = 'TND') {
  const num = Number(amount || 0)
  return `${num.toFixed(3)} ${suffix}`
}

export function formatTNDParts(amount) {
  const num = Number(amount || 0)
  return {
    value: num.toFixed(3),
    currency: 'TND',
  }
}

export function getDiscountPercent(price, compareAt) {
  if (!compareAt || compareAt <= price) return 0
  return Math.round(((compareAt - price) / compareAt) * 100)
}

export function generateOrderNumber() {
  const num = Math.floor(10000 + Math.random() * 89999)
  return `#TN-${num}`
}

export function formatDateFr(iso) {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('fr-TN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
