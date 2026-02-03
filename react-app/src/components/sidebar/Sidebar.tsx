import SidebarHeader from './SidebarHeader'
import SidebarProjectPurpose from './sections/SidebarProjectPurpose'
import SidebarTools from './sections/SidebarTools'
import SidebarDataCreation from './sections/SidebarDataCreation'
import SidebarDataCatalog from './sections/SidebarDataCatalog'
import SidebarVizWizard from './sections/SidebarVizWizard'
import SidebarProjectManagement from './sections/SidebarProjectManagement'
import SidebarFooter from './SidebarFooter'

interface SidebarProps {
    onClose?: () => void
}

export default function Sidebar({ }: SidebarProps) {
    return (
        <>
            <SidebarHeader />

            {/* Content Area with custom scrollbar */}
            <div className="flex-grow overflow-y-auto sidebar-content bg-white px-2.5 py-4 pb-20 space-y-4">
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
