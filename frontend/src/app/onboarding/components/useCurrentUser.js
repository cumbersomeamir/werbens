"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function useCurrentUser() {
  const { data: session, status } = useSession();
  const [firebaseUser, setFirebaseUser] = useState(null);

  useEffect(() => {
    if (!auth) {
      setFirebaseUser(null);
      return;
    }
    const unsub = onAuthStateChanged(auth, setFirebaseUser);
    return unsub;
  }, []);

  if (status === "loading") {
    return { userId: null, username: null, loading: true };
  }

  if (session?.user) {
    return {
      userId: session.user.id ?? session.user.email,
      username: session.user.email ?? session.user.name ?? session.user.id,
      loading: false,
    };
  }

  if (firebaseUser) {
    return {
      userId: firebaseUser.uid,
      username: firebaseUser.email ?? firebaseUser.phoneNumber ?? firebaseUser.uid,
      loading: false,
    };
  }

  return { userId: null, username: null, loading: false };
}
