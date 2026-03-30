"use client"

import React, { useState } from 'react'
import { useRouter } from "next/navigation"
import { createClient } from '@/app/lib/supabase/client';
import { useAuth } from '@/app/context/AuthContext';
import { motion } from "motion/react";
import { Eye, EyeOff, TrendingUp } from 'lucide-react'

export default function Signup() {
  const supabase = createClient();
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    email: "",
    password: "",
  });
  const [isLoading, setisLoading] = useState(false);
  const [showPassword, setshowPassword] = useState(false);
  const [errors, seterrors] = useState<Record<string, string>>({});
  const { user, setUser } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    //Clear error when user starts typing
    if (errors[name]) {
      seterrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullname.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    seterrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setisLoading(true);

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            fullName: formData.fullname,
            username: formData.username
          }
        }
      })

      if (signupError) {
        console.error(signupError.message);
        seterrors({ email: signupError.message });
        return;
      }

      const authUser = data.user;


      // Upsert user profile in Supabase
      const { error: profileError } = await supabase
        .from("user_profile")
        .upsert({
          auth_user: authUser?.id,
          email: authUser?.email,
          username: formData.username,
          fullname: formData.fullname,
        });

      if (profileError) {
        throw profileError;
      }

      setUser(authUser);

      router.push("/");
    } catch (error) {
      console.error("signup failed", error)
    } finally {
      setisLoading(false);
    }
  }

  async function handleGoogleSignIn () {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: false,
      },
    });
  }

  async function handleFacebookSignIn () {
    await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: false,
      },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-blue-50 via-purple-50 to-pink-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-93.75 mx-auto"
      >
        <div className="mb-8 grid place-items-center">
          <motion.div
            animate={{
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }} 
            className="flex items-center justify-center size-20 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl mb-4 shadow-xl"
          >
            <TrendingUp size={40} className="text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            TrendIt
          </h1>
          <p className="text-gray-600 mt-2">
            Create your account and let&apos;s trend it.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl space-y-6 p-8">
          <form action="" onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="" className="text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                name="fullname"
                value={formData.fullname}
                onChange={handleInputChange}
                placeholder="Full Name"
                required
                className={`w-full px-4 py-2.5 bg-gray-50 text-black placeholder:text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
                  ${errors.fullname ? "border-red-500 focus:ring-red-500" : ""}`}
              />
              {errors.fullName && (
                <p className="text-red-500 text-[12px] mt-1">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="" className="text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  @
                </span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  placeholder="Username"
                  className={`w-full pl-8 pr-4 py-2.5 bg-gray-50 text-black placeholder:text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
                  ${errors.username ? "border-red-500 focus:ring-red-500" : ""}`}
                />
                {errors.username && (
                  <p className="text-red-500 text-[12px] mt-1">{errors.username}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="user@email.com"
                required
                className={`w-full px-4 py-2.5 bg-gray-50 text-black placeholder:text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
                  ${errors.email ? "border-red-500 focus:ring-red-500" : ""}
                  `}
                value={formData.email}
                onChange={handleInputChange}
              />
              {errors.email && (
                <p className="text-red-500 text-[12px] mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  minLength={8}
                  className={`w-full px-4 py-2.5 bg-gray-50 text-black placeholder:text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-2
                    ${errors.email ? "border-red-500 focus:ring-red-500" : ""}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setshowPassword(!showPassword)}
                  className="absolute top-1/2 -translate-y-1/2 right-3 transform p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="size-5 text-gray-500" />
                  ) : (
                    <Eye className="size-5 text-gray-500" />
                  )}
                </button>
                {errors.password && (
                  <p className="text-red-500 text-[12px] mt-1">{errors.password}</p>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Must be at least 8 characters
              </p>
            </div>


            <button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password}
              className="w-full py-3.5 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            >
              {isLoading ? "Signing up..." : "Create Account"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button"
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-2 px-3 py-3  bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              <svg className="size-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">Google</span>
            </button>
            <button
              type="button"
              onClick={handleFacebookSignIn}
              className="flex items-center justify-center gap-2 px-3 py-3  bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer">
              <svg className="size-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Facebook</span>
            </button>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              Already have an account? {" "}
              <button
                onClick={() => router.push("/signin")}
                className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
