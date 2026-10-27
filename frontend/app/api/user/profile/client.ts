import { authFetch } from "@/lib/auth-client";

export type UserProfile = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string | null;
  status: string;
  company_name: string | null;
};

export type UpdateUserProfile = Pick<
  UserProfile,
  "first_name" | "last_name" | "email" | "job_title"
>;

export class UserProfileApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "UserProfileApiError";
  }
}

type ProfileResponse = { message?: string; data?: UserProfile };

async function requestProfile(
  method: "GET" | "PATCH",
  body?: UpdateUserProfile,
): Promise<UserProfile> {
  const response = await authFetch("/api/user/profile", {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });
  const result = (await response.json().catch(() => ({}))) as ProfileResponse;
  if (!response.ok || !result.data) {
    throw new UserProfileApiError(
      response.status,
      result.message ?? "Unable to load your profile.",
    );
  }
  return result.data;
}

export function getUserProfile(): Promise<UserProfile> {
  return requestProfile("GET");
}

export function updateUserProfile(
  profile: UpdateUserProfile,
): Promise<UserProfile> {
  return requestProfile("PATCH", profile);
}
