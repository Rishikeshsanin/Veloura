import { dummyDepartmentsProvider } from './providers/dummyDepartments'
import { mockShopNetworkProvider } from './providers/mockShopNetwork'
import { openBeautyProvider } from './providers/openBeauty'
import { sceneSkuProvider } from './providers/scenesku'
import { soleScoutProvider } from './providers/soleScout'
import { vaanzariProvider } from './providers/vaanzari'
import type { ManagedProvider } from './providers/shared'

export const externalCatalogProviders: ManagedProvider[] = [
  sceneSkuProvider,
  mockShopNetworkProvider,
  vaanzariProvider,
  dummyDepartmentsProvider,
  soleScoutProvider,
  openBeautyProvider,
]
