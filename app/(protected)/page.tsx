"use client"

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "motion/react";
import { cn } from "../lib/utils"
import { Bookmark, ChevronRight, Heart, MessageCircle, Share2 } from "lucide-react";
import StoryViewer from "./story-viewer/page";

type StoryItem = {
  id: number,
  image: string,
  time: string,
}

type StoryUser = {
  id: number,
  user: {
    image: string,
    name: string,
    time: string,
  },
  stories: StoryItem[],
}

type Post = {
  id: number,
  author: {
    name: string,
    image: string,
  }
  content: {
    type: "text" | "image" | "video",
    text?: string,
    image?: string,
    video?: string,
  },
  caption: string, 
  likes: number,
  comments: number,
  time: string,
  tags: string[],
}

export default function Home() {
  const router = useRouter();

  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [selectedStoryUser, setSelectedStoryUser] = useState<StoryUser | null>(null);
  const userStoriesRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setshowLeftArrow] = useState(false);
  const [showRightArrow, setshowRightArrow] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  // const { user } = useAuth();

  const storyUser = [
    {
      id: 1,
      user: {image: "/images/user-1.webp", name: "Alex Da Great", time: "2h ago"},
      stories: [
        {id: 1, image:"/images/post.webp", time:"2h ago"},
        {id: 2, image:"/images/post.webp", time:"3h ago"},
        {id: 3, image:"/images/post.webp", time:"10m ago"},
        
      ]
    },
    {
      id: 2,
      user: {image: "/images/user-2.webp", name: "OG Titilayo", time: "4h ago"},
      stories: [
        {id: 1, image:"/images/post.webp", time:"2h ago"},
        {id: 2, image:"/images/post.webp", time:"3h ago"},
        {id: 3, image:"/images/post.webp", time:"10m ago"},
        
      ]
    },
    {
      id: 3,
      user: {image: "/images/user-1.webp", name: "OG Victoria", time: "6h ago"},
      stories: [
        {id: 1, image:"/images/post.webp", time:"2h ago"},
        {id: 2, image:"/images/post.webp", time:"3h ago"},
        {id: 3, image:"/images/post.webp", time:"10m ago"},
        
      ]
    },
    {
      id: 4,
      user: {image: "/images/user-2.webp", name: "OG Titilayo", time: "7h ago"},
      stories: [
        {id: 1, image:"/images/post.webp", time:"2h ago"},
        {id: 2, image:"/images/post.webp", time:"3h ago"},
        {id: 3, image:"/images/post.webp", time:"10m ago"},
        
      ]
    },
    {
      id: 5,
      user: {image: "/images/user-1.webp", name: "OG Victoria", time: "8h ago"},
      stories: [
        {id: 1, image:"/images/post.webp", time:"2h ago"},
        {id: 2, image:"/images/post.webp", time:"3h ago"},
        {id: 3, image:"/images/post.webp", time:"10m ago"},
        
      ]
    },
  ]

  const posts = [
    {
      id: 1,
      author: {
        name: "Alex Da Great",
        image: "/images/user-1.webp",
      },
      content: {
        type: "image",
        image: "/images/post.webp",
        video: "",
        text: "",
      },
      caption: "Perfect days for some skating today",
      likes: 120,
      comments: 250,
      time: "22h ago",
      tags: ["#skateboarding", "#fun", "#weekend"],
    }
  ]

  const openStoryViewer = (story: StoryUser) => {
    setSelectedStoryUser(story);
    setStoryViewerOpen(true);
  }

  const handleScrollLeft = () => {
    const userStories = userStoriesRef.current;
    if (userStories && userStories.scrollLeft) userStories.scrollLeft -= 356;
  };

  const handleScrollRight = () => {
    const userStories = document.getElementById("user-stories");
    if (userStories) userStories.scrollLeft += 356;
  };

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

  return (
    <div className="p-4 space-y-6">
      <div className="relative group">
        <div
          ref={userStoriesRef}
          id="user-stories" 
          className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
        >
          <button
            onClick={() => router.push("/add-story")}
            className="flex flex-col items-center gap-2"
          >
              <div className="size-16 rounded-full bg-linear-to-r from-blue-600 to-purple-600 p-0.5">
                <div className="size-full rounded-full bg-white flex items-center justify-center">
                  <div className="text-2xl text-gray-600">+</div>
                </div>
              </div>
            <span className="text-xs text-gray-600">Your Story</span>
          </button>

          {storyUser.map((story) => (
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
          ))}
        </div>
        <div onClick={handleScrollLeft}
            className={cn("absolute left-0 top-[20%] rotate-180 cursor-pointer select-none transition-all duration-300 ", showLeftArrow
              ? "group-hover: opacity-100"
              : "opacity-0 pointer-events-none"
            )}
          >
            <ChevronRight  size={28} className="text-gray-600" />
          </div>
          <div onClick={handleScrollRight}
            className={cn("absolute right-0 top-[20%] cursor-pointer select-none transition-all duration-300", showRightArrow
              ? "group-hover: opacity-100"
              : "opacity-0 pointer-events-none"
            )}
          >
            <ChevronRight size={28} className="text-gray-600" />
          </div>
      </div>

      <div className="space-y-6">
        {posts.map((post, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            key={index} 
            className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100"
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Image
                  src={post.author.image}
                  alt={post.author.name}
                  width={40}
                  height={40}
                  loading="lazy"
                  className="rounded-full object-cover size-10" 
                />
                <div>
                  <p className="font-semibold text-sm text-[#0a0a0a]">{post.author.name}</p>
                  <p className="text-gray-500 text-xs">{post.time}</p>
                </div>
              </div>
            </div>

            <div className="aspect-square">
              {post.content.type === "image" && post.content.image && (
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
              )}
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    className="flex items-center gap-2 transition-transform active:scale-90 outline-none"
                    onClick={() => setIsLiked(!isLiked)}
                  >
                    <Heart 
                      className={`size-6 transition-colors 
                        ${isLiked ? "fill-red-500 text-red-500" : "text-gray-700"}`} 
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {isLiked ? post.likes + 1 : post.likes}
                    </span>
                  </button>
                  <button className="flex items-center gap-2 transition-transform active:scale-90 outline-none">
                    <MessageCircle className="size-6 text-gray-700"/>
                    <span className="text-sm font-medium text-gray-900">{post.comments}</span>
                  </button>
                  <button className="transition-transform active:scale-90 outline-none">
                    <Share2 className="size-6 text-gray-700" />
                  </button>
                </div>
                <button
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className="transition-transform active:scale-90 outline-none"
                >
                  <Bookmark className={`size-6 transition-colors 
                    ${isBookmarked ? "fill-blue-600 text-blue-600" : "text-gray-700"}`}/>
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-900"> 
                  <span className="font-semibold mr-2">{post.author.name}</span>
                  {post.caption}
                </p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag,index) => (
                    <span
                      key={index}
                      className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="text-[12px] text-gray-500">View all {post.comments} comments</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedStoryUser && (
        <StoryViewer 
          isOpen = {storyViewerOpen}
          onClose = {() => setStoryViewerOpen(false)}
          user = {selectedStoryUser.user}
          stories = {selectedStoryUser.stories}
        />
      )}
    </div>
  );
}