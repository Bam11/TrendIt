import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Image from 'next/image';
import { Compass, Film, Home, PlusCircle, User } from 'lucide-react'

export default function Nav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/reels", icon: Film, label: "Reels" },
    { path: "/create", icon: PlusCircle, label: "Create", isSpecial: true },
    { path: "/discover", icon: Compass, label: "Discover" },
    { path: "/profile", icon: User, label: "Profile" },
  ]

  if (!user) return null;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-gray-200">
      <div className="max-w-93.75 mx-auto px-4 py-3 flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === "/"
            ? pathname === "/"
            : pathname.startsWith(item.path);

          const isProfile = item.label === "Profile";
          const userImage = user?.user_metadata.avatar_url || user?.user_metadata.picture || null;

          if (item.isSpecial) {
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => router.push(item.path)}
                className="flex flex-col items-center gap-1 transition-transform active:scale-95"
              >
                <div className="size-12 bg-linear-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                  <Icon className="size-6 text-white" />
                </div>
                <span className="text-xs text-blue-600">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center gap-1 transition-colors"
            >
              <div className={`p-2 rounded-full transition-all flex items-center justify-center overflow-hidden 
                  ${isActive ? "bg-linear-to-r from-blue-600 to-purple-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"}`
              }>
                {isProfile && userImage ? (
                  <Image
                    src={userImage}
                    alt={user.user_metadata.username || "Profile"}
                    width={24}
                    height={24}
                    className={`size-6 object-cover rounded-full ${isActive ? "border-2 border-white" : ""}`}
                  />
                ) : (
                  <Icon className="size-5" />
                )}
              </div>
              <span className={`text-xs ${isActive ? "text-blue-600" : "text-gray-600"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  )
}
