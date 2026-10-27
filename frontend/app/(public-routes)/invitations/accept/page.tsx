"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, Link2, ShieldAlert } from "lucide-react";
import {
  acceptInvitation,
  validateInvitation,
  type InvitationPreview,
} from "@/app/api/suppliers/client";
import {
  acceptMemberInvitation,
  validateMemberInvitation,
} from "@/app/api/organization-administration/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  getUserProfile,
  UserProfileApiError,
} from "@/app/api/user/profile/client";

function invitationReturnPath(token: string) {
  return `/invitations/accept?token=${encodeURIComponent(token)}`;
}

function friendlyError(message: string) {
  if (/expired/i.test(message)) return "This invitation has expired.";
  if (/no longer valid|not found/i.test(message)) {
    return "This invitation is no longer available. It may have already been processed or revoked.";
  }
  if (/session|authenticated|login/i.test(message)) {
    return "Please sign in with the account associated with this invitation.";
  }
  if (/does not match|email/i.test(message)) {
    return "The signed-in account does not match the email address invited to LINAW.";
  }
  return "We could not complete this invitation right now. Please try again.";
}

export default function InvitationAcceptPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const isOrganizationInvitation = /^[A-Fa-f0-9]{64}$/.test(token);
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompany, setHasCompany] = useState(false);
  const [organizationValid, setOrganizationValid] = useState(false);
  const [organizationAccepted, setOrganizationAccepted] = useState(false);

  const returnPath = useMemo(() => invitationReturnPath(token), [token]);

  useEffect(() => {
    if (
      !/^[A-Za-z0-9_-]{32,512}$/.test(token) &&
      !isOrganizationInvitation
    ) {
      setError("This invitation link is malformed or incomplete.");
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const validation = isOrganizationInvitation
      ? validateMemberInvitation(token).then(() => {
          if (!cancelled) setOrganizationValid(true);
        })
      : validateInvitation(token).then((result) => {
          if (!cancelled) setPreview(result);
        });
    validation
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? friendlyError(cause.message) : "This invitation is unavailable.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOrganizationInvitation, token]);

  useEffect(() => {
    if (!preview && !organizationValid) return;

    let cancelled = false;
    setIsCheckingAccount(true);

    getUserProfile()
      .then((profile) => {
        if (cancelled) return;
        setIsAuthenticated(true);
        setHasCompany(Boolean(profile.company_name));
      })
      .catch((cause: unknown) => {
        if (cancelled) return;

        if (
          cause instanceof UserProfileApiError &&
          cause.status === 401 &&
          !isOrganizationInvitation
        ) {
          router.push(`/login?returnTo=${encodeURIComponent(returnPath)}`);
          return;
        }

        setError("We could not verify your LINAW account. Please sign in again.");
      })
      .finally(() => {
        if (!cancelled) setIsCheckingAccount(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOrganizationInvitation, organizationValid, preview, returnPath, router]);

  async function handleAccept() {
    if ((!preview && !organizationValid) || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      if (isOrganizationInvitation) {
        await acceptMemberInvitation(token);
        setOrganizationAccepted(true);
      } else {
        await acceptInvitation(preview!.invitation_id, token);
        setAccepted(true);
      }
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : "";
      if (/session|sign in|authentication/i.test(message)) {
        router.push(`/login?returnTo=${encodeURIComponent(returnPath)}`);
        return;
      }
      setError(friendlyError(message));
    } finally {
      setIsSubmitting(false);
    }
  }

  const heading = isOrganizationInvitation
    ? organizationAccepted
      ? "Organization membership connected"
      : "You have been invited to join an organization"
    : accepted
      ? "Supplier relationship connected"
      : "You have been invited";

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-4 sm:p-8">
      <Dialog open>
        <DialogContent showCloseButton={false} className="max-w-lg p-1">
          <DialogHeader className="border-b px-5 py-5 sm:px-6">
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {accepted ? <CheckCircle2 className="size-5" /> : <Link2 className="size-5" />}
            </div>
            <DialogTitle className="text-xl">{heading}</DialogTitle>
            <DialogDescription>
              {organizationAccepted
                ? "Your organization membership is now ready in LINAW."
                : accepted
                ? "Your supplier relationship is now ready in LINAW."
                : "A company has invited your account to connect as a supplier in LINAW."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-5 py-6 sm:px-6">
            {isLoading && <p className="text-sm text-muted-foreground">Checking invitation details...</p>}
            {error && (
              <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            {isCheckingAccount && (
              <p className="text-sm text-muted-foreground">
                Verifying your account and company access...
              </p>
            )}
            {isOrganizationInvitation && organizationValid && !isAuthenticated && !organizationAccepted && (
              <div className="space-y-3 rounded-lg border bg-muted/20 p-4 text-sm">
                <p className="font-medium">Sign in or create your account</p>
                <p className="text-muted-foreground">
                  Use the invited email address when signing in or registering.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => router.push(`/signup?invitationToken=${encodeURIComponent(token)}&returnTo=${encodeURIComponent(returnPath)}`)}>Create account</Button>
                  <Button onClick={() => router.push(`/login?returnTo=${encodeURIComponent(returnPath)}`)}>Sign in</Button>
                </div>
              </div>
            )}
            {preview && isAuthenticated && !hasCompany && !accepted && (
              <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                <p className="font-medium">Company membership required</p>
                <p className="text-muted-foreground">
                  Your account is signed in, but it is not associated with a company.
                  LINAW requires an active company membership before this invitation
                  can be accepted.
                </p>
                <p className="text-muted-foreground">
                  LINAW does not currently provide a company registration route here.
                  Ask an organization administrator to add your account, then return
                  to this invitation.
                </p>
              </div>
            )}
            {((preview && isAuthenticated && hasCompany && !accepted) ||
              (isOrganizationInvitation && isAuthenticated && organizationValid && !organizationAccepted)) && (
              <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Invitation status</p>
                  <p className="mt-1 font-medium">Ready to review</p>
                </div>
                <div className="flex gap-3 text-sm text-muted-foreground">
                  <Clock3 className="mt-0.5 size-4 shrink-0" />
                  <p>Accepting connects your authenticated supplier account to the inviting company. LINAW will verify your account and invitation again when you accept.</p>
                </div>
                <p className="text-xs text-muted-foreground">The inviting company name is not included in the current invitation response.</p>
              </div>
            )}
            {organizationAccepted && <p className="text-sm text-muted-foreground">You can continue to organization settings to manage your membership.</p>}
            {accepted && <p className="text-sm text-muted-foreground">You can continue to the supplier portal to manage your connected procurement work.</p>}
          </div>

          <DialogFooter className="border-t px-5 py-4 sm:px-6">
            {!accepted && !organizationAccepted && ((preview && isAuthenticated && hasCompany) ||
              (isOrganizationInvitation && isAuthenticated && organizationValid)) && (
              <>
                <Button variant="outline" type="button" onClick={() => router.push("/")} disabled={isSubmitting}>
                  Leave for now
                </Button>
                <Button type="button" onClick={handleAccept} disabled={isSubmitting}>
                  {isSubmitting ? "Accepting..." : "Accept invitation"}
                </Button>
              </>
            )}
            {organizationAccepted && <Button type="button" onClick={() => router.push("/organization-settings")}>Open organization settings</Button>}
            {accepted && <Button type="button" onClick={() => router.push("/suppliers")}>Open supplier portal</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
