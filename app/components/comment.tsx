"use client"

import React, { useEffect, useState } from 'react';
import Image from "next/image";
import { ActivityResponse, Feed, CommentResponse } from '@stream-io/feeds-client';
import { useActivityComments } from '@stream-io/feeds-client/react-bindings';
import { useAuth } from '../context/AuthContext';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import moment from 'moment';
import { Check, Heart, Pencil, Send, Trash2, X } from "lucide-react";

type StreamActor = string | {
  id: string,
  name?: string,
  image?: string,
  custom?: Record<string, string>,
}

function getActorInfo(actor: StreamActor, currentUser?: any) {
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

type CommentLike = { user?: { id?: string } };

type CommentRowData = {
  id: string;
  user: StreamActor;
  text: string;
  created_at?: string | Date;
  reaction_count?: number;
  own_reactions?: CommentLike[];
  reply_count?: number;
};

function CommentRow({
  comment,
  onLike,
  onReply,
  replyingToId,
  hasLiked,
  likeCount,
  showReplyBtn = true,
  isOwnComment = false,
  isEditing = false,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  comment: CommentRowData,
  onLike: () => void,
  onReply: () => void,
  replyingToId: string | null,
  hasLiked: boolean,
  likeCount: number,
  showReplyBtn?: boolean,
  isOwnComment?: boolean,
  isEditing?: boolean,
  onStartEdit?: () => void,
  onSaveEdit?: (newText: string) => void,
  onCancelEdit?: () => void,
  onDelete?: () => void,
}) {
  const { user } = useAuth();
  const actor = getActorInfo(comment.user, user);
  // const createdAt =
  //   comment.created_at instanceof Date
  //     ? comment.created_at.toISOString()
  //     : comment.created_at ?? "";
  const [editText, setEditText] = useState(comment.text ?? "")


  useEffect(() => {
    if (isEditing) setEditText(comment.text ?? "");
  }, [isEditing, comment.text]);

  return (
    <div className="flex gap-3">
      <div className="size-8 rounded-full overflow-hidden bg-gray-200 shrink-0">
        {actor.avatar && (
          <Image
            src={actor.avatar}
            alt={actor.username}
            width={32}
            height={32}
            unoptimized
            className="size-full object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="space-y-1.5">
            <input
              value={editText}
              autoFocus
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && editText.trim()) {
                  onSaveEdit?.(editText.trim());
                } else if (e.key === "Escape") {
                  onCancelEdit?.()
                }
              }}
              className="w-full text-[12px] bg-gray-50 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-200"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => editText.trim() && onSaveEdit?.(editText.trim())}
                disabled={!editText.trim()}
                className="flex items-center gap-1 text-[12px] text-blue-600 font-medium disabled:opacity-40"
              >
                <Check size={12} strokeWidth={2.5} />
                Save
              </button>
              <button
                type="button"
                onClick={onCancelEdit} 
                className="flex items-center gap-1 text-[12px] text-gray-500 font-medium cursor-pointer">
                <X size={12} strokeWidth={2.5} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[12px] text-gray-800 leading-snug">
              <span className="font-semibold mr-1">{actor.username}</span>
              {comment.text}
            </p>
            <div className="flex items-center gap-3 mt-0.5 group">
              <span className="text-[12px] text-gray-400">
                {moment(comment.created_at).fromNow()}
              </span>
              <button
                type="button"
                onClick={onLike}
                className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-red-500 transition"
              >
                <Heart
                  className={hasLiked
                    ? "size-3.5 fill-red-500 text-red-500"
                    : "size-3.5 text-gray-500 transition-colors"
                  }
                  strokeWidth={hasLiked ? 0 : 1.8}
                />
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>
              {showReplyBtn && (
                <button
                  type="button"
                  onClick={onReply}
                  className="text-[12px] text-gray-500 hover:text-blue-500 font-medium"
                >
                  Reply
                </button>
              )}
              {isOwnComment && (
                <div className="flex items-center gap-2 opacity-0 select-none group-hover:select-auto group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={onStartEdit}
                    className="flex items-center gap-0.5 text-[12px] text-gray-500 hover:text-blue-500 font-medium"
                  >
                    <Pencil size={12} strokeWidth={1.8} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="flex items-center gap-0.5 text-[12px] text-gray-500 font-medium"
                  >
                    <Trash2 size={12} strokeWidth={1.8} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function CommentReplies({
  feed,
  activity,
  parentComment,
  currentUserId,
  replyingToId,
  onReplyClick,
  toggleCommentReaction,
  editingCommentId,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  feed: Feed | undefined;
  activity: ActivityResponse;
  parentComment: CommentResponse;
  currentUserId: string | undefined;
  replyingToId: string | null;
  onReplyClick: (commentId: string, username: string) => void;
  toggleCommentReaction: (commentId: string, type: "like" | "dislike") => void;
  editingCommentId: string | null;
  onStartEdit: (commentId: string) => void;
  onSaveEdit: (commentId: string, newText: string) => void;
  onCancelEdit: () => void;
  onDelete: (commentId: string) => void;
}) {
  const { comments: replies, has_next_page, is_loading_next_page, loadNextPage } = useActivityComments({
    feed,
    parentComment,
    activity,
  });

  useEffect(() => {
    loadNextPage();
  }, [loadNextPage])

  const commentLst = replies ?? [];
  if (commentLst.length === 0 && !is_loading_next_page) return null;


  return (
    <div className="ml-8 mt-2 pl-3 border-l-2 border-gray-100 space-y-3">
      {commentLst.length === 0 && is_loading_next_page && (
        <div className="flex items-center justify-center py-2">
          <div className="size-4 border-2 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
        </div>
      )}
      {commentLst.map((reply) => {
        const reactionComment = reply as unknown as CommentRowData;
        const hasLiked = !!reactionComment.own_reactions?.some((reaction) => (reaction as { user?: { id?: string } }).user?.id === currentUserId);
        const likeCount = reactionComment.reaction_count ?? 0;
        const actor = getActorInfo(reply.user);
        const isOwn = typeof reply.user !== "string" && reply.user?.id === currentUserId;

        return (
          <CommentRow
            key={reply.id}
            comment={reactionComment}
            hasLiked={hasLiked}
            likeCount={likeCount}
            replyingToId={replyingToId}
            onLike={() => {
              toggleCommentReaction(reply.id, hasLiked ? "dislike" : "like")
            }}
            onReply={() => onReplyClick(reply.id, actor.username)}
            showReplyBtn={true}
            isOwnComment={isOwn}
            isEditing={editingCommentId === reply.id}
            onStartEdit={() => onStartEdit(reply.id)}
            onSaveEdit={(newText) => onSaveEdit(reply.id, newText)}
            onCancelEdit={onCancelEdit}
            onDelete={() => onDelete(reply.id)}
          />
        );
      })}
      {has_next_page && (
        <button
          type="button"
          onClick={() => loadNextPage()}
          disabled={is_loading_next_page}
          className="text-xs text-blue-500 font-medium disabled:opacity-50"
        >
          {is_loading_next_page ? "Loading" : "Load more replies"}
        </button>
      )}
    </div>
  )
}

export default function Comment({
  activity, feed, open, onClose
}: {
  activity: ActivityResponse; feed: Feed | undefined; open: boolean; onClose: () => void;
}) {
  const { user, client } = useAuth();

  const commentCount = activity.comment_count ?? 0;
  const [commentDraft, setCommentDraft] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingToComment, setReplyingToComment] = useState<{ id: string; username: string; } | null>(null);
  const [expandedReplyIds, setExpandedReplyIds] = useState<Set<string>>(new Set());
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  const {
    comments,
    has_next_page,
    is_loading_next_page,
    loadNextPage,
  } = useActivityComments({ feed, activity });


  useEffect(() => {
    if (!client) return;
    loadNextPage()
  }, [client, loadNextPage]);

  async function toggleCommentReaction(
    comment_id: string,
    reaction_type: "like" | "dislike"
  ) {
    if (!client || !comment_id) return;
    if (reaction_type === "like") {
      await client.addCommentReaction({ id: comment_id, type: "like" });
    } else {
      await client.deleteCommentReaction({ id: comment_id, type: "like" });
    }
  }

  async function addComment( activity_id: string, comment: string, parent_id?: string ) {
    if (!client || !activity_id || !comment) return;
    await client.addComment(
      parent_id
        ? { comment, parent_id }
        : { comment, object_id: activity_id, object_type: "activity" }
    );
  }

  async function handleEditComment(commentId: string, newText: string) {
    if (!client || !commentId || !newText) return;
    await client.updateComment({ id: commentId, comment: newText });
    setEditingCommentId(null);
  }

  async function handleDeleteComment(commentId: string) {
    if (!client || !commentId) return;
    if (!window.confirm("Delete this comment?")) return;
    await client.deleteComment({ id: commentId });
  }

  return (
    <div>
      <Drawer
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            onClose();
            setReplyingToComment(null);
            setEditingCommentId(null);
          }
        }}
      >
        <DrawerContent className="flex flex-col max-h-[75vh]">
          <DrawerHeader className="border-b border-gray-100 pb-3">
            <DrawerTitle className="text-base font-semibold text-gray-900">
              Comments{commentCount > 0 && (
                <span className="text-sm font-medium text-gray-400 ml-2">{commentCount}</span>
              )}
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {(comments ?? []).length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">
                No comment yet. Be first to comment here!
              </p>
            ) : (
              (comments ?? []).map((comment) => {
                const hasLiked = !!comment.own_reactions?.some((reaction) => reaction.user.id === user?.id);
                const likeCount = comment.reaction_count ?? 0;
                const replyCount = comment.reply_count ?? 0;
                const isExpanded = expandedReplyIds.has(comment.id);
                const actor = getActorInfo(comment.user);
                const isOwn = typeof comment.user !== "string" && comment.user?.id === user?.id;
                return (
                  <div
                    key={comment.id}
                    className="space-y-1"
                  >
                    <CommentRow
                      comment={comment as CommentRowData}
                      hasLiked={hasLiked}
                      likeCount={likeCount}
                      replyingToId={replyingToComment?.id ?? null}
                      onLike={() =>
                        toggleCommentReaction(
                          comment.id,
                          hasLiked ? "dislike" : "like"
                        )
                      }
                      onReply={() =>
                        setReplyingToComment({
                          id: comment.id,
                          username: actor.username
                        })
                      }
                      showReplyBtn={true}
                      isOwnComment={isOwn}
                      isEditing={editingCommentId === comment.id}
                      onStartEdit={() => setEditingCommentId(comment.id)}
                      onSaveEdit={(newText) => handleEditComment(comment.id, newText)}
                      onCancelEdit={() => setEditingCommentId(null)}
                      onDelete={() => handleDeleteComment(comment.id)}
                    />
                    {replyCount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedReplyIds((prev) => {
                            const next = new Set(prev)
                            if (next.has(comment.id)) next.delete(comment.id);
                            else next.add(comment.id)
                            return next;
                          })
                        }
                        className="text-xs text-gray-500 hover:text-blue-600 font-medium ml-11"
                      >
                        {isExpanded
                          ? "Hide replies"
                          : `View ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`
                        }
                      </button>
                    )}
                    {isExpanded && (
                      <CommentReplies
                        feed={feed}
                        activity={activity}
                        parentComment={comment}
                        currentUserId={user?.id}
                        replyingToId={replyingToComment?.id ?? null}
                        onReplyClick={(id, username) =>
                          setReplyingToComment({ id, username })
                        }
                        toggleCommentReaction={toggleCommentReaction}
                        editingCommentId={editingCommentId}
                        onStartEdit={(id) => setEditingCommentId(id)}
                        onSaveEdit={(id, newText) => handleEditComment(id, newText)}
                        onCancelEdit={() => setEditingCommentId(null)}
                        onDelete={(id) => handleDeleteComment(id)}
                      />
                    )}
                  </div>
                );
              })
            )}
            {/* Check */}
            {comments?.length && comments.length > 0 && has_next_page && (
              <button
                type="button"
                onClick={() => loadNextPage()}
                disabled={is_loading_next_page}
                className="w-full text-sm text-blue-500 font-medium py-2 disabled:opacity-50"
              >
                {is_loading_next_page ? "Loading" : "Load more comments"}
              </button>
            )}
          </div>

          {/* Compose comment */}
          <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-1">
            {replyingToComment && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  Reply to @{replyingToComment.username}
                </span>
                <button
                  type="button"
                  onClick={() => setReplyingToComment(null)}
                  className="text-xs text-blue-500 font-medium"
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <input
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                onKeyDown={async (e) => {
                  if (
                    e.key === "Enter" &&
                    commentDraft.trim() &&
                    !isSubmittingComment
                  ) {
                    setIsSubmittingComment(true);
                    await addComment(
                      activity.id,
                      commentDraft.trim(),
                      replyingToComment?.id
                    );
                    setCommentDraft("");
                    setReplyingToComment(null);
                    setIsSubmittingComment(false);
                  }
                }}
                placeholder={
                  replyingToComment 
                    ? `Reply to @${replyingToComment.username}`
                    : "Add a comment..."
                }
                className="flex-1 text-sm bg-gray-50 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200 placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={!commentDraft.trim() || isSubmittingComment}
                onClick={async () => {
                  setIsSubmittingComment(true);
                  await addComment(
                    activity.id,
                    commentDraft.trim(),
                    replyingToComment?.id
                  );
                  setCommentDraft("")
                  setReplyingToComment(null);
                  setIsSubmittingComment(false);
                }}
                className="shrink-0 size-9 rounded-full bg-linear-to-r from-blue-600 to-purple-600 flex items-center justify-center disabled:opacity-40 active:scale-90 transition-transform"
              >
                {isSubmittingComment ? (
                  <div className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                ) : (
                  <Send size={16} strokeWidth={2} className="text-white"/>
                )}
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
