import type { ManagedProvider } from './shared'

async function loadOpenBeautyFacts() {
  // Open Beauty Facts is useful for descriptive product discovery, but this
  // storefront requires a trustworthy retail price before an item is shoppable.
  // This feed does not provide one, so Veloura intentionally surfaces none of
  // these records rather than inventing price, discount, rating, or stock.
  return []
}

export const openBeautyProvider: ManagedProvider = {
  id: 'openbeauty',
  label: 'Open Beauty Facts · descriptive feed only',
  priority: 86,
  load: loadOpenBeautyFacts,
}
