import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getUserProfile,
  setUserProfile,
  UserProfile,
} from "../lib/firestore-service";

export function useUserProfile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (!currentUser) {
        if (isMounted) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const userProfile = await getUserProfile(currentUser.uid);

        if (isMounted) {
          setProfile(userProfile);

          // If no profile exists, create one
          if (!userProfile) {
            const newProfile = {
              uid: currentUser.uid,
              email: currentUser.email || "",
              displayName: currentUser.displayName || undefined,
              photoURL: currentUser.photoURL || undefined,
              role: "user",
            };

            await setUserProfile(newProfile);
            setProfile({ ...newProfile, id: currentUser.uid });
          }
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to fetch user profile"),
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) {
      throw new Error("No authenticated user");
    }

    try {
      setLoading(true);
      setError(null);

      await setUserProfile({
        uid: currentUser.uid,
        ...data,
      });

      // Update local state
      setProfile((prev) => (prev ? { ...prev, ...data } : null));

      return true;
    } catch (err) {
      console.error("Error updating user profile:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to update user profile"),
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
  };
}
