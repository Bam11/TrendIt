"use client"

import React, { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Image, ImageIcon, Video, Type, Smile, MapPin, Tag, Radio } from "lucide-react";
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from '@/app/lib/supabase/client';
import { ActivityRequest } from '@stream-io/feeds-client';

type PostType = "image" | "video" | "text" | "reel";

export default function Create() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const { user, client } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postType, setPostType] = useState<PostType>("image");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null)

  const mediaOptions = [
    { icon: Image, label: "Photo", color: "from-blue-500 to-cyan-500" },
    { icon: Video, label: "Video", color: "from-purple-500 to-pink-500" },
    { icon: Type, label: "Text", color: "from-orange-500 to-red-500" },
  ];

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
      { id: "image", label: "Image", icon: ImageIcon, border: "border-cyan-400", iconColor: "text-cyan-500" },
      { id: "video", label: "Video", icon: Video, border: "border-purple-500", iconColor: "text-purple-500" },
      { id: "text", label: "Text", icon: Type, border: "border-orange-400", iconColor: "text-orange-400" },
      { id: "reel", label: "Reel", icon: Video, border: "border-pink-500", iconColor: "text-pink-500" },
    ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
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
    if (!user || !client) return;
    setSharing(true);
    setError(null);

    try {
      let mediaUrl: string | null = null;

      if (mediaFile) {
        const ext = mediaFile.name.split(".").pop();
        const name = `${Date.now()}.${ext}`;
        const path = `trendit_posts/${user.id}/${sanitizeFilename(name)}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("trendit_posts")
          .upload(path, mediaFile);

        if (uploadError) {
          setSharing(false)
          alert("media not found")
          throw uploadError.message;
        }

        const { data: { publicUrl } } = supabase.storage.from("trendit_posts").getPublicUrl(uploadData.path);
        mediaUrl = publicUrl;

        if (!mediaUrl) {
          setSharing(false);
          return alert("Failed to upload media");
        }
      }

      const createPostPayload: Omit<ActivityRequest, "feeds"> = {
        type: "post",
        text: caption,
        attachments: [{
          type: postType,
          ...(mediaUrl && {image_url: mediaUrl}),
          // ...(postType === "image" && mediaUrl && { image_url: mediaUrl }),
          // ...(postType === "video" && mediaUrl && { asset_url: mediaUrl }),
          custom: { caption }
        }],
        create_notification_activity: true,
        copy_custom_to_notification: true,
        ...(location && { location }),
        mentioned_user_ids: [],
        restrict_replies: undefined,
      }

      const feed = client.feed("user", user.id);

      const response = await feed.addActivity(createPostPayload)
      // const { error: insertError } = await supabase.from("trendit_posts").insert({
      //   user_id: user.id,
      //   type: postType,
      //   caption,
      //   media_Url: mediaUrl,
      // });

      // if (insertError) throw insertError;
      if (!response || !response.activity) throw new Error("Failed to create post.")
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share post.")
    } finally {
      setSharing(false)
    }
  }

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
        {mediaOptions.map((media, index) => {
          const Icon = media.icon;
          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedMedia(media.label)}
              className={`relative aspect-square rounded-2xl bg-linear-to-br ${media.color} p-1 overflow-hidden group`}
            >
              <div className="size-full bg-white rounded-xl flex flex-col items-center justify-center gap-2 group-hover:bg-opacity-90 transition-all cursor-pointer">
                <Icon className="size-8 text-gray-700" />
                <span className="text-sm font-medium text-gray-700">{media.label}</span>
              </div>
              {selectedMedia === media.label && (
                <motion.div
                  layoutId="selected"
                  className="absolute inset-0 border-4 border-white rounded-2xl"
                />
              )}
            </motion.button>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
        <div className="space-y-3">
          <div className="size-16 bg-linear-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
            <Image size={32} className="text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Upload {selectedMedia || "media"}</p>
            <p className="text-sm text-gray-500 mt-1">Drag and drop or click to browse</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <textarea
          placeholder="Write a caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
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
                  <Icon size={20} className="text-gray-600" />
                </button>
              )
            })}
          </div>
          <span className="text-sm text-gray-400">{caption.length}/500</span>
        </div>
      </div>

      <motion.button
        type="submit"
        onClick={handleShare}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
      >
        Share Post
      </motion.button>
    </div>
  )
}
