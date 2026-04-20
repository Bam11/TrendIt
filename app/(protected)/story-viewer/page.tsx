  "use client"
  
  import React, { useEffect, useRef, useState } from 'react'
  import { AnimatePresence, motion } from 'motion/react'
  import Image from 'next/image'
  import { ChevronLeft, ChevronRight, Heart, MoreVertical, Pause, Play, Send, X } from 'lucide-react'
  import { Feed } from '@stream-io/feeds-client';
  import moment from 'moment';

  // type StoryItem = {
  //   id: number,
  //   image: string,
  //   time: string,
  // }
  type ActivityLike = {
    id: string;
    actor?: StreamActor;
    created_at?: string;
    attachments?: Array<{ type?: string; image_url?: string }>;
  };

  type StreamActor = string | {
  id: string,
  name?: string,
  image?: string,
  custom?: Record<string, string>,
}

function getActorInfo(actor: StreamActor | undefined) {
  if (typeof actor === "string") {
    const id = actor.split(":").pop() ?? actor;
    return { id, username: id, fullName: id, avatar: null as string | null };
  }
  return {
    id: actor?.id,
    username: actor?.name ?? actor?.id,
    fullName: actor?.custom?.full_name ?? actor?.name ?? actor?.id,
    avatar: actor?.image ?? null,  
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
    const activity = activities[currentIndex];
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isVideo = activity?.attachments?.[0]?.type === "video";
    const mediaUrl = activity?.attachments?.[0]?.image_url as string | undefined;
    const durationMs = isVideo ? undefined : STORY_DURATION; 
    const [message, setMessage] = useState("");

    const { username, avatar } = getActorInfo(activity.actor);

    // const advance = useCallback(() => {
    //   if(activity?.id && feed) onMarkMatched(activity.id);
    //   if(currentIndex < activities.length - 1) {
    //     onNext();
    //   } else {
    //     onClose();
    //   }
    // }, [activity?.id, feed, currentIndex, activities.length, onNext, onClose, onMarkMatched]);

    const advance = () => {
  if (activity?.id && feed) onMarkMatched(activity.id);

  if (currentIndex < activities.length - 1) {
    onNext();
  } else {
    onClose();
  }
};

    useEffect(() => {
      if(!activity || !mediaUrl) return;
      setProgress(0);
      if (isVideo) {
        const video = document.querySelector<HTMLVideoElement>("[data-story-video]");
        if(video){
          const onTimeUpdate = () => {    
            if (video.duration && video.duration > 0){
              setProgress((video.currentTime / video.duration) * 100);
            }
          };
          const onEnded = () => advance();
          video.addEventListener("timeupdate", onTimeUpdate);
          video.addEventListener("ended", onEnded);
          video.play().catch(() => {});
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
        if(p >= 100){
          if(intervalRef.current) clearInterval(intervalRef.current);
          advance();
        }
      }, 50);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [activity?.id, mediaUrl, isVideo, durationMs, advance])

    useEffect(() => {
      if(isPaused && intervalRef.current){
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



    // const handleNext = () => {
    //   if (currentIndex < stories.length - 1) {
    //     setCurrentIndex(currentIndex + 1);
    //     setProgress(0);
    //   } else {
    //     onClose();
    //   }
    // }

    // const handlePrev = () => {
    //   if (currentIndex > 0) {
    //     setCurrentIndex(currentIndex - 1);
    //     setProgress(0)
    //   }
    // }

    // useEffect(() => {
    //   if (!isOpen || isPaused) return;

    //   // setProgress(0);
    //   const startTime = Date.now();

    //   const interval = setInterval(() => {
    //     const elapsed = Date.now() - startTime;
    //     const newProgress = (elapsed / STORY_DURATION) * 100;

    //     if (newProgress >= 100) {
    //       handleNext();
    //     } else {
    //       setProgress(newProgress);
    //     }
    //   }, 50);

    //   return () => {
    //     clearInterval(interval);
    //     setProgress(0);
    //   };
    // }, [currentIndex, isOpen, isPaused]);


    // if (!isOpen) return null;

    // const currentStory = stories[currentIndex];

    const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault()
      if(message.trim()) {
        setMessage("");
        console.log(message);
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
          <div className="relative size-full max-w-93.75 mx-auto">
            {!mediaUrl ? (
              <p>No Media</p>
            ) : isVideo ? (
              <video 
                src={mediaUrl}
                data-story-video
                playsInline
                muted
                className="max-w-full max-h-full object-contain"
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

            <div className="absolute inset-0 bg-linear-to-b from-black/50 via-transparent to-black/50" />

            <div className="absolute top-0 left-0 right-0 p-2 flex gap-1">
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
                    className="h-full bg-white rounded-full ttransition-all duration-75"
                  />
                </div>
              ))}
            </div>

            <div className="absolute top-5 left-0 right-0 px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {avatar && (
                  <Image
                    src={avatar}
                    alt={username!}
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-white object-cover"
                  />
                )}
                <div>
                  <p className="text-white font-semibold text-sm">{username}</p>
                  <p className="text-white font-semibold text-sm">{moment(activity.created_at).fromNow()}</p>
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
              className="absolute left-0 bottom-0 top-0 w-1px flex items-center justify-start pl-4 opacity-0 hover:opacity-100 transition-opacity"
            >
              {currentIndex > 0 && (
                <div className="p-2 bg-black/30 rounded-full">
                  <ChevronLeft className="size-6 text-white" />
                </div>
              )}
            </button>

            <button
              onClick={advance}
              className="absolute right-0 bottom-0 top-0 w-px flex items-center justify-end pr-4 opacity-0 hover:opacity-100 transition-opacity"
            >
              <div className="p-2 bg-black/30 rounded-full">
                <ChevronRight className="size-6 text-white" />
              </div>
            </button>

            <div className="absolute inset-x-0 bottom-0 p-4">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2" 
              >
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="send message"
                  className="flex px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                />
                <button
                  type="button"
                  className="p-3 hover:bg-white/20 rounded-full transition-colors"
                >
                  <Heart className="size-6 text-white"/>
                </button>
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                >
                  <Send className="size-6 text-white"/>
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }