import { dummyDepartmentsProvider } from './providers/dummyDepartments'
import { mockShopProvider } from './providers/mockShop'
import { openBeautyProvider } from './providers/openBeauty'
import { sceneSkuProvider } from './providers/scenesku'
import { soleScoutProvider } from './providers/soleScout'
import type { ManagedProvider } from './providers/shared'

export const externalCatalogProviders: ManagedProvider[] = [
  sceneSkuProvider,
  mockShopProvider,
  dummyDepartmentsProvider,
  soleScoutProvider,
  openBeautyProvider,
]
