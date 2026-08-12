"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Heart, MoreVertical, Pause, Play, Send, X, Eye } from 'lucide-react'
import { Feed } from '@stream-io/feeds-client';
import moment from 'moment';
import { useAuth } from '@/app/context/AuthContext';

// type StoryItem = {
//   id: number,
//   image: string,
//   time: string,
// }
type ActivityLike = {
  id: string;
  actor?: StreamActor;
  user?: StreamActor;
  created_at?: string;
  attachments?: Array<{ type?: string; image_url?: string; asset_url?: string }>;
  text?: string;
  custom?: Record<string, unknown>;
};

type StreamActor = string | {
  id: string,
  name?: string,
  image?: string,
  custom?: Record<string, string>,
}

function getActorInfo(actor: StreamActor | undefined, currentUser?: any) {
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

type StoryViewerProps = {
  activities: ActivityLike[];
  feed: Feed | undefined;
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onMarkMatched: (activityId: string) => void;
}

const STORY_DURATION = 5000;

export default function StoryViewer({ activities, feed, currentIndex, onClose, onPrev, onNext, onMarkMatched }: StoryViewerProps) {
  const { user } = useAuth();
  const activity = activities[currentIndex];
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVideo = activity?.attachments?.[0]?.type === "video";
  const mediaUrl = activity?.attachments?.[0]?.image_url as string | undefined || activity?.attachments?.[0]?.asset_url as string | undefined;
  const isTextStory = Boolean(activity?.text && activity?.custom?.content_type === "story");
  const durationMs = isVideo ? undefined : STORY_DURATION;
  const [message, setMessage] = useState("");

  const { id: actorId, username, avatar } = getActorInfo(activity?.user || activity?.actor, user);
  const isOwner = Boolean(actorId && user?.id && actorId === user?.id);

  const advance = useCallback(() => {
    if (activity?.id && feed) onMarkMatched(activity.id);

    if (currentIndex < activities.length - 1) {
      onNext();
    } else {
      onClose();
    }
  }, [activity?.id, feed, currentIndex, activities.length, onNext, onClose, onMarkMatched]);

  useEffect(() => {
    if (!activity || (!mediaUrl && !isTextStory)) return;
    setProgress(0);
    if (isVideo) {
      const video = document.querySelector<HTMLVideoElement>("[data-story-video]");
      if (video) {
        const onTimeUpdate = () => {
          if (video.duration && video.duration > 0) {
            setProgress((video.currentTime / video.duration) * 100);
          }
        };
        const onEnded = () => advance();
        video.addEventListener("timeupdate", onTimeUpdate);
        video.addEventListener("ended", onEnded);
        video.play().catch(() => { });
        return () => {
          video.removeEventListener("timeupdate", onTimeUpdate);
          video.removeEventListener("ended", onEnded);
        };
      }
    }

    if (durationMs == null) return;
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elasped = Date.now() - start;
      const p = Math.min(100, (elasped / durationMs) * 100);
      setProgress(p);
      if (p >= 100) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        advance();
      }
    }, 50);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activity?.id, mediaUrl, isVideo, durationMs, advance])

  useEffect(() => {
    if (isPaused && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isPaused]);

  if (!activity) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <p className="text-white text-sm">
          No story
        </p>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white p-2"
        >
          <X className="size-6" />
        </button>
      </div>
    );
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      alert(`Simulating Sending Message to ${username}: "${message}"\n\n(Chat Inbox integration to be built here)`);
      setMessage("");
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-100 bg-black"
      >
        <div className="relative size-full max-w-150 mx-auto overflow-hidden">
          {isTextStory ? (
            <div
              className="size-full flex items-center justify-center p-8 text-center"
              style={{ background: (activity.custom?.backgroundColor as string) || "#667eea" }}
            >
              <h2 className="text-white text-4xl font-bold whitespace-pre-wrap">{activity.text}</h2>
            </div>
          ) : !mediaUrl ? (
            <div className="size-full flex items-center justify-center">
              <p className="text-white/50">Loading Media...</p>
            </div>
          ) : isVideo ? (
            <video
              src={mediaUrl}
              data-story-video
              playsInline
              muted={false} // Unmute for actual story
              className="size-full object-contain"
            />
          ) : (
            <Image
              src={mediaUrl}
              alt="Story"
              fill
              unoptimized
              className="size-full object-contain"
            />
          )}

          <div className="absolute inset-0 bg-linear-to-b from-black/50 via-transparent to-black/50 pointer-events-none" />

          <div className="absolute top-0 left-0 right-0 p-2 flex gap-1 z-10">
            {activities.map((_, index) => (
              <div
                key={index}
                className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
              >
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{
                    width: index < currentIndex
                      ? "100%" : index === currentIndex
                        ? `${progress}%` : "0%"
                  }}
                  transition={{ duration: 0.1 }}
                  className="h-full bg-white rounded-full transition-all duration-75"
                />
              </div>
            ))}
          </div>

          <div className="absolute top-5 left-0 right-0 px-4 flex items-center justify-between z-100">
            <div className="flex items-center gap-3">
              {avatar && (
                <Image
                  src={avatar}
                  alt={username!}
                  width={36}
                  height={36}
                  className="rounded-full border border-white/50 object-cover"
                />
              )}
              <div>
                <p className="text-white font-semibold text-sm drop-shadow-md">{username}</p>
                <p className="text-white/80 font-medium text-xs drop-shadow-md">{moment(activity.created_at).fromNow()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {isPaused ? (
                  <Play className="size-5 text-white cursor-pointer" />
                ) : (
                  <Pause className="size-5 text-white cursor-pointer" />
                )}
              </button>
              <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <MoreVertical className="size-5 text-white cursor-pointer" />
              </button>
              <button
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label='Close'
                onClick={onClose}
              >
                <X className="size-5 text-white cursor-pointer" />
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              if (currentIndex > 0) onPrev();
              else onClose();
            }}
            disabled={currentIndex === 0}
            className="absolute left-0 bottom-0 top-0 w-24 flex items-center justify-start pl-4 opacity-0 hover:opacity-100 transition-opacity z-10"
          >
            {currentIndex > 0 && (
              <div className="p-2 bg-black/30 rounded-full">
                <ChevronLeft className="size-6 text-white" />
              </div>
            )}
          </button>

          <button
            onClick={advance}
            className="absolute right-0 bottom-0 top-0 w-24 flex items-center justify-end pr-4 opacity-0 hover:opacity-100 transition-opacity z-10"
          >
            <div className="p-2 bg-black/30 rounded-full">
              <ChevronRight className="size-6 text-white" />
            </div>
          </button>

          {isOwner ? (
            <div className="absolute inset-x-0 bottom-0 p-4 flex items-center justify-between z-10">
              <div className="flex -space-x-2">
                <div className="size-8 rounded-full bg-blue-500 border-2 border-black flex items-center justify-center overflow-hidden">
                  <Image src="/images/user-1.webp" alt="Viewer" width={32} height={32} className="object-cover" />
                </div>
                <div className="size-8 rounded-full bg-purple-500 border-2 border-black flex items-center justify-center overflow-hidden">
                  <Image src="/images/user-2.webp" alt="Viewer" width={32} height={32} className="object-cover" />
                </div>
                <div className="size-8 rounded-full bg-gray-600 border-2 border-black flex items-center justify-center text-[10px] text-white font-bold">
                  +12
                </div>
              </div>
              <div className="text-white text-sm font-semibold flex items-center gap-2 cursor-pointer hover:bg-white/20 px-3 py-1.5 rounded-full transition-all backdrop-blur-sm">
                <Eye className="size-5" />
                14 Viewers
              </div>
            </div>
          ) : (
            <div className="absolute inset-x-0 bottom-0 p-4 z-10">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Send message to ${username}`}
                  className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                />
                <button
                  type="button"
                  className="p-3 hover:bg-white/20 rounded-full transition-colors shrink-0 cursor-pointer"
                >
                  <Heart className="size-6 text-white" />
                </button>
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  <Send className="size-6 text-white" />
                </button>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}