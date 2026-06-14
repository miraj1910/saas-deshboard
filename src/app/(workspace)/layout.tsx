import { Sidebar } from '@/components/layout/sidebar'
import { TopNav } from '@/components/layout/top-nav'
import { MainContent } from '@/components/layout/main-content'

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Ambient background layers */}
      <div className="fixed inset-0 pointer-events-none bg-noise" />
      <div className="fixed inset-0 pointer-events-none bg-radial-light" />
      <div className="fixed inset-0 pointer-events-none" />

      <Sidebar />
      <TopNav />
      <MainContent>
        {children}
      </MainContent>
    </div>
  )
}
