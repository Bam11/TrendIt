"use client"

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from '@/app/lib/supabase/client';
import { UserProfile } from '@/app/lib/types';
import { useFollowers, useFollowing } from "@stream-io/feeds-client/react-bindings";
import { Bookmark, Grid3X3, Heart, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/app/components/ui/drawer";
import Link from 'next/link';

type Tab = "posts" | "saved" | "liked";

type PostActivity = {
  id: string;
  text?: string;
  custom?: { caption?: string };
  created_at?: string;
  own_reactions?: any[];
  own_bookmarks?: any[];
  reaction_counts?: { like?: number; comment?: number; share?: number };
  attachments?: Array<{ type: string; image_url?: string; asset_url?: string; video_url?: string; share?: number }>;
};

export default function Profile() {
  const router = useRouter();
  const supabase = createClient();
  const { user, client } = useAuth();

  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [listDrawer, setListDrawer] = useState<"followers" | "following" | null>(null);

  const userFeed = useMemo(
    () => (client && user ? client.feed("user", user.id) : null),
    [client, user?.id]
  );
  const followersData = useFollowers(userFeed ?? undefined);
  const followingData = useFollowing(userFeed ?? undefined);

  const [fetching, setFetching] = useState(true);
  const [posts, setPosts] = useState<PostActivity[]>([]);
  const [likedPosts, setLikedPosts] = useState<PostActivity[]>([]);
  const [savedPosts, setSavedPosts] = useState<PostActivity[]>([]);

  const [feedCounts, setFeedCounts] = useState<{
    posts: number;
    followers: number;
    following: number;
  }>({ posts: 0, followers: 0, following: 0 })

  const fullName = profileData?.full_name ?? user?.user_metadata?.full_name ?? "User";
  const username = profileData?.username ?? user?.user_metadata?.username ?? user?.user_metadata?.name.split(" ")?.[0] ?? "user";
  const image = profileData?.image ?? user?.user_metadata?.avatar_url ?? user?.user_metadata?.image ?? user?.user_metadata?.picture as string | undefined;

  const tabs: { id: Tab; icon: React.ElementType; label: string; count: number }[] = [
    { id: "posts", icon: Grid3X3, label: "Posts", count: posts.length },
    { id: "saved", icon: Bookmark, label: "Saved", count: savedPosts.length },
    { id: "liked", icon: Heart, label: "Liked", count: likedPosts.length },
  ];

  useEffect(() => {
    if (!user?.id) return;

    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("user_profile")
          .select("*")
          .eq("auth_user", user?.id)
          .single()

        if (error) throw error;
        setProfileData(data as UserProfile)
      } catch (error) {
        console.log("Failed to fetch user profile data");
        console.error(error);
      }
    }
    fetchUserProfile();
  }, [user?.id, supabase]);

  useEffect(() => {
    const fetchAll = async () => {
      if (!userFeed || !client) return;
      try {
        setFetching(true);
        // const feed = client.feed("user", user.id);
        const response = await userFeed.getOrCreate({ watch: true });
        const feedData = response.feed;

        if (feedData) {
          setFeedCounts({
            posts: feedData.activity_count ?? 0,
            followers: feedData.follower_count ?? 0,
            following: feedData.following_count ?? 0,
          });
        }

        const activities: PostActivity[] = response.activities.map((activity: any) => ({
          id: activity.id,
          text: activity.text ?? "",
          attachments: activity.attachments ?? [],
          created_at: activity.created_at,

          own_reactions: activity.own_reactions ?? [],
          own_bookmarks: activity.own_bookmarks ?? [],

          reaction_counts: {
            comment: activity.comment_count ?? 0,
            like: activity.reaction_count ?? 0,
            share: activity.share_count ?? 0,
          },
        }))

        setPosts(activities);

        setLikedPosts(
          activities.filter((activity) =>
            activity.own_reactions?.some(
              (reaction) => reaction.type === "like"
            )
          )
        );

        setSavedPosts(
          activities.filter(
            (activity) => activity.own_bookmarks?.length > 0
          )
        );
        console.log(activities);

      } catch (error) {
        console.log("Failed to fetch");
        console.error(error);
      } finally {
        setFetching(false);
      }
    }
    fetchAll();
  }, [client, user?.id, userFeed]);

  // useEffect(() => {
  //   const fetchLikedPosts = async () => {
  //     if (!client || !user) return;

  //     try {
  //       const response = await client.queryActivities({
  //         filter: {
  //           reacted_by: user.id,
  //           reaction_kind: "like",
  //         },
  //       });

  //       setLikedPosts(response.activities.map((activity) => ({
  //         id: activity.id,
  //         text: activity.text ?? "",
  //         attachments: activity.attachments,
  //         created_at: activity.created_at,
  //         reaction_counts: {
  //           comment: activity.comment_count ?? 0,
  //           like: activity.reaction_count ?? 0,
  //           share: activity.share_count ?? 0,
  //         },
  //       } as any)));
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   };

  //   fetchLikedPosts();
  // }, [client, user]);

  // useEffect(() => {
  //   const fetchSavedPosts = async () => {
  //     if (!client || !user) return;

  //     try {
  //       const response = await client.queryActivities({
  //         filter: {
  //           reacted_by: user.id,
  //           reaction_kind: "bookmark",
  //         },
  //       });

  //       setSavedPosts(response.activities.map((activity) => ({
  //         id: activity.id,
  //         text: activity.text ?? "",
  //         attachments: activity.attachments,
  //         created_at: activity.created_at,
  //         reaction_counts: {
  //           comment: activity.comment_count ?? 0,
  //           like: activity.reaction_count ?? 0,
  //           share: activity.share_count ?? 0,
  //         },
  //       } as any)));
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   };

  //   fetchSavedPosts();
  // }, [client, user]);

  // useEffect(() => {
  //   const fetchAll = async () => {
  //     if (!userFeed || !client) return null;

  //     const response = await userFeed.getOrCreate({ watch: true });

  //     const activities = response.activities;

  //     setPosts(activities);

  //     setLikedPosts(
  //       activities.filter((a) =>
  //         a.own_reactions?.some((r) => r.type === "like")
  //       )
  //     );

  //     setSavedPosts(
  //       activities.filter((a) => a.own_bookmarks?.length > 0)
  //     );
  //     console.log(response.activities);
  //   }

  //   fetchAll()
  // }, [client, userFeed]);

  const [visibleCount, setVisibleCount] = useState(20);
  useEffect(() => {
    setVisibleCount(6);
  }, [activeTab]);

  const activeData =
    activeTab === "posts" ? posts :
      activeTab === "saved" ? savedPosts : likedPosts;

  const visiblePosts = activeData.slice(0, visibleCount);

  useEffect(() => {
    const handleScroll = () => {
      console.log("scrolling", "scrolled");
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 300
      ) {
        setVisibleCount((prev) => prev + 20);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const renderPost = (post: PostActivity) => {
    const attachment = post.attachments?.[0];
    const hasMedia = !!attachment;
    console.log("post", post.reaction_counts)
    return (
      <div
        key={post.id}
        onClick={() => router.push(`/post/${post.id}`)}
        className="relative group aspect-square bg-gray-100 overflow-hidden rounded-md"
      >
        {hasMedia &&
          (attachment.type === 'video' || attachment.asset_url?.match(/\.(mp4|webm|mov)$/i)) ? (
          <video
            src={attachment.asset_url || attachment.video_url}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            autoPlay
          />
        ) : hasMedia && (attachment.type === 'image' || attachment.image_url) ? (
          <Image
            src={attachment.image_url || attachment.asset_url || ""}
            alt="Post"
            fill
            sizes="(max-width: 768px) 33vw, 250px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-3 bg-linear-to-br from-blue-500 to-purple-600 text-white text-center">
            <p className="line-clamp-4 text-xs sm:text-sm font-medium">{post.text}</p>
          </div>
        )}

        <div className="absolute inset-0 bg-black/50 bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Heart className="size-5 fill-red-500 stroke-red-500" />
              <span className="text-white font-medium">{post.reaction_counts?.like ?? 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="size-5 fill-white stroke-white" />
              <span className="text-white font-medium">{post.reaction_counts?.comment ?? 0}</span>
            </div>
            {/* <div className="flex items-center gap-1">
              <Share className="size-5 fill-white" />
              <span className="text-white font-medium">{post.reaction_counts?.share}</span>
            </div> */}
          </div>
        </div>
      </div>
    );
  };

  const emptyState =
    activeTab === "posts"
      ? (
        <>
          <Grid3X3 className="size-12 mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-gray-400">No posts yet</p>
        </>
      )
      : activeTab === "saved"
        ? (
          <>
            <Bookmark className="size-12 mb-3" strokeWidth={1.5} />
            <p className="text-sm font-medium text-gray-400">No saved posts yet</p>
          </>
        )
        : (
          <>
            <Heart className="size-12 mb-3" strokeWidth={1.5} />
            <p className="text-sm font-medium text-gray-400">No liked posts yet</p>
          </>
        );

  return (
    <div className="space-y-6">
      <div className="pt-4 px-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 items-end gap-2">
          <p className="text-base text-[#4a5568] tracking-tighter">
            {profileData?.bio ?? user?.user_metadata?.bio ?? "No bio yet"}
          </p>
          <div className="flex flex-col ml-4">
            <div className="relative grid place-items-center">
              <Image
                src={image}
                alt={username}
                width={96}
                height={96}
                className="size-24 rounded-full object-cover border-2 border-white shadow-lg"
              />
              <div className="absolute bottom-0 right-9 size-5 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{fullName}</h1>
              <p className="text-gray-600">@{username}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-8 justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold">{feedCounts.posts}</p>
            <p className="text-sm text-gray-600">Posts</p>
          </div>
          <button
            type="button" 
            onClick={() => setListDrawer("followers")}
            className="flex-1 flex flex-col items-center hover:opacity-80 transition"
          >
            <p className="text-2xl font-bold">{feedCounts.followers}</p>
            <p className="text-sm text-gray-600">Followers</p>
          </button>
          <button
            type="button"
            onClick={() => setListDrawer("following")}
            className="text-center"
          >
            <p className="text-2xl font-bold">{feedCounts.following}</p>
            <p className="text-sm text-gray-600">Following</p>
          </button>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/profile/edit")}
            className="flex-1 py-2.5 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium hover:shadow-lg transition-shadow"
          >
            Edit Profile
          </button>
          <button
            type="button"
            onClick={() => router.push("/profile/edit")}
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-full font-medium hover:shadow-lg transition-colors"
          >
            Share Profile
          </button>
        </div>
      </div>
      <div className="bg-white border-y border-gray-200">
        <div className="flex justify-around">
          {tabs.map(({ id, icon: Icon, label, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 py-4 flex items-center justify-center gap-2 transition-colors text-sm font-medium border-b-2 ${activeTab === id
                ? "text-blue-600 border-purple-600"
                : "text-gray-700 border-transparent"
                }`}
            >
              <Icon className="size-4" strokeWidth={activeTab === id ? 2.5 : 2} />
              {label}
              <span className="text-xs text-gray-500">
                ({count})
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 pb-8">
        {visiblePosts.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 cursor-pointer">
            {visiblePosts.map(renderPost)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300">
            {emptyState}
          </div>
        )}

        {/* {activeTab === "saved" && (
          savedPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 cursor-pointer">
              {savedPosts.map((post) => {
                const attachment = post.attachments?.[0];
                const hasMedia = !!attachment;
                return (
                  <div key={post.id} className="relative group aspect-square bg-gray-100 overflow-hidden rounded-md">
                    {hasMedia && (attachment.type === 'video' || attachment.asset_url?.match(/\.(mp4|webm|mov)$/i)) ? (
                      <video
                        src={attachment.asset_url || attachment.video_url}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        autoPlay
                      />
                    ) : hasMedia && (attachment.type === 'image' || attachment.image_url) ? (
                      <Image
                        src={attachment.image_url || attachment.asset_url || ""}
                        alt="Post"
                        fill
                        sizes="(max-width: 768px) 33vw, 250px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-3 bg-linear-to-br from-blue-500 to-purple-600 text-white text-center">
                        <p className="line-clamp-4 text-xs sm:text-sm font-medium">{post.text}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
              <Bookmark className="size-12 mb-3" strokeWidth={1.5} />
              <p className="text-sm font-medium text-gray-400">No saved posts yet</p>
            </div>
          )
        )} */}
      </div>

      {/* Followers */}
      <Drawer open={listDrawer === "followers"} onOpenChange={(open) => !open && setListDrawer(null)}>
        <DrawerContent className="flex flex-col max-h-[75vh]">
          <DrawerHeader className="border-b border-gray-100 pb-3">
            <DrawerTitle className="text-base font-semi-bold text-gray-900">Followers</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <FollowersList
              followersData={followersData}
              onUserClick={() => setListDrawer(null)}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Following */}
      <Drawer open={listDrawer === "following"} onOpenChange={(open) => !open && setListDrawer(null)}>
        <DrawerContent className="flex flex-col max-h-[75vh]">
          <DrawerHeader className="border-b border-gray-100 pb-3">
            <DrawerTitle className="text-base font-semi-bold text-gray-900">Following</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <FollowingList
              followingData={followingData}
              onUserClick={() => setListDrawer(null)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

function FollowersList({ followersData, onUserClick, }: {
  followersData: ReturnType<typeof useFollowers> | undefined;
  onUserClick: () => void;
}) {
  const followers = followersData?.followers ?? [];
  const hasNext = followersData?.has_next_page ?? false;
  const loading = followersData?.is_loading_next_page ?? false;
  const loadNext = followersData?.loadNextPage;

  useEffect(() => {
    if (followers.length === 0 && loadNext && !loading) loadNext({});
  }, [loadNext, loading, followers.length]);

  if (followers.length === 0 && !loading) {
    return <p className="text-center text-sm text-gray-400 py-8">
      No followers yet
    </p>
  }

  return (
    <div className="space-y-1">
      {followers.map((f) => {
        const feed = f.source_feed;
        const user = feed?.created_by;
        const id = feed?.id ?? user?.id ?? "";
        const name = user?.custom?.full_name ?? user?.name ?? id;
        const username = user?.name ?? id;
        const image = user?.image ?? null;

        return (
          <Link
            key={f.target_feed?.feed + "-" + f.source_feed?.feed}
            href={`/profile/${id}`}
            onClick={onUserClick}
            className="flex items-center gap-3 py-2.5 rounded-lg hover:bg-gray-50"
          >
            <div className="size-10 rounded-full overflow-hidden bg-gray-20 shrink-0">
              {image ? (
                <Image
                  src={image}
                  alt={name}
                  width={40}
                  height={40}
                  className="object-cover size-full"
                  unoptimized
                />
              ) : (
                <div className="size-full bg-gray-400 flex items-center justify-center text-white font-semibold text-sm">
                  {(name ?? "?")[0]}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
              <p className="text-xs text-gray-400 truncate">@{username}</p>
            </div>
          </Link>
        )
      })}
      {hasNext && (
        <button
          type="button"
          onClick={() => loadNext?.({})}
          disabled={loading}
          className="w-full text-sm text-purple-600 font-medium py-2 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  )
}

function FollowingList({ followingData, onUserClick, }: {
  followingData: ReturnType<typeof useFollowing> | undefined;
  onUserClick: () => void;
}) {
  const following = followingData?.following ?? [];
  const hasNext = followingData?.has_next_page ?? false;
  const loading = followingData?.is_loading_next_page ?? false;
  const loadNext = followingData?.loadNextPage;

  useEffect(() => {
    if (following.length === 0 && loadNext && !loading) loadNext({});
  }, [loadNext, loading, following.length]);

  if (following.length === 0 && !loading) {
    return <p className="text-center text-sm text-gray-400 py-8">
      No following anyone yet!
    </p>
  }
  return (
    <div className="space-y-1">
      {following.map((f) => {
        const feed = f.target_feed;
        const user = feed?.created_by;
        const id = feed?.id ?? user?.id ?? "";
        const name = user?.custom?.full_name ?? user?.name ?? id;
        const username = user?.name ?? id;
        const image = user?.image ?? null;
        return (
          <Link
            key={f.source_feed?.feed + "-" + f.target_feed?.feed}
            href={`/profile/${id}`}
            onClick={onUserClick}
            className="flex items-center gap-3 py-2.5 rounded-lg hover:bg-gray-50"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
              {image ? (
                <Image src={image} alt={name} width={40} height={40} className="object-cover size-full" unoptimized />
              ) : (
                <div className="size-full bg-gray-400 flex items-center justify-center text-white font-semibold text-sm">
                  {(name ?? "?")[0]}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
              <p className="text-xs text-gray-400 truncate">@{username}</p>
            </div>
          </Link>
        );
      })}
      {hasNext && (
        <button
          type="button"
          onClick={() => loadNext?.({})}
          disabled={loading}
          className="w-full text-sm text-purple-600 font-medium py-2 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  )
}