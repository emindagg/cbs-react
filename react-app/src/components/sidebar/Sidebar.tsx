import SidebarDataCatalog from './sections/SidebarDataCatalog'
import SidebarDataCreation from './sections/SidebarDataCreation'
import SidebarProjectManagement from './sections/SidebarProjectManagement'
import SidebarProjectPurpose from './sections/SidebarProjectPurpose'
import SidebarTools from './sections/SidebarTools'
import SidebarVizWizard from './sections/SidebarVizWizard'
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
        <SidebarVizWizard />
        <SidebarProjectManagement />
      </div>

      <SidebarFooter />
    </>
  )
}
