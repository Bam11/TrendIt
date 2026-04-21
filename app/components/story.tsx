"use client"

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Feed } from "@stream-io/feeds-client";
import Image from "next/image";
import { cn } from "../lib/utils"
import StoryViewer from "../(protected)/story-viewer/page";
import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

// type StoryItem = {
//   id: number,
//   image: string,
//   time: string,
// }

// type StoryUser = {
//   id: number,
//   user: {
//     image: string,
//     name: string,
//     time: string,
//   },
//   stories: StoryItem[],
// }

type ActivityLike = {
  id: string;
  attachments?: Array<{ type?: string; image_url?: string }>
}

type StreamActor = string | {
  id: string;
  name?: string;
  image?: string;
  custom?: Record<string, string>;
};

function getActorInfo(actor: StreamActor) {
  if (typeof actor === "string") {
    const id = actor.split(":").pop() ?? actor;
    return { id, username: id, fullName: id, avatar: null as string | null };
  }
  return {
    id: actor.id,
    username: actor.name ?? actor.id,
    fullName: actor.custom?.full_name ?? actor.name ?? actor.id,
    avatar: actor.image ?? null,
  };
}

type StoryGroup = {
  id?: string;
  activities?: Array<{ id: string; user?: StreamActor }>;
  is_watched?: boolean;
};

export type StoryProps = {
  userAvatar?: string;
  currentUserId: string | undefined;
  myStoryCount: number;
  aggregatedGroups: StoryGroup[];
}

export default function Story({ userAvatar, currentUserId, myStoryCount, aggregatedGroups }: StoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const { user: currentUser, client } = useAuth();
  const [feed, setFeed] = useState<Feed | undefined>(undefined);
  const [activities, setActivities] = useState<ActivityLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const userStoriesRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setshowLeftArrow] = useState(false);
  const [showRightArrow, setshowRightArrow] = useState(true);   

  useEffect(() => {
    if (!userId || !client) {
      if (!userId) router.replace("/");
      return;
    }
    
    const storyFeed = client.feed("story", userId);
    storyFeed
      .getOrCreate({ watch: true, limit: 100 })
      .then((res) => {
        setFeed(storyFeed);
        const activities = (res.activities ?? []) as ActivityLike[];
        setActivities(activities.slice().reverse());
        setCurrentIndex(0);
      })
      .catch(() => {
        setActivities([]);
      })
      .finally(() => setLoading(false))
  }, [client, router, userId]);

  const markWatched = useCallback(
    async (activityId: string) => {
      if (!feed) return;
      try {
        await feed.markActivity({ mark_watched: [activityId] })
      } catch {

      }
    },
    [feed]
  )

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1))
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(activities.length - 1, i + 1))
  }, [activities.length]);

  useEffect(() => {
    const handleScroll = () => {
      const element = userStoriesRef.current;
      if (element) {
        setshowLeftArrow(element.scrollLeft > 0);
        setshowRightArrow(
          element.scrollLeft !== element.scrollWidth - element.clientWidth
        );
      }
    };

    const element = userStoriesRef.current;
    if (element) {
      element.addEventListener("scroll", handleScroll);

      return () => {
        element.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  // if (loading) {
  //   return (
  //     <div className="fixed  inset-0 bg-black flex items-center justify-center z-50">
  //       <div className="size-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  //     </div>
  //   );
  // }

  // if (!userId || activities.length === 0) {
  //   return (
  //     <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 gap-4">
  //       <p className="text-white/80 text-sm">No stories to view</p>
  //       <button
  //         type="button"
  //         onClick={() => router.back()}
  //         className="text-white underline text-sm"
  //       >
  //         Go back
  //       </button>
  //     </div>
  //   );
  // }

  // const storyUser = [
  //   {
  //     id: 1,
  //     user: { image: "/images/user-1.webp", name: "Alex Da Great", time: "2h ago" },
  //     stories: [
  //       { id: 1, image: "/images/post.webp", time: "2h ago" },
  //       { id: 2, image: "/images/post.webp", time: "3h ago" },
  //       { id: 3, image: "/images/post.webp", time: "10m ago" },

  //     ]
  //   },
  //   {
  //     id: 2,
  //     user: { image: "/images/user-2.webp", name: "OG Titilayo", time: "4h ago" },
  //     stories: [
  //       { id: 1, image: "/images/post.webp", time: "2h ago" },
  //       { id: 2, image: "/images/post.webp", time: "3h ago" },
  //       { id: 3, image: "/images/post.webp", time: "10m ago" },

  //     ]
  //   },
  //   {
  //     id: 3,
  //     user: { image: "/images/user-1.webp", name: "OG Victoria", time: "6h ago" },
  //     stories: [
  //       { id: 1, image: "/images/post.webp", time: "2h ago" },
  //       { id: 2, image: "/images/post.webp", time: "3h ago" },
  //       { id: 3, image: "/images/post.webp", time: "10m ago" },

  //     ]
  //   },
  //   {
  //     id: 4,
  //     user: { image: "/images/user-2.webp", name: "OG Titilayo", time: "7h ago" },
  //     stories: [
  //       { id: 1, image: "/images/post.webp", time: "2h ago" },
  //       { id: 2, image: "/images/post.webp", time: "3h ago" },
  //       { id: 3, image: "/images/post.webp", time: "10m ago" },

  //     ]
  //   },
  //   {
  //     id: 5,
  //     user: { image: "/images/user-1.webp", name: "OG Victoria", time: "8h ago" },
  //     stories: [
  //       { id: 1, image: "/images/post.webp", time: "2h ago" },
  //       { id: 2, image: "/images/post.webp", time: "3h ago" },
  //       { id: 3, image: "/images/post.webp", time: "10m ago" },

  //     ]
  //   },
  // ]

  // const openStoryViewer = (story: StoryUser) => {
  //   setSelectedStoryUser(story);
  //   setStoryViewerOpen(true);
  // }

  const handleScrollLeft = () => {
    const userStories = userStoriesRef.current;
    if (userStories && userStories.scrollLeft) userStories.scrollLeft -= 356;
  };

  const handleScrollRight = () => {
    const userStories = document.getElementById("user-stories");
    if (userStories) userStories.scrollLeft += 356;
  };

  return (
    <div className="relative group">
      <div
        ref={userStoriesRef}
        id="user-stories"
        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
      >
        <Link
          href={myStoryCount > 0 ? `/stories?userId=${currentUserId}` : "/add-story"}
          className="flex flex-col items-center gap-2"
        >
          <div className="relative">
            <div className={`size-16 rounded-full border  overflow-hidden shrink-0 ${myStoryCount > 0
              ? "border-transparent bg-linear-to-r from-blue-600 to-purple-600 p-0.5"
              : "border-gray-200 bg-gray-100"
              } `}>
              <div className="size-full rounded-full overflow-hidden border border-white bg-gray-200 relative">
                {userAvatar ? (
                  <Image
                    src={userAvatar}
                    alt="Your Story"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="size-full bg-linear-to-br from-blue-600 to-purple-600" />
                )}
              </div>
            </div>

            <div className="absolute -bottom-0.5 z-20 -right-0.5 size-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
              <Plus size={12} strokeWidth={3} className="text-white" />
            </div>
          </div>
          <span className="text-xs text-gray-600 w-14 text-center truncate">Your Story</span>
        </Link>

        {aggregatedGroups.map((group) => {
          const firstActivity = group.activities?.[0]
          const actor = firstActivity?.user
          const { id: authorId, username } = getActorInfo(actor ?? "");
          const hasWatched = !group.is_watched;
          return (
            <Link
              key={group.id ?? authorId ?? firstActivity?.id ?? " "}
              href={`/story-viewer?userId=${encodeURIComponent(authorId)}`}
            >
              <div className={`size-16 rounded-full p-0.5 ${hasWatched ? "bg-linear-to-r from-blue-600 to-purple-600"
                : "bg-gray-300"
                }`}>
                <div className="size-full rounded-full overflow-hidden border border-white bg-gray-800 relative">
                  {getActorInfo(actor ?? "").avatar && (
                    <Image
                      src={getActorInfo(actor ?? "").avatar!}
                      alt={username}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-600 w-14 text-center truncate">
                {username}
              </span>
            </Link>
          )
        })}

        {/* my row is empty with this out */}
        {/* {storyUser.map((story) => (
          <button
            key={story.id}
            onClick={() => openStoryViewer(story)}
            className="flex flex-col items-center gap-2"
          >
            <div className="size-16 rounded-full bg-linear-to-r from-pink-500 via-purple-500 to-blue-500 p-0.5">
              <Image
                src={story.user.image}
                alt={story.user.name}
                width={64}
                height={64}
                loading="lazy"
                className="rounded-full object-cover border-2 border-white"
              />
            </div>
            <span className="text-xs text-gray-600 max-w-16 truncate">{story.user.name}</span>
          </button>
        ))} */}
      </div>
      <div onClick={handleScrollLeft}
        className={cn("absolute left-0 top-[20%] rotate-180 cursor-pointer select-none transition-all duration-300 ", showLeftArrow
          ? "group-hover: opacity-100"
          : "opacity-0 pointer-events-none"
        )}
      >
        <ChevronRight size={28} className="text-gray-600" />
      </div>
      <div onClick={handleScrollRight}
        className={cn("absolute right-0 top-[20%] cursor-pointer select-none transition-all duration-300", showRightArrow
          ? "group-hover: opacity-100"
          : "opacity-0 pointer-events-none"
        )}
      >
        <ChevronRight size={28} className="text-gray-600" />
      </div>


      <StoryViewer
        activities={activities}
        feed={feed}
        currentIndex={currentIndex}
        onClose={handleClose}
        onPrev={handlePrev}
        onNext={handleNext}
        onMarkMatched={markWatched}
      />
    </div>
  )
}
