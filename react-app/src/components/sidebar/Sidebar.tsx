import { DataImportSection, DataManagementSection, ProjectExportSection } from '@/features/data-management'
import { DataMapperModal } from '@/features/data-mapper'
import { VizWizardSidebar } from '@/features/viz-wizard'

import SidebarProjectPurpose from './sections/SidebarProjectPurpose'
import SidebarTools from './sections/SidebarTools'
import SidebarFooter from './SidebarFooter'
import SidebarHeader from './SidebarHeader'

export default function Sidebar() {
  return (
    <>
      <SidebarHeader />

      {/* Content Area with custom scrollbar */}
      <div className="grow overflow-y-auto sidebar-content bg-white px-2.5 py-4 pb-32 md:pb-20 space-y-4">
        <SidebarProjectPurpose />
        <SidebarTools />
        <VizWizardSidebar DataMapperModalComponent={DataMapperModal} />
        <DataManagementSection />
        <section className="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors group pb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-900 mb-2 group-hover:text-emerald-700 transition-colors">
            Proje Yönetimi
          </h3>
          <ProjectExportSection />
          <DataImportSection />
        </section>
      </div>

      <SidebarFooter />
    </>
  )
}
