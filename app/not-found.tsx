import Link from 'next/link'
import React from 'react'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center h-screen">
      Page not found, continue to {" "}
      <Link href="/"> Home </Link> {" "} or
      <Link href="/login"> login </Link>
    </div>
  )
}
