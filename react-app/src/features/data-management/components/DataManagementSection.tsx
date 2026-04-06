import { DataCatalogSection } from './DataCatalogSection'
import { DataCreationSection } from './DataCreationSection'

export function DataManagementSection() {
  return (
    <>
      <DataCreationSection />
      <DataCatalogSection />
    </>
  )
}
