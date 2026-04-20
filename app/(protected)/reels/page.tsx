"use client"

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Feed } from "@stream-io/feeds-client";
import { useFeedActivities } from "@stream-io/feeds-client/react-bindings";
import ReelCard from "@/app/components/reel-card"
import Link from "next/link";

export default function Reels() {
  const { user, client } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState<Feed | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { activities, loadNextPage, has_next_page, is_loading } = useFeedActivities(feed);

  const limit = 20;

  const fetchFeed = useCallback(async () => {
    if (!client || !user) return;
    setLoading(true);
    try {
      const timelineFeed = client.feed("timeline", user.id);
      const response = await timelineFeed.getOrCreate({
        watch: true,
        limit,
        filter: { activity_type: "reel" },
      });
      const activities = response.activities ?? [];
      if (activities.length > 0) {
        setFeed(timelineFeed)
      } else {
        throw new Error("No Activities");
      }
    } catch {
      try {
        const userFeed = client.feed("user", user.id)
        await userFeed.getOrCreate({
          watch: true,
          limit,
          filter: { activity_type: "reel" }
        });
        setFeed(userFeed);
      } catch {
        setFeed(undefined);
      }
    } finally {
      setLoading(false);
    }
  }, [client, user]);

  useEffect(() => {
    fetchFeed()
  }, [fetchFeed]);

  const activityCount = activities?.length ?? 0;

  useEffect(() => {
    const element = containerRef.current;
    if(!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if(!entry.isIntersecting) return;
          const index = parseInt(
            (entry.target as HTMLElement).dataset.reelIndex ?? "0",
            10
          );
          setActiveIndex(index);
        });
      },
      {
        root: element,
        rootMargin: "0px",
        threshold: 0.5,
      }
    );

    const children = element.querySelectorAll("[data-reel-index]");
    children.forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [activityCount]);

  return (
    <div className="flex flex-col h-screen bg-black max-w-sm mx-auto">
      {/* <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0 z-0 bg-black/80">
        <h1 className="text-xl font-bold text-white">Reels</h1>
        <Link
          href="/create"
          className="text-sm font-semibold text-blue-500 hover:text-blue-400"
        >
          Create
        </Link>
      </header> */}

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto snap-y snap-mandatory no-scrollbar" 
        style={{ height: "calc(100vh-52px)" }}
      >
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="size-8 border-2 border-white/20 border-t-white rounded-full animate-spin"/>
          </div>
        ) : (activities?.length ?? 0) === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-base font-semibold text-white">
              No reels yet
            </p>
            <p className="text-sm text-gray-400">
              Create a reel from the Create page to see it here.
            </p>
            <Link
              href="/create"
              className="px-4 py-2.5 rounded-full bg-linear-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold hover:from-blue-500 hover:to-purple-500 transition"
            >
              Create Reel
            </Link>
          </div>
        ) : (
          <>
            {(activities ?? []).map((activity, index) => (
              <section
                key={activity.id}
                data-reel-index={index}
                className="snap-center snap-always w-full shrink-0"
                style={{ height: "calc(100vh -52px)" }}
              >
                <ReelCard
                  feed={feed}
                  activity={activity}
                  isActive={activeIndex === index}
                />
              </section>
            ))}
            {has_next_page && (
              <div className="snap-center w-full flex items-center justify-center py-8">
                <button
                  type="button"
                  onClick={() => loadNextPage()}
                  disabled={is_loading}
                  className="text-sm text-blue-500 font-medium disabled:opacity-50"
                >
                  {is_loading ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
