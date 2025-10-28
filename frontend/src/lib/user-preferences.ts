import type { Preference } from "@/app/contexts/PreferenceContext";

interface ApiResponse {
  success: boolean;
  preference: Preference;
}

export async function getPreference(): Promise<Preference | null> {
  try {
    const res = await fetch("/api/preferences");

    if (!res.ok) {
      return null;
    }

    const data: ApiResponse = await res.json();
    return data.success ? data.preference : null;
  } catch {
    return null;
  }
}
