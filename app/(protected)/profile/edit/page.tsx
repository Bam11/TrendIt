"use client"

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from '@/app/lib/supabase/client';
import { useRouter } from 'next/navigation';
import axios from 'axios';


export default function EditProfile() {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    fullName: (user?.user_metadata.full_name as string) ?? "",
    username: (user?.app_metadata.username as string) ?? "",
    bio: (user?.app_metadata.bio as string) ?? "",
    website: (user?.app_metadata.website as string) ?? "",
    email: user?.email ?? "",
    phone: (user?.app_metadata.phone as string) ?? "",
    gender: (user?.app_metadata.gender as string) ?? "",
  });

  const [avatarPreview, setAvatarPrerview] = useState<string | null>(
    (user?.app_metadata.avatar_url as string) ?? "",
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProfie, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoadingProfile(true);
        const { data, error } = await supabase
          .from("user_profile")
          .select("*")
          .eq("id", user?.id)
          .single();
        if (error) throw error;

        setForm((prev) => ({
          ...prev, ...{
            fullName: data.fuull_name,
            username: data.username,
            bio: data.bio,
            website: data.website,
            phone: data.phone,
            gender: data.gender
          }
        }));
        setAvatarPrerview(data.avatar_url);

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
      let imageUrl = user?.user_metadata?.avatar_url ?? user?.user_metadata?.image ?? undefined;

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

        const { data: publicUrl } = supabase.storage
          .from("user-profile-image").getPublicUrl(path);

        imageUrl = publicUrl;
      }

      const { error: updateError } = await supabase
        .from("user_profile")
        .upsert({
          id: user?.id,
          fullName: form.fullName,
          username: form.username,
          bio: form.bio,
          website: form.website,
          phone: form.phone,
          gender: form.gender,
          image_Url: imageUrl,
        }, { onConflict: "id" });

      if (updateError) throw updateError;

      const { error } = await supabase.auth.updateUser({
        phone: form.phone,
        data: {
          full_name: form.fullName,
          username: form.username,
          image_Url: imageUrl,
        },
      });
      if (error) throw error;

      await axios.post("/api/get_stream/user_management", {
        full_name: form.fullName,
        username: form.username,
        image_Url: imageUrl,
      });

      router.push("/profile")
    } catch (err) {
      setError(err instanceof Error ? err.message: "Failed to save changes.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      Edit Profile Page
    </div>
  )
}
