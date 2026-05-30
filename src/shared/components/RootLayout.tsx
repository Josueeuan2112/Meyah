import { Outlet } from 'react-router'

import Header from '@/shared/components/Header'
import Footer from '@/shared/components/Footer'

export default function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-meyah-crema-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
