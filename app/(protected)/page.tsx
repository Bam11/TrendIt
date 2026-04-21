"use client"

import React, { useCallback, useEffect, useState } from "react";
import { Feed } from "@stream-io/feeds-client";
import { useAggregatedActivities, useFeedActivities } from "@stream-io/feeds-client/react-bindings";
import { useAuth } from "../context/AuthContext";
import Story from "../components/story";
import PostCard from "../components/post-card";

type StoryGroup = {
  id?: string;
  activities?: Array<{ id: string; user?: StreamActor }>;
  is_watched?: boolean;
};

type StreamActor = string | {
  id: string;
  name?: string;
  image?: string;
  custom?: Record<string, string>;
};

export default function Home() {
  const { user, client } = useAuth();

  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState<Feed | undefined>(undefined);
  const [storiesFeed, setStoriesFeed] = useState<Feed | undefined>(undefined);
  const [myStoryFeed, setMyStoryFeed] = useState<Feed | undefined>(undefined);
  const { activities, loadNextPage, has_next_page, is_loading } = useFeedActivities(feed);

  const { aggregated_activities: aggregatedStoryGroups = [] } = useAggregatedActivities(storiesFeed) ?? {};
  const { activities: myStoryActivities = [] } = useFeedActivities(myStoryFeed) ?? {};

  const limit = 4;
  const hasNoPost = !loading && (!activities || activities === undefined || activities.length === 0 || activities.length === undefined);

  const fetchFeeds = useCallback(async () => {
    if (!client || !user) return;
    setLoading(true);
    try {
      const feed = client.feed("user", user.id);

      const response = await feed.getOrCreate({
        watch: true,
        limit,
        filter: { activity_type: "post" }
      });
      const activities = response.activities ?? [];
      if (activities.length > 0) {
        setFeed(feed);
        // setActivities(activities);
      } else {
        throw new Error("No activities found");
      }
    } catch {
      try {
        const feed = client.feed("user", user.id);
        const response = await feed.getOrCreate({
          watch: true,
          limit,
          filter: { activity_type: "post" }
        });
        response.activities ?? [];
        // setActivities(activities);
        setFeed(feed);
      } catch {
        // setActivities([])
        setFeed(undefined);
      }
    } finally {
      setLoading(false);
    }
  }, [client, user]);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  useEffect(() => {
    if (!client || !user) return;
    const sf = client.feed("stories", user.id);
    sf.getOrCreate({ watch: true }).then(() => setStoriesFeed(sf)).catch(() => { });
    const mf = client.feed("story", user.id);
    mf.getOrCreate({ watch: true }).then(() => setMyStoryFeed(mf)).catch(() => { });
  }, [client, user?.id, user]);

  console.log({ loading, activitieCount: activities?.length, activities })
  const userImage = user?.user_metadata.avatar_url || user?.user_metadata.picture || null;
  return (
    <div className="p-4 space-y-6">
      {/* <Story
        userAvatar={userImage}
        currentUserId={user?.id}
        myStoryCount={myStoryActivities.length}
        aggregatedGroups={aggregatedStoryGroups as StoryGroup[]}
      /> */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="size-6 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : hasNoPost ? (
          <div className="flex flex-col items-center justify-center gap-1 text-gray-600">
            <p>No Post yet</p>
            <p>Follow people to see their posts here! or create your first post!</p>
          </div>
        ) : (
          <>
            {activities?.map((activity) => (
              <PostCard
                feed={feed}
                key={activity.id}
                activity={activity}
              />
            ))}
            {is_loading && (
              <div className="flex items-center justify-center py-4">
                <div className="size-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
              </div>
            )}
            {(activities?.length ?? 0) > 0 && has_next_page && (
              <button
                type="button"
                onClick={() => loadNextPage()}
                disabled={is_loading}
                className="w-full text-sm text-blue-500 font-medium py-2 disabled:opacity-50"
              >
                {is_loading ? "Loading" : "Load more posts"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
} 