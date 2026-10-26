import UserProfile from "@/components/user-profile";

export default function ProfilePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full">
        <UserProfile />
      </div>
    </div>
  );
}
