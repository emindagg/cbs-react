export default function SidebarHeader() {
  return (
    <div className="bg-gradient-to-b from-white to-zinc-50/50 border-b border-zinc-200 px-3 py-3 shrink-0">
      <div className="flex items-center justify-center w-full">
        <img src={`${import.meta.env.BASE_URL}ogm-logo.svg`} className="h-[62px]" alt="OGM Logo" />
      </div>
    </div>
  )
}
