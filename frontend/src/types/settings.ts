export interface PollingSettings {
  active_runs: number;
  recent_runs: number;
  older_runs: number;
  background: number;
  enable_background_polling: boolean;
}

export interface NotificationSettings {
  email_on_failure: boolean;
  email_on_success: boolean;
  browser_notifications: boolean;
  workflow_completion: boolean;
}

export interface DisplaySettings {
  theme: "light" | "dark" | "system";
  items_per_page: number;
  show_runner_details: boolean;
  compact_view: boolean;
}

export interface UserSettings {
  id: number;
  user_id: string;
  organization_id: string;
  polling_settings: PollingSettings;
  notification_settings: NotificationSettings;
  display_settings: DisplaySettings;
  created_at: string;
  updated_at: string;
}

export interface UserSettingsUpdate {
  organization_id?: string;
  polling_settings?: PollingSettings;
  notification_settings?: NotificationSettings;
  display_settings?: DisplaySettings;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileUpdate {
  name?: string;
  email?: string;
  image?: string;
}