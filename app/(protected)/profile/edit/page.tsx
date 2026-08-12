"use client"

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from '@/app/lib/supabase/client';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, Camera, ChevronDown, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { motion } from "motion/react";
import Link from 'next/link';

export default function EditProfile() {
  const router = useRouter();
  const supabase = createClient();
  const { user, setUser } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    fullname: (user?.user_metadata.full_name as string) ?? "",
    username: (user?.user_metadata.username ?? user?.user_metadata?.name.split(" ")?.[0] as string) ?? "",
    bio: (user?.user_metadata.bio as string) ?? "",
    website: (user?.user_metadata.website as string) ?? "",
    email: user?.email ?? "",
    phone: (user?.user_metadata.phone as string) ?? "",
    gender: (user?.user_metadata.gender as string) ?? "",
  });

  let phone = form.phone.trim();

  if (phone.startsWith("0")) {
    phone = "+234" + phone.slice(1);
  }

  const [avatarPreview, setAvatarPrerview] = useState<string | null>(
    (user?.user_metadata?.avatar_url as string) ?? (user?.user_metadata?.image as string) ?? (user?.user_metadata?.picture as string) ?? "",
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoadingProfile(true);
        const { data, error } = await supabase
          .from("user_profile")
          .select("*")
          .eq("auth_user", user?.id)
          .single();
        if (error) throw error;

        setForm((prev) => ({
          ...prev, ...{
            fullname: data.fullname ?? "",
            username: data.username ?? "",
            bio: data.bio ?? "",
            website: data.website ?? "",
            phone: data.phone ?? "",
            gender: data.gender ?? "",
          }
        }));
        if (data.image) {
          setAvatarPrerview(data.image);
        }

      } catch (error) {
        console.error(error)
      } finally {
        setLoadingProfile(false);
      }
    }
    fetchUserProfile()
  }, [user?.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "bio" && value.length > 150) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPrerview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      let imageUrl = user?.user_metadata?.avatar_url ?? user?.user_metadata?.image ?? user?.user_metadata?.picture ?? undefined;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `images/${user?.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("user-profile-image")
          .upload(path, avatarFile, {
            upsert: true,
            metadata: { username: form.username },
          });
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("user-profile-image").getPublicUrl(path);

        imageUrl = publicUrlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("user_profile")
        .upsert({
          auth_user: user?.id,
          fullname: form.fullname,
          username: form.username,
          bio: form.bio,
          website: form.website,
          phone: form.phone,
          gender: form.gender,
          image: imageUrl,
        }, { onConflict: "auth_user" });

      if (updateError) throw updateError;

      const { data: updatedAuth, error } = await supabase.auth.updateUser({
        // phone: form.phone,
        data: {
          fullname: form.fullname,
          full_name: form.fullname,
          username: form.username,
          bio: form.bio,
          image: imageUrl,
          avatar_url: imageUrl,
          picture: imageUrl,
        },
      });
      if (error) throw error;

      if (updatedAuth?.user) {
        setUser(updatedAuth.user);
      }

      await axios.post("/api/get_stream/user_management", {
        full_name: form.fullname,
        username: form.username,
        image: imageUrl,
      });

      router.push("/profile")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.")
    } finally {
      setSaving(false)
    }
  }

  // const inputClass =
  // "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition";

  return (
    <div className="min-h-screen bg-gray-50">
      {loadingProfile && (
        <div>
          <Loader2 size={24} className="animate-spin text-gray-500" />
        </div>
      )}
      <header className="fixed top-0 right-0 left-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-5 text-gray-700" />
            </button>
            <h1 className="font-semibold text-gray-900">Edit Profile</h1>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-blue-600 hover:text-blue-700 font-semibold text-sm cursor-pointer"
          >
            {saving ? "Saving..." : "Done"}
          </button>
        </div>
      </header>

      <main className="pt-16 pb-20 max-w-2xl mx-auto">
        <form className="space-y-6" onSubmit={handleSave}>
          <div className="bg-white p-6">
            <div className="text-center">
              <div className="relative inline-block">
                <Image
                  src={avatarPreview ?? ""}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="size-24 rounded-full object-cover"
                // unoptimized={avatarPreview?.startsWith("blob:")}
                />
                <button
                  type="button"
                  onClick={handlePhotoClick}
                  className="absolute bottom-0 right-0 p-2 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                >
                  <Camera size={16} />
                </button>
              </div>
              <button
                type="button"
                onClick={handlePhotoClick}
                className="mt-4 text-blue-600 hover:text-blue-700 font-semibold text-sm cursor-pointer"
              >
                Change Photo
              </button>
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs text-center mb-2 mx-4">{error}</p>
          )}

          <div className="bg-white">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Basic Information</h2>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="px-4 py-3">
                <label className="block text-xs text-gray-500 mb-1">Name</label>
                <input
                  name="fullname"
                  type="text"
                  value={form.fullname}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="w-full bg-transparent focus:outline-none text-gray-900"
                />
              </div>
              <div className="px-4 py-3">
                <label className="block text-xs text-gray-500 mb-1">Username</label>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">@</span>
                  <input
                    name="username"
                    type="text"
                    value={form.username}
                    onChange={handleChange}
                    className="flex-1 bg-transparent focus:outline-none text-gray-900"
                  />
                </div>
              </div>
              <div className="px-4 py-3">
                <label className="block text-xs text-gray-500 mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={3}
                  maxLength={150}
                  placeholder="Tell us about yourself"
                  className="w-full text-[11px] bg-transparent focus:outline-none text-gray-900 resize-none cursor-pointer"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-400">
                    {form.bio.length ?? 0}/150
                  </span>
                </div>
              </div>
              <div className="px-4 py-3">
                <label className="block text-xs text-gray-500 mb-1">Website</label>
                <input
                  name="website"
                  type="text"
                  value={form.website}
                  onChange={handleChange}
                  className="w-full bg-transparent focus:outline-none text-gray-900 cursor-pointer"
                  placeholder="yourwebsite.com"
                />
              </div>
            </div>
          </div>

          <div className="bg-white">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Private Information</h2>
              <p className="text-xs text-gray-500 mt-1">
                This information won&apos;t be shown on your profile
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="px-4 py-3">
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@email.com"
                  disabled
                  readOnly
                  className="w-full bg-transparent focus:outline-none text-gray-900 cursor-pointer"
                />
              </div>
              <div className="px-4 py-3">
                <label className="block text-xs text-gray-500 mb-1">Phone</label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1234567890"
                  className="w-full bg-transparent focus:outline-none text-gray-900 cursor-pointer"
                />
              </div>
              <div className="px-4 py-3 relative">
                <label className="block text-xs text-gray-500 mb-1">Gender</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full bg-transparent focus:outline-none appearance-none text-gray-900 cursor-pointer"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="bg-white">
            {/* <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Account Settings</h2>
            </div> */}
            {/* <div className="divide-y divide-gray-100">
              <button
                type="button"
                className="w-full px-4 py-3 text-left text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Change Password
              </button>
              <button
                type="button"
                className="w-full px-4 py-3 text-left text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Privacy and Security
              </button>
              <button
                type="button"
                className="w-full px-4 py-3 text-left text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Notifications
              </button>
              <button
                type="button"
                className="w-full px-4 py-3 text-left text-blue-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Switch to Professional Account
              </button>
            </div> */}
            <Section title="Account Setting">
              {[
                { label: "Change Password", href: "/profile/change-password" },
                { label: "Privacy and Security", href: "/profile/privacy" },
                { label: "Notifications", href: "/profile/notifications" },
              ].map(({ label, href }) => (
                <Link
                  href={href}
                  key={label}
                  type="button"
                  className="w-full px-4 py-3 text-left text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {label}
                </Link>
              )
              )}
              <button
                type="button"
                className="w-full px-4 py-3 text-left text-red-600 hover:bg-gray-50 transition-colors font-semibold cursor-pointer"
              >
                Delete Account
              </button>
            </Section>
          </div>

          {/* <div className="bg-white">
            <div className="divide-y divide-gray-100">
              <button
                type="button"
                className="w-full px-4 py-3 text-left text-red-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Temporarily Disable Account
              </button>

            </div>
          </div> */}

          <div className="px-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow cursor-pointer disabled:opacity-60"
            >
              {saving ? "Saving changes..." : "Save Changes"}
            </motion.button>
          </div>
        </form>
      </main>
    </div>
  )
}

function Section({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="divide-y divide-gray-100">
        {children}
      </div>
    </div>
  );
};
