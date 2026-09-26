export function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat('en', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0)
}

export function formatMacro(value, digits = 0) {
  return formatNumber(value, digits)
}

export function labelFor(options, value) {
  return options.find((option) => option.value === value)?.label ?? value
}
