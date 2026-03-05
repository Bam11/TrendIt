TrendIt Documentation

Feature List

- User Authentication (Sign up / Login)
- Home Feed (posts from followed users)
- Stories (24-hour disappearing content)
- Reels
- Create Post (image/video + caption)
- Like & Comment system
- Follow / Unfollow users
- Notifications
- Messaging (chat list + chat screen)
- Profile page 
- Edit Profile
- Go Live 
- Search



-User Flows

-Flow 1 – General App Usage

1. User signs up
2. User logs in
3. Lands on Home Feed
4. Scrolls posts
5. Views a story
6. Likes a post
7. Comments on a post
8. Visits another user’s profile
9. Follows the user
10. Sends a message
11. Receives notifications

-Flow 2 – Create Post

1. User clicks “Create”
2. Uploads image or video
3. Adds caption
4. Clicks Post
5. Post appears in feed
6. Followers receive notification

-Flow 3 – Reels

1. User opens Reels page
2. Scrolls through videos
3. Likes or comments on reel
4. Clicks a specific reel
5. Views reel details page

-Flow 4 – Follow System

1. User visits another profile
2. Clicks Follow
3. Follow record is created
4. Follow notification is sent
5. New posts appear in feed

-Flow 5 – Messaging

1. User opens Messages
2. Views chat list
3. Selects a conversation
4. Sends message
5. Receiver gets notification

-Flow 6 – Live Streaming

1. User opens Live page
2. Starts live session
3. Live session becomes accessible via liveId
4. Followers receive notification
5. Users join live stream
6. Users send live comments
7. Host ends live session


-Data Models

-User:
id
username
email
password
avatar
bio
followersCount
followingCount
createdAt


-Follow:
id
followerId
followingId
createdAt


-Post:
id
userId
imageUrl
caption
likesCount
commentsCount
createdAt


-Reel:
id
userId
videoUrl
caption
thumbnailUrl
likesCount
commentsCount
viewsCount
createdAt


-Comment (Post & Reel)
id
userId
targetType: "post" | "reel"
targetId
text
createdAt


-Like (Post, Reel, Comment)
id
userId
targetType  :"post" | "reel" | "comment"
targetId
createdAt

-Story:
id
userId
mediaUrl
expiresAt
createdAt

-Message:
id
senderId
receiverId
text
createdAt

-Live:
id
hostId
title
status :    "scheduled" | "live" | "ended"
isActive
startedAt
endedAt
viewerCount
streamId
createdAt


-Live Comment:
id
liveId
userId
text
createdAt


-Notification:
id
recipientId
senderId
type   "like" | "comment" | "follow" | "message" | "live_start"
referenceId  postId | reelId | commentId | liveId | messageId
isRead
createdAt




-Routes Plan:

/app

  /auth
    /login
      page.tsx
    /signup
      page.tsx
  
   /feed
    page.tsx

  /search
    page.tsx

  /reels
    page.tsx
    /[reelId]
      page.tsx

  /create
    page.tsx

  /notifications
    page.tsx

  /messages
    page.tsx
    /[chatId]
      page.tsx

  /profile
    /[username]
      page.tsx

  /edit-profile
    page.tsx

  /post
    /[postId]
      page.tsx

  /live
    page.tsx
    /[liveId]
      page.tsx

