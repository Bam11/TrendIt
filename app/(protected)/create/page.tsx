"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { ImageIcon, Video, Type, Smile, MapPin, Tag, Radio, UploadCloud, X } from "lucide-react";
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from '@/app/lib/supabase/client';
import { ActivityRequest } from '@stream-io/feeds-client';
import Image from 'next/image';

type PostType = "image" | "video" | "text" | "reel";

const REEL_VIDEO_MAX_SIZE = 100;
const REEL_VIDEO_MAX_BYTES = REEL_VIDEO_MAX_SIZE * 1024 * 1024;
const REEL_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"];

const quickActions = [
  { icon: Smile, label: "Add Sticker" },
  { icon: MapPin, label: "Add Location" },
  { icon: Tag, label: "Tag People" },
];

const postTypes: {
  id: PostType;
  label: string;
  icon: React.ElementType;
  border: string;
  iconColor: string;
}[] = [
    { id: "image", label: "Image", icon: ImageIcon, border: "from-blue-500 to-cyan-500", iconColor: "text-cyan-500" },
    { id: "video", label: "Video", icon: Video, border: "from-purple-500 to-pink-500", iconColor: "text-purple-500" },
    { id: "text", label: "Text", icon: Type, border: "from-orange-500 to-red-500", iconColor: "text-orange-400" },
    { id: "reel", label: "Reel", icon: Video, border: "from-pink-500 to-rose-500", iconColor: "text-pink-500" },
  ];

export default function Create() {
  const router = useRouter();
  const supabase = createClient();
  const { user, client } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [caption, setCaption] = useState("");
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postType, setPostType] = useState<PostType>("image");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [reelAudioTitle, setReelAudioTitle] = useState("");
  const [reelAudioArtist, setReelAudioArtist] = useState("");
  const [reelTopicTags, setReelTopicTags] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }),
      () => setLocation(null)
    )
  }, [])

  const validateReelVideos = (file: File): string | null => {
    if (!REEL_VIDEO_TYPES.includes(file.type) && !file.type.startsWith("video/")) {
      return "Unsupported video format. Please upload MP4, MOV, WEBM, or MKV files.";
    }
    if (file.size > REEL_VIDEO_MAX_BYTES) {
      return `File too large, video must be under ${REEL_VIDEO_MAX_SIZE}MB`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (postType === "reel") {
      const err = validateReelVideos(file);
      if (err) {
        setError(err);
        return;
      }
    }
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setError(null);
    if (postType === "reel") {
      const err = validateReelVideos(file);
      if (err) {
        setError(err);
        return;
      }
    }
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  }

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function sanitizeFilename(filename: string) {
    return filename
      // Replace any invalid character with "_"
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      // Collapse multiple underscores
      .replace(/_+/g, "_")
      // Trim underscores at start/end
      .replace(/^_+|_+$/g, "");
  }

  const handleShare = async () => {
    if (!user || !client) {
      setError("User not autheticated");
      return;
    };

    if (postType === "reel" && !mediaFile) {
      setError("Reels require a video file. Please upload a video to share as a reel.");
      return;
    }

    console.log("Client:", client);
    console.log("User:", user);

    setSharing(true);
    setError(null);

    try {
      let mediaUrl: string | null = null;

      if (mediaFile) {
        if (postType === "reel") {
          const err = validateReelVideos(mediaFile);
          if (err) throw new Error(err);
        }

        const ext = mediaFile.name.split(".").pop();
        const name = `${Date.now()}.${ext}`;
        const path = `${user.id}/${sanitizeFilename(name)}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("trendit_posts")
          .upload(path, mediaFile);

        if (uploadError) {
          setSharing(false)
          alert("media not found")
          throw uploadError.message;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("trendit_posts")
          .getPublicUrl(path);
        // .getPublicUrl(uploadData.path);
        mediaUrl = publicUrl;

        if (!mediaUrl) {
          setSharing(false);
          return alert("Failed to upload media");
        }

      }

      const { data: supabasePost, error: supabaseError } = await supabase
        .from("post")
        .insert([{
          author_id: user.id,
          caption,
          media: mediaUrl,
          media_type: postType,
        }])
        .select("id")
        .single();

      if (supabaseError) {
        alert("Error Inserting Posts");
        throw supabaseError;
      } else {
        alert("Post created successfully");
      }

      console.log("Supabase post:", supabasePost)

      const isReel = postType === "reel";
      // const topicTags = reelTopicTags
      //   ? reelTopicTags.split(/[\s,#]+/).filter(Boolean).slice(0, 10)
      //   : undefined;

      const createPostPayload: Omit<ActivityRequest, "feeds"> = isReel
        ? {
          type: "reel",
          text: caption,
          custom: {
            content_type: "reel",
            caption,
            ...(reelAudioTitle && { audio_title: reelAudioTitle }),
            ...(reelAudioArtist && { audio_artist: reelAudioArtist }),
            duration_bucket: "short",
          },
          attachments: [{
            type: isReel ? "video" : postType,
            ...(mediaUrl && { asset_url: mediaUrl, video_url: mediaUrl }),
            custom: isReel ? { content_type: "reel" } : {},
          }],
          create_notification_activity: true,
          copy_custom_to_notification: true,
          mentioned_user_ids: [],
          restrict_replies: undefined,
        }
        : {
          type: "post",
          text: caption,
          attachments: [{
            type: postType,
            // ...(mediaUrl && { image_url: mediaUrl }),
            ...(postType === "image" && mediaUrl && { image_url: mediaUrl }),
            ...(postType === "video" && mediaUrl && { asset_url: mediaUrl }),
            custom: { caption }
          }],
          create_notification_activity: true,
          copy_custom_to_notification: true,
          ...(location && { location }),
          mentioned_user_ids: [],
          restrict_replies: undefined,
        }

      const feed = client.feed("user", user.id);

      const response = await feed.addActivity(createPostPayload);
      console.log("GetStream activity:", response.activity);

      const { data: updatedPost, error: insertError } = await supabase
        .from("post")
        .update({
          stream_activity_id: response.activity.id,
        })
        .eq("id", supabasePost.id)
        .select("id, stream_activity_id")
        .single()
      // const { error: insertError } = await supabase.from("trendit_posts").insert({
      //   user_id: user.id,
      //   type: postType,
      //   caption,
      //   media_Url: mediaUrl,
      // });

      console.log("UPDATE RESULT:", {
        updatedPost,
        insertError,
      });

      if (insertError) throw insertError;

      if (!updatedPost) {
        throw new Error("Supabase did not return the updated post.");
      }
      console.log("Updated Supabase post:", updatedPost);
      console.log("Stream activity ID saved:", updatedPost.stream_activity_id)
      if (!response || !response.activity) throw new Error("Failed to create post.")
      router.push(isReel ? "/reels" : "/")
    } catch (err) {
      console.error("POST ERROR:", err)
      setError(err instanceof Error ? err.message : "Failed to share post.")
    } finally {
      setSharing(false)
    }
  }

  const acceptedFileTypes = postType === "video" || postType === "reel"
    ? "video/*" : "image/*";

  return (
    <div className="px-4 py-6 space-y-6 text-black">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Create New Post</h1>
        <p className="text-gray-600">Let&apos;s trend it with the world</p>
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => router.push("/live")}
        className="w-full py-4 bg-linear-to-r from-pink-600 via-red-600 to-orange-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2 cursor-pointer"
      >
        <Radio size={24} />
        Go Live
      </motion.button>

      <div className='grid grid-cols-4 gap-4'>
        {postTypes.map((media, index) => {
          const Icon = media.icon;
          const isSelected = postType === media.id;
          return (
            <motion.button
              key={media.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => {
                setPostType(media.id);
                clearMedia();
                if (media.id !== "reel") {
                  setReelAudioTitle("");
                  setReelAudioArtist("");
                  setReelTopicTags("");
                }
              }}
              className={`relative aspect-square rounded-2xl p-0.5 overflow-hidden group transition-all duration-300${isSelected
                ? `shadow-lg scale-105`
                : "shadow-sm grayscale-[0.3] opacity-80 hover:grayscale-0 hover:opacity-100"
                } bg-linear-to-br ${media.border}`}
            >
              <div
                className={`size-full rounded-[14px] flex flex-col items-center justify-center gap-2 group-hover:bg-opacity-90 transition-all duration-300 cursor-pointer ${isSelected ? "bg-white/90" : "bg-white"
                  }`}
              >
                <Icon className={`size-8 ${media.iconColor} ${isSelected ? "scale-110" : ""}`} />
                <span className="text-sm font-medium text-gray-700">
                  {media.label}
                </span>
              </div>
              {isSelected && (
                <motion.div
                  layoutId="selected-glint"
                  className="absolute inset-0 bg-white/20 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {postType === "reel" && (
        <p className="text-xs text-gray-700 mb-2">
          Reels are short videos that can be up to 60 seconds long. They are perfect for sharing fun moments, tutorials, or any content you want to trend quickly. Make sure your video is under {REEL_VIDEO_MAX_SIZE}MB and in a supported format (MP4, MOV, WEBM, MKV) for the best experience!
        </p>
      )}

      {postType !== "text" && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="relative w-full bg-white rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
          style={{ minHeight: "160px" }}
        >
          {mediaPreview ? (
            <>
              {mediaFile?.type.startsWith("image/") ? (
                <Image
                  src={mediaPreview}
                  alt="preview"
                  fill
                  className="object-cover rouded-2xl"
                  unoptimized
                />
              ) : (
                <video
                  src={mediaPreview}
                  controls
                  className="size-full object-cover rouded-2xl"
                />
              )}
              <button
                onClick={(e) => { e.stopPropagation(); clearMedia(); }}
                className="absolute top-2 right-2 size-7 rounded-full bg-black/60 flex items-center justify-center z-10"
              >
                <X size={16} className="text-white" />
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="size-16 bg-linear-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                <UploadCloud size={32} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Upload {postType || "media"}</p>
                <p className="text-sm text-gray-500 mt-1">Drag and drop or click to browse</p>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept={acceptedFileTypes}
            className="hidden"
          />
        </div>
      )}
      {/* <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
      </div> */}

      {postType === "reel" && (
        <div className="space-y-3 mb-4">
          <div className="rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden">
            <input
              type="text"
              value={reelAudioTitle}
              onChange={(e) => setReelAudioTitle(e.target.value)}
              placeholder="Music / audio title (optional)"
              className="w-full bg-transparent px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>
          <div className="rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden">
            <input
              type="text"
              value={reelAudioArtist}
              onChange={(e) => setReelAudioArtist(e.target.value)}
              placeholder="Artist name (optional)"
              className="w-full bg-transparent px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>
          <div className="rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden">
            <input
              type="text"
              value={reelTopicTags}
              onChange={(e) => setReelTopicTags(e.target.value)}
              placeholder="Tags (e.g. #dance, #vlog)"
              className="w-full bg-transparent px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <textarea
          placeholder="Write a caption"
          value={caption}
          onChange={(e) => {
            if (e.target.value.length <= 500) setCaption(e.target.value);
          }}
          className="w-full min-h-30 resize-none focus:outline-none text-gray-900 plaeholder:text-gray-400"
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex gap-2">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  title={action.label}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
                  <Icon size={20} className="text-gray-600 hover:text-gray-800" />
                </button>
              )
            })}
          </div>
          <span className="text-sm text-gray-400">{caption.length}/500</span>
        </div>
        {error && <p className="text-xs text-red-500 text-center mt-1">{error}</p>}
      </div>

      <motion.button
        type="submit"
        onClick={handleShare}
        whileTap={{ scale: 0.98 }}
        disabled={
          sharing ||
          (postType !== "text" && !mediaFile) ||
          (postType !== "reel" && !mediaFile)
        }
        className="w-full py-4 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
      >
        {sharing ? "Sharing..." : "Share Post"}
      </motion.button>
    </div>
  )
}
