import { freeEStoreProvider } from './providers/freeEStore'
import { openBeautyProvider } from './providers/openBeauty'
import { sceneSkuProvider } from './providers/scenesku'
import { soleScoutProvider } from './providers/soleScout'
import type { ManagedProvider } from './providers/shared'

export const externalCatalogProviders: ManagedProvider[] = [
  sceneSkuProvider,
  soleScoutProvider,
  openBeautyProvider,
  freeEStoreProvider,
]
