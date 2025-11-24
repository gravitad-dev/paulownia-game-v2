"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { UserService } from "@/services/user.service";
import { CardContent } from "@/components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await UserService.getMe();
        updateUser(userData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (user?.id) {
          try {
            const userDataById = await UserService.getById(user.id);
            updateUser(userDataById);
          } catch (innerError) {
            console.error("Error fetching user data by ID:", innerError);
          }
        }
      }
    };

    if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const avatarUrl = user?.avatar?.url
    ? user.avatar.url.startsWith("http")
      ? user.avatar.url
      : `${API_URL}${user.avatar.url}`
    : null;

  const initials = user?.username
    ? user.username
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <CardContent className="px-6 py-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={user?.username || "Avatar"}
              width={128}
              height={128}
              className="h-24 w-24 rounded-full object-cover border-2 border-border sm:h-32 sm:w-32"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted border-2 border-border text-2xl font-semibold text-muted-foreground sm:h-32 sm:w-32 sm:text-3xl">
              {initials}
            </div>
          )}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold sm:text-3xl">
            {user?.username || "Usuario"}
          </h1>
          {user?.name && user?.lastname && (
            <p className="mt-1 text-muted-foreground">
              {user.name} {user.lastname}
            </p>
          )}
        </div>
      </div>
    </CardContent>
  );
}
