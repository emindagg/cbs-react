// import { useState } from 'react'

export default function SidebarVizWizard() {
    // const [activeStep, setActiveStep] = useState(1)

    return (
        <section className="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors group">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-900 mb-2 group-hover:text-emerald-700 transition-colors">Veri Görselleştirme</h3>

            {/* Wizard Progress - Placeholder */}
            <div className="bg-zinc-50/50 border border-zinc-200 rounded-lg p-4 text-center">
                <div className="text-zinc-400 text-sm mb-2">
                    <i className="fa-solid fa-wand-magic-sparkles text-2xl mb-2"></i>
                    <p>Sihirbaz Yakında Hazır</p>
                </div>

                <button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-3 rounded-lg text-xs transition-all opacity-80"
                    onClick={() => alert("Visualization Wizard logic will be ported in Phase 3")}
                >
                    Sihirbazı Başlat
                </button>
            </div>
        </section>
    )
}
