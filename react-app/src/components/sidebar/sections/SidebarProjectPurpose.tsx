export default function SidebarProjectPurpose() {
  return (
    <section className="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors">
      <div className="floating-input-container">
        <input type="text" id="map-purpose" placeholder=" " className="floating-input" />
        <label htmlFor="map-purpose" className="floating-label">Proje Amacı</label>
      </div>
    </section>
  )
}
