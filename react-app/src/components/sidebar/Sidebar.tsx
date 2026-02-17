/* eslint-disable no-restricted-imports -- Sidebar orchestrates features */
import { DataImportSection } from '@/features/data-import'
import { DataMapperModal } from '@/features/data-mapper'
import { VizWizardSidebar } from '@/features/viz-wizard'

import SidebarDataCatalog from './sections/SidebarDataCatalog'
import SidebarDataCreation from './sections/SidebarDataCreation'
import SidebarProjectPurpose from './sections/SidebarProjectPurpose'
import SidebarTools from './sections/SidebarTools'
import SidebarFooter from './SidebarFooter'
import SidebarHeader from './SidebarHeader'



export default function Sidebar() {
  return (
    <>
      <SidebarHeader />

      {/* Content Area with custom scrollbar */}
      <div className="grow overflow-y-auto sidebar-content bg-white px-2.5 py-4 pb-20 space-y-4">
        <SidebarProjectPurpose />
        <SidebarTools />
        <SidebarDataCreation />
        <SidebarDataCatalog />
        <VizWizardSidebar DataMapperModalComponent={DataMapperModal} />
        <DataImportSection />
      </div>

      <SidebarFooter />
    </>
  )
}
