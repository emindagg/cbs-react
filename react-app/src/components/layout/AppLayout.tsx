import { useState } from 'react'
import Sidebar from '@/components/sidebar/Sidebar'
import MapContainer from '@/components/map/MapContainer'
import BasemapSwitcher from '@/components/map/controls/BasemapSwitcher'

export default function AppLayout() {
    const [isSidebarOpen, setSidebarOpen] = useState(false)

    // Toggle Function for Sidebar
    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen)
    }

    return (
        <div className="relative h-screen w-full overflow-hidden bg-zinc-50">

            {/* SIDEBAR - Mobile & Desktop Responsive via CSS classes (already ported from legacy) */}
            <aside
                id="sidebar"
                className={`fixed left-0 top-0 z-[1350] w-full md:w-72 bg-white shadow-xl h-screen flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-[-100%]'}`}
                style={{ maxWidth: '288px' }} // md:max-w-[288px] equivalent
            >
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </aside>

            {/* MAP AREA */}
            <main id="map-main" className="h-full w-full relative z-map">
                <MapContainer />
            </main>

            {/* OVERLAY CONTROLS - Top Left */}
            <div
                id="map-control-container"
                className={`fixed top-3 z-[1400] transition-all duration-300 ease-in-out left-3`}
            >
                <div className="flex flex-col gap-2.5">
                    {/* Sidebar Toggle Button */}
                    <button
                        id="open-sidebar"
                        onClick={toggleSidebar}
                        className="h-10 w-10 bg-white rounded-xl shadow-[0_10px_18px_-16px_rgba(15,23,42,0.4)] border border-slate-200/60 flex items-center justify-center text-[#1f2937] hover:bg-slate-50 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        title="Kontrol panelini aç/kapat"
                    >
                        <i className="fa-solid fa-bars text-lg"></i>
                    </button>

                    {/* Zoom Controls */}
                    <div className="flex flex-col bg-[#1c1c1e] rounded-[18px] overflow-hidden shadow-lg border-none w-9 zoom-control-custom">
                        <button type="button" className="h-9 w-9 text-white hover:bg-white/10 flex items-center justify-center text-lg font-medium" aria-label="Yakınlaştır">
                            <span aria-hidden="true">+</span>
                        </button>
                        <div className="h-[1px] bg-white/15 w-full"></div>
                        <button type="button" className="h-9 w-9 text-white hover:bg-white/10 flex items-center justify-center text-lg font-medium" aria-label="Uzaklaştır">
                            <span aria-hidden="true">−</span>
                        </button>
                    </div>

                    {/* Extra Buttons (Basemap, Astro) */}
                    <BasemapSwitcher />
                </div>
            </div>
        </div>
    )
}
