"use client"

import { useState } from 'react';
import Image from "next/image";
import { motion } from "motion/react";
import { useAuth } from '../context/AuthContext';
import { Bookmark, Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Loader2 } from "lucide-react";
import { ActivityResponse, Feed } from '@stream-io/feeds-client';
import moment from 'moment';
import Comment from './comment';
import { useOwnFollowings } from '@stream-io/feeds-client/react-bindings';
import { createClient } from '@/app/lib/supabase/client';

type StreamActor = string | {
  id: string,
  name?: string,
  image?: string,
  custom?: Record<string, string>,
}

function getActorInfo(actor: StreamActor, currentUser?: any) {
  if (!actor) {
    if (currentUser) {
      return {
        id: currentUser.id,
        username: currentUser.user_metadata?.username || currentUser.user_metadata?.name?.split(" ")?.[0] || "User",
        fullName: currentUser.user_metadata?.full_name || currentUser.user_metadata?.fullname || currentUser.user_metadata?.name || "User",
        avatar: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.image || currentUser.user_metadata?.picture || null,
      };
    }
    return { id: "", username: "User", fullName: "User", avatar: null as string | null };
  }

  const id = typeof actor === "string" ? (actor.split(":").pop() ?? actor) : actor.id;
  const isCurrent = currentUser && id === currentUser.id;

  if (isCurrent) {
    const avatar = currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.image || currentUser.user_metadata?.picture || (typeof actor !== "string" ? actor.image : null) || null;
    const fullName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.fullname || currentUser.user_metadata?.name || (typeof actor !== "string" ? (actor.custom?.full_name ?? actor.name) : id);
    const username = currentUser.user_metadata?.username || (typeof actor !== "string" ? (actor.name || actor.custom?.username) : id);
    return { id, username, fullName, avatar };
  }

  if (typeof actor === "string") {
    return { id, username: id, fullName: id, avatar: null as string | null };
  }
  return {
    id: actor.id,
    username: actor.name || actor.custom?.full_name || actor.custom?.username || "User",
    fullName: actor.custom?.full_name ?? actor.name ?? actor.id,
    avatar: actor.image ?? null,
  };
}

// type PostActivity = {
//   id: string,
//   actor: StreamActor,
//   text?: string,
//   custom?: { caption?: string },
//   attachments?: Array<{ type: string; image_url?: string }>;
//   created_at: string,
//   time?: string,
//   reaction_count?: { like?: number, comment?: number },
// }

// type Post = {
//   id: number,
//   author: {
//     name: string,
//     image: string,
//   }
//   content: {
//     type: "text" | "image" | "video",
//     text?: string,
//     image?: string,
//     video?: string,
//   },
//   caption: string,
//   likes: number,
//   comments: number,
//   time: string,
//   tags: string[],
// }

export default function PostCard({ activity, feed }: { activity: ActivityResponse; feed: Feed | undefined }) {
  const { user, client } = useAuth();
  const supabase = createClient();

  // const [activities, setActivities] = useState<ActivityResponse[]>([])
  const { username, avatar, id: actorId } = getActorInfo(activity.user);
  const caption = activity.custom?.caption ?? activity.text ?? "";
  const attachment = activity.attachments?.[0];
  const image = attachment?.image_url ?? null;
  const video = attachment?.asset_url ?? null;
  const likeCount = (activity.reaction_count ?? 0);
  const commentCount = activity.comment_count ?? 0;
  const hashTags = caption.match(/#\w+/g) ?? [];
  const captionText = caption.replace(/#\w+/g, "").trim();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    setIsDeleting(true);
    try {
      if (!client) {
        throw new Error("GetStream client is not available")
      }

      await client.deleteActivity({
        id: activity.id,
        hard_delete: true,
      });

      const { data: deletedPost, error: supabaseError } = await supabase
        .from("post")
        .delete()
        .eq("stream_activity_id", activity.id)
        .select("id, stream_activity_id");

      if (supabaseError) {
        console.error("Failed to delete post:", supabaseError)
      }
      console.log("Deleted Supabase post:", deletedPost);

      setIsDeleted(true);
    } catch (err) {
      console.error("Failed to delete post:", err);
      alert("Failed to delete post.");
    } finally {
      setIsDeleting(false);
      setOptionsOpen(false);
    }
  };
  // const { activities } = useFeedActivities(feed);
  console.log("ACTIVITY:", activity);
  console.log("ATTACHMENTS:", activity.attachments);

  // const posts = [
  //   {
  //     id: 1,
  //     author: {
  //       name: "Alex Da Great",
  //       image: "/images/user-1.webp",
  //     },
  //     content: {
  //       type: "image",
  //       image: "/images/post.webp",
  //       video: "",
  //       text: "",
  //     },
  //     caption: "Perfect days for some skating today",
  //     likes: 120,
  //     comments: 250,
  //     time: "22h ago",
  //     tags: ["#skateboarding", "#fun", "#weekend"],
  //   }
  // ]
  const hasLiked = !!activity.own_reactions?.filter(
    (reaction) =>
    (reaction.activity_id === activity.id &&
      reaction.user.id === user?.id)
  )[0];

  const hasBookmarked = !!activity.own_bookmarks?.filter(
    (bookmark) =>
    (bookmark.activity.id === activity.id &&
      bookmark.user.id === user?.id)
  )[0];

  const { own_followings } = useOwnFollowings(feed) ?? {};
  const isFollowing = !!own_followings?.some(
    (follow) => follow.target_feed?.id === actorId || follow.target_feed?.feed === `user:${actorId}`
  );

  const isOwnPost = actorId === user?.id;
  const [followLoading, setFollowLoading] = useState(false);

  async function toggleFollow() {
    if (!client || !user?.id || isOwnPost || followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await Promise.all([
          client.unfollow({ source: `timeline:${user.id}`, target: `user:${actorId}` }),
          client.unfollow({ source: `stories:${user.id}`, target: `story:${actorId}` }),
        ]);
      } else {
        await Promise.all([
          client.follow({ source: `timeline:${user.id}`, target: `user:${actorId}` }),
          client.follow({ source: `stories:${user.id}`, target: `story:${actorId}` }),
        ]);
      }
    } finally {
      setFollowLoading(false);
    }
  }

  async function toggleActivityReaction(activity_id: string, reaction_type: "like" | "dislike") {
    if (!client || !activity_id) return;

    await (reaction_type === "like" ? client.addActivityReaction : client.deleteActivityReaction)({
      activity_id: activity_id,
      type: "like",
      ...(reaction_type === "like" ? {
        custom: {
          emoji: "❤️",
        },
      } : {}),
      //optionally override existing reaction
      enforce_unique: true,
    });
  };

  const [isBookmarked, setIsBookmarked] = useState(hasBookmarked);

  async function toggleBookmark(activity_id: string) {
    if (!client) return;

    try {
      if (isBookmarked) {
        await client.deleteBookmark({ activity_id });
        setIsBookmarked(false);
      } else {
        await client.addBookmark({ activity_id });
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (isDeleted) return null;
  // async function addBookmark(activity_id: string) {
  //   if (!client || !activity_id) return;
  //   await client.addBookmark({
  //     activity_id: activity_id,
  //   })
  // }

  // const fetchFeeds = useCallback(async () => {
  //   if (!client || !user) return;
  //   setLoading(true);
  //   try {
  //     const feed = client.feed("timeline", user.id);

  //     const response = await feed.getOrCreate({ watch: true, limit: 20 });
  //     const activities = response.activities ?? [];
  //     if (activities.length > 0) {
  //       setFeed(feed);
  //       // setActivities(activities);
  //     } else {
  //       throw new Error("No activities found");
  //     }
  //   } catch {
  //     try {
  //       const feed = client.feed("user", user.id);
  //       const response = await feed.getOrCreate({ watch: true, limit: 20 });
  //       const activities = response.activities ?? [];
  //       // setActivities(activities);
  //       setFeed(feed);
  //     } catch {
  //       // setActivities([])
  //       setFeed(undefined);
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [client, user]);

  // useEffect(() => {
  //   fetchFeeds();
  // }, [fetchFeeds]);

  return (
    <>
      <div className="space-y-6 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100"
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {avatar && (
                <Image
                  src={avatar}
                  alt={username}
                  width={40}
                  height={40}
                  loading="lazy"
                  unoptimized
                  className="size-10 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-semibold text-sm text-[#0a0a0a]">{username}</p>
                <p className="text-gray-500 text-xs">{moment(activity.created_at).fromNow()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 relative">
              {!isOwnPost && (
                <button
                  type="button"
                  onClick={toggleFollow}
                  disabled={followLoading}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition disabled:opacity-50 ${isFollowing
                    ? "text-gray-700 hover:bg-gray-200"
                    : "bg-linear-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text hover:opacity-90"}`}
                >
                  {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setOptionsOpen(!optionsOpen)}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                title="Post Options"
              >
                <MoreHorizontal className="size-5" />
              </button>

              {optionsOpen && (
                <div className="absolute right-0 top-9 z-50 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-36 text-left">
                  {isOwnPost ? (
                    <button
                      type="button"
                      onClick={handleDeletePost}
                      disabled={isDeleting}
                      className="w-full px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer font-medium"
                    >
                      {isDeleting ? (
                        <Loader2 className="size-4 animate-spin text-red-600" />
                      ) : (
                        <Trash2 className="size-4 text-red-600" />
                      )}
                      <span>Delete Post</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOptionsOpen(false)}
                      className="w-full px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Report Post
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="relative w-full">
            {image ? (
              <div className="relative bg-gray-100 overflow-hidden aspect-square">
                <Image
                  src={image}
                  alt="Post"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : video && (
              <video
                src={video}
                controls
                autoPlay
                playsInline
                preload="metadata"
                muted
                // loop
                className="aspect-square object-cover overflow-hidden bg-gray-100"
              />
            )}
            {/* {post.content.type === "image" && post.content.image && (
                <div className="relative bg-gray-100">
                  <Image
                    width={360}
                    height={380}
                    src={post.content.image}
                    alt={post.content.type}
                    className="size-90 object-cover"
                    loading="eager"
                  />
                </div>
              )}
              {post.content.type === "video" && post.content.video && (
                <div className="relative bg-gray-100">
                  <video
                    src={post.content.video}
                    controls
                    className="size-full object-cover"
                  />
                </div>
              )}
              {post.content.type === "text" && post.content.text && (
                <div className="p-6 bg-white text-lg font-medium">
                  {post.content.text}
                </div>
              )} */}
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="flex items-center gap-2 transition-transform active:scale-90 outline-none"
                  onClick={() => toggleActivityReaction(activity.id, hasLiked ? "dislike" : "like")}
                >
                  <Heart
                    className={`size-6 transition-colors 
                        ${hasLiked ? "fill-red-500 text-red-500" : "text-gray-700"}`}
                    strokeWidth={hasLiked ? 0 : 1.8}
                  />
                  {likeCount > 0 && (
                    <span className="text-sm font-medium text-gray-900">
                      {likeCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setCommentsOpen(true)}
                  className="flex items-center gap-2 transition-transform active:scale-90 outline-none"
                >
                  <MessageCircle className="size-6 text-gray-700" strokeWidth={1.8} />
                  {commentCount > 0 && (
                    <span className="text-sm font-medium text-gray-900">{commentCount}</span>
                  )}
                </button>
                <button className="transition-transform active:scale-90 outline-none">
                  <Share2 className="size-6 text-gray-700" />
                </button>
              </div>
              <button
                onClick={() => toggleBookmark(activity.id)}
                className="transition-transform active:scale-90 outline-none"
              >
                <Bookmark className={`size-6 transition-colors 
                    ${isBookmarked ? "fill-blue-600 text-blue-600" : "text-gray-700"}`}
                  strokeWidth={isBookmarked ? 0 : 1.8}
                />
              </button>
            </div>

            <div className="space-y-2">
              {(captionText || hashTags.length > 0) && (
                <div>
                  {captionText && (
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold mr-2">@{username}</span>{" "}
                      {captionText}
                    </p>
                  )}
                  {hashTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {hashTags.map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <p className="text-[12px] text-gray-500">View all {commentCount} comments</p>
            </div>
          </div>
        </motion.div>
      </div>

      {commentsOpen &&
        <Comment
          activity={activity}
          feed={feed}
          open={commentsOpen}
          onClose={() => setCommentsOpen(false)}
        />
      }
    </>
  )
}