import { DataCatalogSection } from './DataCatalogSection'
import { DataCreationSection } from './DataCreationSection'
import { DataImportExportSection } from './DataImportExportSection'

export function DataManagementSection() {
  return (
    <>
      <DataCreationSection />
      <DataCatalogSection />
      <DataImportExportSection />
    </>
  )
}

