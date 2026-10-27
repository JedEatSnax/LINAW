"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { CheckCircle2Icon, Loader2Icon, UserRoundIcon } from "lucide-react";

import { getUserProfile, updateUserProfile, UserProfileApiError, type UserProfile as UserProfileData } from "@/app/api/user/profile/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthState } from "@/components/auth-state-provider";

const profileSchema = z.object({
  first_name: z.string().trim().min(3).max(40),
  last_name: z.string().trim().min(3).max(40),
  email: z.string().trim().email(),
  job_title: z.string().trim().min(3).max(40).or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

function profileForm(profile: UserProfileData): ProfileForm {
  return { first_name: profile.first_name, last_name: profile.last_name, email: profile.email, job_title: profile.job_title ?? "" };
}

function initials(profile: UserProfileData): string {
  return `${profile.first_name[0] ?? ""}${profile.last_name[0] ?? ""}`.toUpperCase();
}

function errorMessage(error: unknown): string {
  if (error instanceof UserProfileApiError) {
    if (error.status === 401) return "Your session has expired. Please sign in again.";
    if (error.status === 404) return "Your profile could not be found.";
    if (error.status === 422) return "Please check the fields and try again.";
    return error.message;
  }
  return "We could not complete that request. Please try again.";
}

export default function UserProfile() {
  const { transitionRevision } = useAuthState();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setProfile(null);
    setForm(null);
    setLoading(true);
    setError(null);
    getUserProfile().then((data) => {
      if (!controller.signal.aborted) { setProfile(data); setForm(profileForm(data)); }
    }).catch((requestError: unknown) => {
      if (!controller.signal.aborted) setError(errorMessage(requestError));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [transitionRevision]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || saving) return;
    setError(null);
    setSuccess(null);
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) { setError("Use 3-40 characters for names and job title, and enter a valid email."); return; }
    setSaving(true);
    try {
      const updated = await updateUserProfile({ ...parsed.data, job_title: parsed.data.job_title || null });
      setProfile(updated);
      setForm(profileForm(updated));
      setSuccess("Profile changes saved.");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="flex min-h-[calc(100svh-var(--header-height))] items-center justify-center"><Loader2Icon className="size-6 animate-spin text-muted-foreground" aria-label="Loading profile" /></main>;
  if (!profile || !form) return <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6"><p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">{error ?? "Unable to load your profile."}</p></main>;

  return (
    <main className="min-h-[calc(100svh-var(--header-height))] bg-muted/20">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="flex items-center gap-4 border-b pb-7">
          <Avatar className="size-16 ring-4 ring-background sm:size-20"><AvatarFallback className="bg-primary/10 text-lg text-primary">{initials(profile)}</AvatarFallback></Avatar>
          <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Account settings</p><h1 className="mt-1 truncate text-2xl font-semibold tracking-tight sm:text-3xl">{profile.first_name} {profile.last_name}</h1><p className="truncate text-sm text-muted-foreground">Manage your profile information and account context</p></div>
        </header>
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_260px]">
          <Card><CardHeader><CardTitle>Profile details</CardTitle><CardDescription>Keep the information associated with your LINAW account current.</CardDescription></CardHeader><CardContent><form className="space-y-6" onSubmit={(event) => void save(event)}><div className="grid gap-5 sm:grid-cols-2"><ProfileField id="first_name" label="First name" value={form.first_name} onChange={(value) => setForm({ ...form, first_name: value })} /><ProfileField id="last_name" label="Last name" value={form.last_name} onChange={(value) => setForm({ ...form, last_name: value })} /><ProfileField id="email" label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} /><ProfileField id="job_title" label="Job title" value={form.job_title} onChange={(value) => setForm({ ...form, job_title: value })} /></div>{error && <p className="text-sm text-destructive" role="alert">{error}</p>}{success && <p className="flex items-center gap-2 text-sm text-emerald-700" role="status"><CheckCircle2Icon className="size-4" />{success}</p>}<div className="flex justify-end"><Button type="submit" disabled={saving}>{saving && <Loader2Icon className="size-4 animate-spin" />}Save changes</Button></div></form></CardContent></Card>
          <Card className="h-fit"><CardHeader><CardTitle>Account context</CardTitle><CardDescription>Information managed by LINAW.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="flex items-start gap-3"><UserRoundIcon className="mt-0.5 size-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Status</p><Badge variant="secondary" className="mt-1">{profile.status}</Badge></div></div><div><p className="text-xs text-muted-foreground">Company</p><p className="mt-1 text-sm font-medium">{profile.company_name ?? "No company assigned"}</p></div></CardContent></Card>
        </div>
      </div>
    </main>
  );
}

function ProfileField({ id, label, value, onChange, type = "text" }: { id: string; label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}
