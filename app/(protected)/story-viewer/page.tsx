import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Heart, MoreVertical, Pause, Play, Send, X } from 'lucide-react'

type StoryItem = {
  id: number,
  image: string,
  time: string,
}

type StoryViewerProps = {
  isOpen: boolean,
  onClose: () => void,
  user: {
    name: string,
    image: string,
    username?: string,
    time: string
  }
  stories: StoryItem[],
  initialIndex?: number
}

export default function StoryViewer({ isOpen, onClose, user, stories, initialIndex = 0 }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  const STORY_DURATION = 5000;

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0)
    }
  }

  useEffect(() => {
    if (!isOpen || isPaused) return;

    // setProgress(0);
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / STORY_DURATION) * 100;

      if (newProgress >= 100) {
        handleNext();
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => {
      clearInterval(interval);
      setProgress(0);
    };
  }, [currentIndex, isOpen, isPaused]);


  if (!isOpen) return null;

  const currentStory = stories[currentIndex];

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
        className="fixed inset-0 z-[100] bg-black"
      >
        <div className="relative size-full max-w-93.75 mx-auto">
          <Image
            src={currentStory.image}
            alt="Story"
            fill
            className="size-full object-contain"
          />

          <div className="absolute inset-0 bg-linear-to-b from-black/50 via-transparent to-black/50" />

          <div className="absolute top-0 left-0 right-0 p-2 flex gap-1">
            {stories.map((_, index) => (
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
                  className="h-full bg-white rounded-full"
                />
              </div>
            ))}
          </div>

          <div className="absolute top-5 left-0 right-0 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src={user.image}
                alt={user.name}
                width={40}
                height={40}
                className="rounded-full border-2 border-white object-cover"
              />
              <div>
                <p className="text-white font-semibold text-sm">{user.name}</p>
                <p className="text-white font-semibold text-sm">{currentStory.time}</p>
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
                onClick={onClose}
              >
                <X className="size-5 text-white cursor-pointer" />
              </button>
            </div>
          </div>

          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="absolute left-0 bottom-0 top-0 w-[1px] flex items-center justify-start pl-4 opacity-0 hover:opacity-100 transition-opacity"
          >
            {currentIndex > 0 && (
              <div className="p-2 bg-black/30 rounded-full">
                <ChevronLeft className="size-6 text-white" />
              </div>
            )}
          </button>

          <button
            onClick={handleNext}
            className="absolute right-0 bottom-0 top-0 w-[1px] flex items-center justify-end pr-4 opacity-0 hover:opacity-100 transition-opacity"
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