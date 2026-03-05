"use client"

import React, { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthLoading } = useAuth();
  const router = useRouter();

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
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Proceed to Login
        </button>
      </div>
    );
  }

  return (
    <div className="">
      <main>
        {children}
      </main>
    </div>
  )
}

