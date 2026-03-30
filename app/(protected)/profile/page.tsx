"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'
import { createClient } from '@/app/lib/supabase/client'
import { UserProfile } from '@/app/lib/types'

type Tab = "posts" | "saved" | "liked";

type PostActivity = {
  id: string;
  text: string;
  custom?: {caption?: string };
  created_at?: string;
  reaction_counts?: { like?: number; comment?: number };
  attachments?: Array<{ type: string; image_url?: string; share?: number }>;
};

export default function Profile() {
  const router = useRouter();
  const supabase = createClient();
  const { user, client } = useAuth();

  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("posts");

  const [fetching, setFetching] = useState(true);
  const [posts, setPosts] = useState<PostActivity[]>([]);

  const displayName = profileData?.full_name ?? user?.user_metadata?.full_name ?? "User";
  const username = profileData?.username ?? user?.user_metadata?.username ?? "user";
  const image = profileData?.image ?? user?.user_metadata?.avatar_url as string | undefined;

  useEffect (() => {
    const fetchUserProfile = async () => {
      try{
        const { data, error } = await supabase.
          from("user_profile")
          .select("*")
          .eq("id", user?.id)
          .single()

          if (error) throw error;
          setProfileData(data as UserProfile)
      } catch (error) {
        console.log("Failed to fetch user profile data");
        console.error(error);
      }
    }
    fetchUserProfile();
  }, [user?.id]);
  
  useEffect(() => {
    const fetchUserPosts = async () => {
      if(!user || !client) return;
      try {
        setFetching(true);
        const feed = client.feed("user", user.id);
        const response = await feed.getOrCreate({ watch: true });
        console.log("response", response);

        setPosts(response.activities.map((activity) => ({
          id: activity.id,
          text: activity.text ?? "",
          attachments: activity.attachments,
          created_at: activity.created_at,
          reaction_counts: {
            comment: activity.comment_count ?? 0,
            like: activity.reaction_count ?? 0,
            share: activity.share_count ?? 0,
          },
        } as any)));
      } catch (error) {
        console.log("Failed to feth user posts");
        console.error(error);
      } finally {
        setFetching(false);
      }
    }
    fetchUserPosts();
  }, [user?.id]);

  return (
    <div>
      Profile Page
    </div>
  )
}
