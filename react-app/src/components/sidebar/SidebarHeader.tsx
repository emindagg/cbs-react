export default function SidebarHeader() {
  return (
    <div className="bg-white border-b border-zinc-200 px-3 py-2.5 shrink-0">
      <div className="flex items-center justify-center w-full">
        <img src={`${import.meta.env.BASE_URL}ogm-logo.svg`} className="h-[70px]" alt="OGM Logo" />
      </div>
    </div>
  )
}
