"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface Preference {
  id: number;
  user_id: string;
  organization_id: string;
}

interface ContextValue {
  preference: Preference | null;
  setPreference: (preference: Preference | null) => void;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const PreferenceContext = createContext<ContextValue>({
  preference: null,
  setPreference: () => {},
  isLoading: false,
  refetch: async () => {},
});

interface ProviderProps {
  children: React.ReactNode;
  initialPreference?: Preference | null;
}

async function getPreference(): Promise<Preference | null> {
  try {
    const res = await fetch("/api/account/preferences");

    if (!res.ok) {
      return null;
    }

    const data: { success: boolean; preference: Preference } = await res.json();
    return data.success ? data.preference : null;
  } catch {
    return null;
  }
}

export function PreferenceProvider({
  children,
  initialPreference,
}: ProviderProps) {
  const [preference, setPreference] = useState<Preference | null>(
    initialPreference || null
  );
  const [isLoading, setIsLoading] = useState(!initialPreference);

  const fetchPreference = async () => {
    setIsLoading(true);
    try {
      const pref = await getPreference();
      setPreference(pref);
    } catch (error) {
      console.error("Failed to fetch preference:", error);
      setPreference(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialPreference) {
      fetchPreference();
    }
  }, [initialPreference]);

  const value: ContextValue = {
    preference,
    setPreference,
    isLoading,
    refetch: fetchPreference,
  };

  return (
    <PreferenceContext.Provider value={value}>
      {children}
    </PreferenceContext.Provider>
  );
}

export function usePreference() {
  const context = useContext(PreferenceContext);
  if (!context) {
    throw new Error("usePreference must be used within a PreferenceProvider");
  }
  return context;
}
