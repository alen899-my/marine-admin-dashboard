"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface ProfileUser {
  fullName?: string;
  email?: string;
  phone?: string;
  profilePicture?: string;
  role?: { name: string };
  company?: { name: string };
}

interface UserContextType {
  dbUser: ProfileUser | null;
  setDbUser: (u: ProfileUser) => void;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({
  dbUser: null,
  setDbUser: () => {},
  loading: true,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [dbUser, setDbUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    fetch("/api/users/profile")
      .then((r) => r.json())
      .then((data) => setDbUser(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  return (
    <UserContext.Provider value={{ dbUser, setDbUser, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);