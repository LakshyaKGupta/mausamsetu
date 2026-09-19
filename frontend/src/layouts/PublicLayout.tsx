import React from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from '../components/shared/Navbar'
import { Footer } from '../components/shared/Footer'

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAF7] text-[#17201A]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
