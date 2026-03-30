"use client"

import React, { useEffect } from 'react'
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from '../context/AuthContext'
import Header from '../components/header'
import Nav from '../components/nav'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login");
    }
  }, [user, isAuthLoading, router]);

  if (isAuthLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium">You are not logged in</p>

        <button
          onClick={() => router.push("/login")}
          className="px-4 py-2 bg-linear-to-r from-[#3182ce] to-[#8e24aa] text-white rounded cursor-pointer"
        >
          Proceed to Login
        </button>
      </div>
    );
  }

  const hideLayout = pathname.startsWith("/reels");

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50">

      {!hideLayout && <Header />}

      <main className={`${hideLayout ? "pt-0 pb-0" : "pt-16 pb-20 "} min-h-screen`}>
        <div className="max-w-93.75 mx-auto">
          {children}
        </div>
      </main>

      {!hideLayout && <Nav />}
    </div>
  )
}

