export type UserMetadata = {
  email: string;
  email_verified: boolean;
  phone_verified: boolean;
  sub: string;
  username: string;
  fullName: string;
  image: string;
  updated_at: Date;
};

export type User = {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  username: string;
  fullName: string;
  image: string;
  auth_user_id: string;
};

export type post = {
  id: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  caption: string;
  media: string;
  media_type: "image" | "video";
  // advanced_settings: {
  //   hideLikes: boolean;
  //   turnOffComments: boolean;
  //   shareToFacebook: boolean;
  // };
  
  author: {
    id: number;
    email: string;
    image: string;
    fullName: string;
    username: string;
    created_at: string;
    updated_at: string;
    auth_user_id: string;
  };
};

export type UserProfile = {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  website: string;
  phone: string;
  gender: string;
  image: string;
  created_at: string;
  updated_at: string;
};