"use client"

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image';
import { motion } from "motion/react";
import { Bookmark, Heart, MessageCircle, MoreVertical, Share2, Volume2, VolumeX } from 'lucide-react';
import Nav from '@/app/components/nav';
import { ActivityResponse, Feed } from "@stream-io/feeds-client";
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import Comment from './comment';

interface Reel {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  video: string;
  thumbnail: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  music: string;
}

const mockReels: Reel[] = [
  {
    id: "1",
    author: {
      name: "Alex Rivera",
      username: "@alexr",
      avatar: "/images/user-1.webp",
    },
    video: "",
    thumbnail: "/images/post.webp",
    caption: "Perfect day for some tricks 🛹 #skateboarding #lifestyle",
    likes: 24500,
    comments: 892,
    shares: 234,
    music: "Summer Vibes - DJ Cool",
  },
  {
    id: "2",
    author: {
      name: "Emma Wilson",
      username: "@emmaw",
      avatar: "/images/user-2.webp",
    },
    video: "/images/reel.mp4",
    thumbnail: "/images/post.webp",
    caption: "Living my best life ✨💫 #travel #adventure",
    likes: 18300,
    comments: 645,
    shares: 189,
    music: "Good Vibes Only - Artist",
  },
  {
    id: "3",
    author: {
      name: "Jordan Kim",
      username: "@jkim",
      avatar: "/images/user-1.webp",
    },
    video: "",
    thumbnail: "/images/post.webp",
    caption: "Sunset vibes 🌅 #nature #peaceful",
    likes: 31200,
    comments: 1024,
    shares: 456,
    music: "Chill Beats - Lo-Fi",
  },
];

type StreamActor = string | {
  id: string,
  name?: string,
  image?: string,
  custom?: Record<string, string>,
}

function getActorInfo(actor: StreamActor) {
  if (typeof actor === "string") {
    const id = actor.split(":").pop() ?? actor;
    return { id, username: id, fullName: id, avatar: null as string | null };
  }
  return {
    id: actor.id,
    username: actor.name || actor.custom?.full_name || actor.custom?.username || "User",
    fullName: actor.custom?.full_name ?? actor.name ?? actor.id,
    avatar: actor.image ?? null,
  };
}

export type ReelCardProps = {
  feed: Feed | undefined;
  activity: ActivityResponse;
  isActive: boolean;
};


export default function ReelCard({ feed, activity, isActive }: ReelCardProps) {
  const { user, client } = useAuth();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const { username, avatar, id: actorId } = getActorInfo(activity.user);
  const caption = activity.custom?.caption ?? activity.text ?? "";
  const attachment = activity.attachments?.[0];
  const videourl = attachment?.image_url as string ?? null;
  const likeCount = activity.reaction_count ?? 0;
  const commentCount = activity.comment_count ?? 0;

  const hasLiked = !!activity.own_reactions?.filter((reaction) => (
    reaction.activity_id === activity.id && reaction.user.id === user?.id
  ))[0];
  const hasBookmarked = !!activity.own_bookmarks?.filter((bookmark) => (
    bookmark.activity?.id === activity.id && bookmark.user?.id === user?.id
  ))[0];

  const custom = (activity.custom ?? {}) as Record<string, unknown>;
  const audioTitle = custom.audio_title as string | undefined;
  const audioArtist = custom.audio_artist as string | undefined;
  const topicTags = (custom.topic_tags as string[] | undefined) ?? [];
  const hashtags = caption.match(/#\w+/g) ?? [];
  const captionText = caption.replace(/#\w+/g, "").trim();
  const isOwnPost = actorId === user?.id;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().catch(() => { });
    } else {
      video.pause();
    }
  }, [isActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
  }, [muted]);

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

  // async function addBookmark(activity_id: string) {
  //   if (!client || !activity_id) return;
  //   await client.addBookmark({
  //     activity_id: activity_id,
  //   })
  // }

  const [currentIndex, setCurrentIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const itemHeight = window.innerHeight;
    const index = Math.round(scrollTop / itemHeight);
    if (index !== currentIndex && index >= 0 && index < mockReels.length) {
      setCurrentIndex(index);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [currentIndex]);

  if (!videourl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <p className="text-sm text-gray-400">No video</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full h-[calc(100dvh-10px)] flex flex-col bg-black snap-start snap-always overflow-hidden">
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            src={videourl}
            loop
            playsInline
            muted={muted}
            className="size-full object-cover"
          />
        </div>

        <div className="absolute inset-0 pointer-events-none bg-linear-to-t from-black/70 via-transparent to-transparent aria-hidden" />

        <button
          type="button"
          onClick={() => setMuted(!muted)}
          aria-label={muted ? "Unmute" : "mute"}
          className="absolute top-4 right-4 z-10 size-9 rounded-full bg-black/40 flex items-center justify-center text-white"
        >
          {muted ? (
            <VolumeX size={20} strokeWidth={2} />
          ) : (
            <Volume2 size={20} strokeWidth={2} />
          )}
        </button>

        <div className="absolute bottom-32 left-4 z-50 flex items-center gap-2 min-w-0">
          <Link
            href={isOwnPost ? "/profile" : `/profile/${actorId}`}
            className="flex items-center gap-2 min-w-0"
          >
            <div className="size-8 rounded-full overflow-hidden bg-gray-600 shrink-0 ring-1 ring-white">
              {avatar && (
                <Image
                  src={avatar}
                  alt={username}
                  width={32}
                  height={32}
                  unoptimized
                  className="size-full object-cover"
                />
              )}
            </div>
            <span className="text-sm font-semibold text-white truncate">
              @{username}
            </span>
          </Link>
        </div>

        <div className="absolute bottom-28 right-2 z-50 flex flex-col items-center gap-5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={() => toggleActivityReaction(activity.id, hasLiked ? "dislike" : "like")}
            className="flex flex-col items-center gap-1"
          >
            <Heart
              className={`size-8 transition-colors ${hasLiked
                ? "fill-red-500 text-red-500"
                : "text-white"
                }`}
              strokeWidth={hasLiked ? 0 : 1.8}
            />
            <span className="text-white text-lg font-semibold">
              {likeCount}
            </span>
          </motion.button>
          <button
            type="button"
            onClick={() => setCommentsOpen(true)}
            className="flex flex-col items-center gap-1 text-white"
          >
            <MessageCircle size={32} strokeWidth={1.8} />
            <span className="text-xs font-semibold">
              {commentCount}
            </span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-white"
          >
            <Share2 className="size-8" strokeWidth={1.8} />
            <span className="text-xs font-semibold">
              share
            </span>
          </button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={() => toggleBookmark(activity.id)}
            className="flex flex-col items-center gap-1"
          >
            <Bookmark
              className={`size-8 ${hasBookmarked
                ? "fill-blue-500 text-blue-500"
                : "text-white"
                }`}
              strokeWidth={hasBookmarked ? 0 : 1.8}
            />
          </motion.button>
          <button className="flex flex-col items-center gap-1">
            <MoreVertical className="size-8 text-white" />
          </button>
        </div>

        <div className="absolute bottom-25 left-4 right-14 z-10 text-white space-y-1">
          {(audioTitle || audioArtist) && (
            <p className="text-xs font-medium opacity-90">
              {[audioTitle, audioArtist].filter(Boolean).join(" . ")}
            </p>
          )}
          {(captionText || hashtags.length > 0 || topicTags.length > 0) && (
            <p className="text-sm leading-snug">
              {captionText && (
                <span>
                  <span className="font-semibold">@{username}</span>{" "}{captionText}
                </span>
              )}
              {(hashtags.length > 0 || topicTags.length > 0) && (
                <span>
                  {[...hashtags, ...topicTags.map((t) => `#${t}`)].join(" ")}
                </span>
              )}
            </p>
          )}
        </div>
      </div>
      <Nav />

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
