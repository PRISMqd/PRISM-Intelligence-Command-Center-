import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import StatusBar from '@/components/layout/StatusBar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Sidebar */}
      <aside
        style={{ width: '220px', minWidth: '220px', backgroundColor: '#0D2137' }}
        className="flex flex-col h-full"
      >
        <Sidebar />
      </aside>

      {/* Right content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header
          style={{ height: '48px', minHeight: '48px' }}
          className="sticky top-0 z-10 bg-white border-b border-gray-200"
        >
          <Topbar />
        </header>

        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-[1600px] mx-auto p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Status Bar */}
      <div
        style={{ height: '24px', minHeight: '24px' }}
        className="fixed bottom-0 left-0 right-0 z-20 bg-gray-900"
      >
        <StatusBar />
      </div>
    </div>
  )
}
