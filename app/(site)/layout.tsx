import { SidebarNav } from '@/components/SidebarNav'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SidebarNav />
      <main className="content-area">{children}</main>
    </>
  )
}
