import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserSettings, UserSettingsUpdate, UserProfile, UserProfileUpdate } from "@/types/settings";

// Fetch user settings
export function useUserSettings(organizationId?: string) {
  return useQuery({
    queryKey: ["user-settings", organizationId],
    queryFn: async (): Promise<UserSettings> => {
      const url = organizationId 
        ? `/api/users/settings?organization_id=${organizationId}`
        : "/api/users/settings";
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch user settings");
      }
      return response.json();
    },
    enabled: true,
  });
}

// Update user settings
export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      settings, 
      organizationId 
    }: { 
      settings: UserSettingsUpdate; 
      organizationId?: string; 
    }): Promise<UserSettings> => {
      const url = organizationId 
        ? `/api/users/settings?organization_id=${organizationId}`
        : "/api/users/settings";
      
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update user settings");
      }
      
      return response.json();
    },
    onSuccess: (_, { organizationId }) => {
      // Invalidate and refetch settings
      queryClient.invalidateQueries({ queryKey: ["user-settings", organizationId] });
    },
  });
}

// Create user settings
export function useCreateUserSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: Omit<UserSettings, "id" | "user_id" | "created_at" | "updated_at">): Promise<UserSettings> => {
      const response = await fetch("/api/users/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create user settings");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch settings
      queryClient.invalidateQueries({ queryKey: ["user-settings", data.organization_id] });
    },
  });
}

// Fetch user profile
export function useUserProfile() {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: async (): Promise<UserProfile> => {
      const response = await fetch("/api/users/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }
      return response.json();
    },
  });
}

// Update user profile
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profile: UserProfileUpdate): Promise<{ success: boolean; message: string; user: UserProfile }> => {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update user profile");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch profile
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}