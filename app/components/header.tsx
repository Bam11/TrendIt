import React from 'react'
import { useRouter } from 'next/navigation';
import { Bell, MessageCircle } from 'lucide-react';

export default function Header() {
  const router = useRouter();

  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-white/80 backdrop-blur-lg">
      <div className="absolute bottom-0 inset-x-0 h-[1px] bg-linear-to-r from-blue-600 to-purple-600"/>
      
      <div className="max-w-93.75 mx-auto px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent outline-none"
        >
          TrendIt
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("")}
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MessageCircle className="size-6 text-gray-700" />
            <span
              className="absolute top-0 right-0 size-5 bg-red-500 rounded-full text-[12px] grid place-items-center text-white"
            >
              2
            </span>
          </button>
          <button
            type="button"
            onClick={() => router.push("")}
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Bell className="size-6 text-gray-700" />
            <span
              className="absolute top-0 right-0 size-5 bg-red-500 rounded-full text-[9px] grid place-items-center text-white"
            >
              99+
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
