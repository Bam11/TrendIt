"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image';
import { createClient } from '@/app/lib/supabase/client';
import { useAuth } from '@/app/context/AuthContext';
import { motion } from "motion/react";
import {
  X,
  Camera,
  Image as ImageIcon,
  Type,
  Sparkles,
  Palette,
  Video,
} from "lucide-react";

export default function AddStory() {
  const router = useRouter();
  const supabase = createClient();
  const { user, client } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#667eea");

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCameraLive, setIsCameraLive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const tools = [
    { icon: Camera, label: "Camera", color: "bg-blue-600" },
    { icon: ImageIcon, label: "Gallery", color: "bg-purple-600" },
    { icon: Type, label: "Text", color: "bg-pink-600" },
  ];

  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  ];

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    setCameraStream(prev => {
      if (prev) prev.getTracks().forEach(track => track.stop());
      return null;
    });
    setIsCameraLive(false);
    setIsRecording(false);
    setRecordingTime(0);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const startCamera = async (toolType: string) => {
    try {
      const isVideoTool = toolType === "Video";
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: isVideoTool
      });
      setCameraStream(stream);
      setIsCameraLive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        alert("Camera timed out. Please close other apps using your camera and try again.")
      } else if (error.name === "NotAllowedError") {
        alert("Camera access denied. Please allow camera/microphone permissions.")
      } else {
        console.error("Error accessing camera:", error);
        setError("Failed to access camera. Please allow camera/microphone permissions.");
      }
    }
  };

  const handleToolClick = (tool: string) => {
    setSelectedTool(tool);
    setError(null);
    clearMedia();
    stopCamera();

    if (tool === "Text") {
      return;
    }

    if (tool === "Camera" || tool === "Video") {
      startCamera(tool);
    } else if (tool === "Gallery" || tool === "Photo") {
      if (fileInputRef.current) {
        fileInputRef.current.accept = "image/*,video/*";
        fileInputRef.current.click();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const toggleRecording = () => {
    if (!cameraStream) return;
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    } else {
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(cameraStream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `video_${Date.now()}.webm`, { type: 'video/webm' });
        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));
        stopCamera();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  function sanitizeFilename(filename: string) {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  const handlePost = async () => {
    if (!user || !client) {
      setError("User not authenticated");
      return;
    }

    if (!isCameraLive && selectedTool !== "Text" && !mediaFile) {
      setError("Please select a media file or add a text story.");
      return;
    }

    setIsSharing(true);
    setError(null);

    try {
      let mediaUrl: string | null = null;
      let mediaType = "image";

      if (mediaFile && selectedTool !== "Text") {
        mediaType = mediaFile.type.startsWith("video/") || mediaFile.name.endsWith('.webm') ? "video" : "image";
        const ext = mediaFile.name.split(".").pop();
        const name = `${Date.now()}.${ext}`;
        const path = `${user.id}/${sanitizeFilename(name)}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("trendit_posts")
          .upload(path, mediaFile);

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: { publicUrl } } = supabase.storage.from("trendit_posts").getPublicUrl(uploadData.path);
        mediaUrl = publicUrl;
      }

      const createStoryPayload = selectedTool === "Text" ? {
        type: "story",
        text: text,
        custom: { backgroundColor, content_type: "story" },
        create_notification_activity: true,
      } : {
        type: "story",
        attachments: [{
          type: mediaType,
          ...(mediaType === "image" && mediaUrl ? { image_url: mediaUrl } : {}),
          ...(mediaType === "video" && mediaUrl ? { asset_url: mediaUrl } : {}),
          custom: { content_type: "story" }
        }],
        create_notification_activity: true,
      };

      const feed = client.feed("story", user.id);
      const response = await feed.addActivity(createStoryPayload);

      if (!response || !response.activity) throw new Error("Failed to create story.");

      alert("Story created successfully");
      router.push("/");
    } catch (err) {
      console.error("STORY POST ERROR:", err);
      setError(err instanceof Error ? err.message : "Failed to share story.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="h-screen bg-black flex flex-col relative">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Live Camera */}
      {isCameraLive && (
        <div className="absolute inset-0 z-40 bg-black flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-linear-to-b from-black/60 to-transparent">
            <button
              onClick={() => { stopCamera(); setSelectedTool(null); }}
              className="p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full transition-colors"
            >
              <X className="size-6 text-white" />
            </button>
          </div>

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={selectedTool !== "Video"}
            className="size-full object-cover"
          />

          <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center justify-center pb-8 pt-10 bg-linear-to-t from-black/80 to-transparent">
            {selectedTool === "Video" && isRecording && (
              <div className="absolute -top-6 bg-red-600 px-3 py-1 rounded-full text-white font-mono text-sm tracking-widest animate-pulse">
                {formatTime(recordingTime)}
              </div>
            )}
            <button
              onClick={selectedTool === "Video" ? toggleRecording : takePhoto}
              className={`size-20 rounded-full border-[6px] transition-all flex items-center justify-center ${selectedTool === "Video" && isRecording ? "border-red-500 scale-110" : "border-white hover:scale-105"} bg-transparent cursor-pointer`}
            >
              <div className={`transition-all rounded-full ${selectedTool === "Video" && isRecording ? "size-6 bg-red-500 rounded-sm" : "size-14 bg-white"}`} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      {!isCameraLive && (
        <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-linear-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSharing}
              className="p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="size-6 text-white" />
            </button>
            <h1 className="text-white font-semibold">Create Story</h1>
            <button
              type="button"
              onClick={handlePost}
              disabled={isSharing || (selectedTool !== "Text" && !mediaFile)}
              className="px-4 py-2 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-sm hover:shadow-lg transition-shadow disabled:opacity-50 cursor-pointer"
            >
              {isSharing ? "Sharing..." : "Share"}
            </button>
          </div>
        </div>
      )}

      {/* Body */}
      {!isCameraLive && (
        <div
          className="flex-1 relative flex items-center justify-center overflow-hidden"
          style={{ background: selectedTool === "Text" ? backgroundColor : "#000" }}
        >
          {/* Preview */}
          <div className="text-center w-full h-full flex items-center justify-center">
            {error && (
              <div className="absolute top-20 left-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-xl text-sm z-50">
                {error}
              </div>
            )}

            {selectedTool === "Text" && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full px-8"
              >
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your story..."
                  className="bg-transparent text-white text-4xl font-bold text-center focus:outline-none resize-none w-full"
                  rows={3}
                  autoFocus
                />
              </motion.div>
            )}

            {!selectedTool && !mediaPreview && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <Sparkles className="size-20 text-white/80 mx-auto mb-4" />
                <p className="text-white/80 text-lg">
                  Select a tool to start creating your story
                </p>
              </motion.div>
            )}

            {mediaPreview && selectedTool !== "Text" && (
              <div className="w-full h-full relative">
                {mediaFile?.type.startsWith("image/") ? (
                  <Image
                    src={mediaPreview}
                    alt="Story preview"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <video
                    src={mediaPreview}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tools Panel */}
      {!isCameraLive && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 space-y-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <motion.button
                key={tool.label}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleToolClick(tool.label)}
                className={`size-12 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer ${selectedTool === tool.label
                  ? tool.color + " scale-110"
                  : "bg-white/20 backdrop-blur-sm hover:bg-white/30"
                  }`}
              >
                <Icon className="size-6 text-white" />
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Bottom Tools */}
      {!isCameraLive && (
        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent pb-8 pt-6 px-4 z-50">
          {selectedTool === "Text" && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="size-5 text-white" />
                <span className="text-white text-sm font-medium">Background</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {gradients.map((gradient, index) => (
                  <button
                    key={index}
                    onClick={() => setBackgroundColor(gradient)}
                    className="shrink-0 size-10 rounded-full border-2 border-white/50 hover:border-white transition-all cursor-pointer"
                    style={{ background: gradient }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleToolClick("Video")}
              className="flex items-center justify-center gap-2 py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl transition-all cursor-pointer"
            >
              <Video className="size-5 text-white" />
              <span className="text-white text-sm font-medium">Video</span>
            </button>
            <button
              type="button"
              onClick={() => handleToolClick("Text")}
              className="flex items-center justify-center gap-2 py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl transition-all cursor-pointer"
            >
              <Type className="size-5 text-white" />
              <span className="text-white text-sm font-medium">Text</span>
            </button>
            <button
              type="button"
              onClick={() => handleToolClick("Photo")}
              className="flex items-center justify-center gap-2 py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl transition-all cursor-pointer"
            >
              <ImageIcon className="size-5 text-white" />
              <span className="text-white text-sm font-medium">Photo</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Tips */}
      {!isCameraLive && !mediaPreview && !selectedTool && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute top-24 left-0 right-0 text-center px-4 pointer-events-none"
        >
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
            <Sparkles className="size-4 text-white" />
            <span className="text-white text-sm">
              Tap any tool to easily create a new story
            </span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
