"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2Icon,
  Loader2Icon,
  MailPlusIcon,
  PlusIcon,
  SaveIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
import { z } from "zod";
import { authFetch } from "@/lib/auth-client";
import { useAuthState } from "@/components/auth-state-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  addRolePermissions,
  assignRoleToMember,
  createRole,
  deleteRole,
  getMembers,
  getPermissions,
  getRolePermissions,
  getRoles,
  getSettings,
  inviteMember,
  OrganizationApiError,
  refreshAuthenticationSession,
  registerCompany,
  removeMember,
  removeRolePermission,
  type CompanySettings,
  type OrganizationMember,
  type OrganizationRole,
  type Permission,
  updateMemberStatus,
  updateSettings,
} from "@/app/api/organization-administration/client";

type Profile = { user_id: string; company_name?: string | null };
type RegistrationForm = {
  legal_name: string;
  display_name: string;
  tax_id: string;
  address: string;
  contact_email: string;
  contact_phone: string;
};
const emptyRegistration: RegistrationForm = {
  legal_name: "",
  display_name: "",
  tax_id: "",
  address: "",
  contact_email: "",
  contact_phone: "",
};

function errorText(error: unknown): string {
  if (error instanceof OrganizationApiError) {
    if (error.status === 403)
      return "You can view this area, but you do not have permission for that operation.";
    if (error.status === 404)
      return "Your account does not currently have an active company context.";
    if (error.status === 422) return "Please review the fields and try again.";
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

function BusyButton({
  children,
  busy,
  ...props
}: React.ComponentProps<typeof Button> & { busy?: boolean }) {
  return (
    <Button {...props} disabled={busy || props.disabled}>
      {busy && <Loader2Icon className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <Field>
      <FieldLabel>
        {label}
        {required && <span aria-hidden="true">*</span>}
      </FieldLabel>
      <FieldContent>
        <Input
          required={required}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </FieldContent>
    </Field>
  );
}

export default function OrganizationsPage() {
  const { transitionRevision } = useAuthState();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setProfile(null);
    setLoading(true);
    setPageError(null);
    authFetch("/api/backend/userManagementRouter/profile", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) {
          window.location.assign("/login");
          return null;
        }
        const body = (await response.json()) as {
          data?: Profile;
          message?: string;
        };
        if (!response.ok)
          throw new Error(body.message ?? "Unable to load your profile.");
        return body.data ?? null;
      })
      .then(setProfile)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setPageError(
          error instanceof Error
            ? error.message
            : "Unable to load your profile.",
        );
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [transitionRevision]);
  if (loading) return <LoadingState />;
  if (pageError)
    return (
      <PageMessage
        title="Organization administration unavailable"
        message={pageError}
      />
    );
  if (!profile?.company_name)
    return (
      <RegistrationView
        onRegistered={(name) =>
          setProfile((current) =>
            current ? { ...current, company_name: name } : current,
          )
        }
      />
    );
  return (
    <AdministrationView
      companyName={profile.company_name}
      currentUserId={profile.user_id}
    />
  );
}

function LoadingState() {
  return (
    <main className="flex min-h-[calc(100svh-var(--header-height))] items-center justify-center">
      <Loader2Icon className="size-6 animate-spin" />
    </main>
  );
}
function PageMessage({ title, message }: { title: string; message: string }) {
  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-3 px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        {message}
      </p>
    </main>
  );
}

function RegistrationView({
  onRegistered,
}: {
  onRegistered: (name: string) => void;
}) {
  const [form, setForm] = useState(emptyRegistration);
  const [busy, setBusy] = useState(false);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [registeredCompany, setRegisteredCompany] = useState<{
    companyName: string;
  } | null>(null);
  async function refreshRegisteredCompany(company = registeredCompany) {
    if (!company || refreshBusy) return;
    setRefreshBusy(true);
    setError(null);
    try {
      await refreshAuthenticationSession();
      setSuccess(`${company.companyName} is ready.`);
      onRegistered(company.companyName);
    } catch {
      setError(
        "Your company was registered, but your session could not be refreshed. Retry Session Refresh.",
      );
    } finally {
      setRefreshBusy(false);
    }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const parsed = z
      .object({
        legal_name: z.string().trim().min(3).max(200),
        display_name: z.string().trim().min(3).max(150),
        tax_id: z
          .string()
          .trim()
          .regex(/^[0-9-]+$/)
          .refine((value) => [9, 12].includes(value.replace(/-/g, "").length))
          .optional(),
        address: z.string().trim().min(10).max(300),
        contact_email: z.string().trim().email(),
        contact_phone: z
          .string()
          .regex(/^\+?[0-9-]+$/)
          .refine((value) => {
            const digits = value.replace(/[^0-9]/g, "");
            return digits.length >= 4 && digits.length <= 15;
          })
          .optional(),
      })
      .safeParse({
        ...form,
        tax_id: form.tax_id || undefined,
        contact_phone: form.contact_phone || undefined,
      });
    if (!parsed.success) {
      setError(
        "Please complete the registration fields using the required formats.",
      );
      return;
    }
    if (busy || registeredCompany) return;
    setBusy(true);
    try {
      const result = await registerCompany(parsed.data);
      setRegisteredCompany(result);
      await refreshRegisteredCompany(result);
    } catch (requestError) {
      setError(errorText(requestError));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-[calc(100svh-var(--header-height))]">
      <div className="mx-auto flex w-full max-w-[900px] flex-col gap-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Organization administration
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Register your company
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Create the organization that will anchor your procurement workspace.
            Your account will become its initial organization administrator
            after the backend confirms registration.
          </p>
        </header>
        {registeredCompany ? (
          <Card>
            <CardHeader>
              <CardTitle>Company registered</CardTitle>
              <CardDescription>
                {registeredCompany.companyName} was created successfully.
                Refresh your session to continue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="flex items-center gap-2 text-sm text-emerald-700">
                    <CheckCircle2Icon className="size-4" />
                    {success}
                  </p>
                )}
                <BusyButton
                  type="button"
                  busy={refreshBusy}
                  onClick={() => void refreshRegisteredCompany()}
                >
                  <ShieldCheckIcon className="size-4" />
                  Retry Session Refresh
                </BusyButton>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Company details</CardTitle>
              <CardDescription>
                These details are stored by the existing company registration
                service.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit}>
                <FieldGroup className="gap-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <TextField
                      label="Legal name"
                      required
                      value={form.legal_name}
                      onChange={(value) =>
                        setForm({ ...form, legal_name: value })
                      }
                    />
                    <TextField
                      label="Display name"
                      required
                      value={form.display_name}
                      onChange={(value) =>
                        setForm({ ...form, display_name: value })
                      }
                    />
                    <TextField
                      label="Tax ID"
                      value={form.tax_id}
                      onChange={(value) => setForm({ ...form, tax_id: value })}
                    />
                    <TextField
                      label="Contact phone"
                      value={form.contact_phone}
                      onChange={(value) =>
                        setForm({ ...form, contact_phone: value })
                      }
                    />
                  </div>
                  <TextField
                    label="Address"
                    required
                    value={form.address}
                    onChange={(value) => setForm({ ...form, address: value })}
                  />
                  <TextField
                    label="Contact email"
                    required
                    type="email"
                    value={form.contact_email}
                    onChange={(value) =>
                      setForm({ ...form, contact_email: value })
                    }
                  />
                  {error && (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  )}
                  {success && (
                    <p className="flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle2Icon className="size-4" />
                      {success}
                    </p>
                  )}
                  <BusyButton type="submit" busy={busy}>
                    <ShieldCheckIcon className="size-4" />
                    Register company
                  </BusyButton>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

function AdministrationView({
  companyName,
  currentUserId,
}: {
  companyName: string;
  currentUserId: string;
}) {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [roles, setRoles] = useState<OrganizationRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  async function load() {
    setLoading(true);
    setSectionError(null);
    const results = await Promise.allSettled([
      getSettings(),
      getMembers(),
      getRoles(),
      getPermissions(),
    ]);
    const [settingsResult, membersResult, rolesResult, permissionsResult] =
      results;
    if (settingsResult.status === "fulfilled")
      setSettings(settingsResult.value);
    if (membersResult.status === "fulfilled") setMembers(membersResult.value);
    if (rolesResult.status === "fulfilled") setRoles(rolesResult.value);
    if (permissionsResult.status === "fulfilled")
      setPermissions(permissionsResult.value);
    const failed = results.find((result) => result.status === "rejected");
    if (failed?.status === "rejected")
      setSectionError(errorText(failed.reason));
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);
  async function selectRole(roleId: string) {
    setSelectedRole(roleId || null);
    if (!roleId) return;
    try {
      setRolePermissions(
        (await getRolePermissions(roleId)).map((item) => item.permission),
      );
    } catch (error) {
      setSectionError(errorText(error));
    }
  }
  async function refresh(message: string) {
    setNotice(message);
    await load();
  }
  if (loading) return <LoadingState />;
  return (
    <main className="min-h-[calc(100svh-var(--header-height))]">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Organization administration
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {companyName}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage company information, members, and organization-scoped
              access.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheckIcon className="size-4" />
            Access is enforced by your organization permissions
          </div>
        </header>
        {sectionError && (
          <p
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="alert"
          >
            {sectionError}
          </p>
        )}
        {notice && (
          <p className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2Icon className="size-4" />
            {notice}
          </p>
        )}
        <Tabs defaultValue="roles-and-permissions" className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-1 border bg-muted/40 p-1 sm:grid-cols-3">
            <TabsTrigger value="roles-and-permissions">
              Roles and Permissions
            </TabsTrigger>
            <TabsTrigger value="user-management">User Management</TabsTrigger>
            <TabsTrigger value="organization-management">
              Organization Management
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="roles-and-permissions"
            className="space-y-6"
            keepMounted
          >
            <RolesSection
              roles={roles}
              permissions={permissions}
              selectedRole={selectedRole}
              rolePermissions={rolePermissions}
              onSelectRole={selectRole}
              onChanged={() => void refresh("Roles and permissions updated.")}
            />
          </TabsContent>
          <TabsContent
            value="user-management"
            className="space-y-6"
            keepMounted
          >
            <MembersSection
              members={members}
              roles={roles}
              currentUserId={currentUserId}
              onChanged={() => void refresh("Memberships updated.")}
            />
          </TabsContent>
          <TabsContent
            value="organization-management"
            className="space-y-6"
            keepMounted
          >
            <SettingsSection
              settings={settings}
              onSaved={(value) => {
                setSettings(value);
                setNotice("Company settings saved.");
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function SettingsSection({
  settings,
  onSaved,
}: {
  settings: CompanySettings | null;
  onSaved: (settings: CompanySettings) => void;
}) {
  const [form, setForm] = useState({
    displayName: "",
    legalName: "",
    companyEmail: "",
    contactNumber: "",
    address: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (settings)
      setForm({
        displayName: settings.display_name,
        legalName: settings.legal_name,
        companyEmail: settings.contact_email ?? "",
        contactNumber: settings.contact_phone ?? "",
        address: settings.address ?? "",
      });
  }, [settings]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onSaved(await updateSettings(form));
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company settings</CardTitle>
        <CardDescription>
          Keep the organization identity and contact details current.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit}>
          <FieldGroup className="gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <TextField
                label="Display name"
                required
                value={form.displayName}
                onChange={(value) => setForm({ ...form, displayName: value })}
              />
              <TextField
                label="Legal name"
                required
                value={form.legalName}
                onChange={(value) => setForm({ ...form, legalName: value })}
              />
              <TextField
                label="Company email"
                type="email"
                value={form.companyEmail}
                onChange={(value) => setForm({ ...form, companyEmail: value })}
              />
              <TextField
                label="Contact number"
                value={form.contactNumber}
                onChange={(value) => setForm({ ...form, contactNumber: value })}
              />
            </div>
            <TextField
              label="Address"
              value={form.address}
              onChange={(value) => setForm({ ...form, address: value })}
            />
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <BusyButton type="submit" busy={busy}>
              <SaveIcon className="size-4" />
              Save settings
            </BusyButton>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

function MembersSection({
  members,
  roles,
  currentUserId,
  onChanged,
}: {
  members: OrganizationMember[];
  roles: OrganizationRole[];
  currentUserId: string;
  onChanged: () => void;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await inviteMember(email);
      setEmail("");
      onChanged();
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  async function remove(userId: string) {
    if (!window.confirm("Remove this company membership?")) return;
    try {
      await removeMember(userId);
      onChanged();
    } catch (error) {
      setError(errorText(error));
    }
  }
  async function changeRole(userId: string, roleId: string) {
    try {
      await assignRoleToMember(userId, roleId);
      onChanged();
    } catch (error) {
      setError(errorText(error));
    }
  }
  async function changeStatus(
    userId: string,
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED",
  ) {
    try {
      await updateMemberStatus(userId, status);
      onChanged();
    } catch (error) {
      setError(errorText(error));
    }
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              Invite existing LINAW users and manage company memberships.
            </CardDescription>
          </div>
          <form onSubmit={invite} className="flex gap-2">
            <Input
              aria-label="Member email"
              type="email"
              placeholder="member@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <BusyButton type="submit" busy={busy}>
              <MailPlusIcon className="size-4" />
              Invite
            </BusyButton>
          </form>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="mb-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No company memberships were returned.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="pb-3 pr-4">Member</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b last:border-0">
                    <td className="py-4 pr-4">
                      <div className="font-medium">
                        {[member.user?.first_name, member.user?.last_name]
                          .filter(Boolean)
                          .join(" ") ||
                          member.user?.email ||
                          "Unknown member"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {member.user?.email ?? member.job_title ?? ""}
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <select
                        aria-label={`Role for ${member.user?.email ?? member.user_id}`}
                        className="h-9 rounded-md border bg-background px-2 text-sm"
                        value={member.role?.id ?? ""}
                        onChange={(event) =>
                          void changeRole(member.user_id, event.target.value)
                        }
                      >
                        <option value="">Unassigned</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 pr-4">
                      <select
                        aria-label={`Status for ${member.user?.email ?? member.user_id}`}
                        className="h-9 rounded-md border bg-background px-2 text-sm"
                        value={member.employment_status ?? ""}
                        onChange={(event) =>
                          void changeStatus(
                            member.user_id,
                            event.target.value as
                              | "ACTIVE"
                              | "INACTIVE"
                              | "SUSPENDED",
                          )
                        }
                      >
                        <option value="">Unknown</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    </td>
                    <td className="py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={member.user_id === currentUserId}
                        onClick={() => void remove(member.user_id)}
                      >
                        <Trash2Icon className="size-4" />
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RolesSection({
  roles,
  permissions,
  selectedRole,
  rolePermissions,
  onSelectRole,
  onChanged,
}: {
  roles: OrganizationRole[];
  permissions: Permission[];
  selectedRole: string | null;
  rolePermissions: Permission[];
  onSelectRole: (id: string) => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissionId, setPermissionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await createRole({ name, description });
      setName("");
      setDescription("");
      onChanged();
    } catch (error) {
      setError(errorText(error));
    }
  }
  async function addPermission(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedRole || !permissionId) return;
    try {
      await addRolePermissions(selectedRole, [permissionId]);
      setPermissionId("");
      onSelectRole(selectedRole);
    } catch (error) {
      setError(errorText(error));
    }
  }
  async function removePermission(permission: Permission) {
    if (!selectedRole) return;
    try {
      await removeRolePermission(selectedRole, permission.id);
      onSelectRole(selectedRole);
    } catch (error) {
      setError(errorText(error));
    }
  }
  async function removeRole(roleId: string) {
    if (!window.confirm("Delete this organization role?")) return;
    try {
      await deleteRole(roleId);
      if (selectedRole === roleId) onSelectRole("");
      onChanged();
    } catch (error) {
      setError(errorText(error));
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles and permissions</CardTitle>
        <CardDescription>
          Create organization-scoped roles and configure their available
          permissions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <form
          onSubmit={create}
          className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_1.5fr_auto]"
        >
          <Input
            placeholder="Role name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={100}
          />
          <Input
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
            required
          />
          <Button type="submit">
            <PlusIcon className="size-4" />
            Create role
          </Button>
        </form>
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-2">
            {roles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No roles were returned.
              </p>
            ) : (
              roles.map((role) => (
                <div
                  key={role.id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${selectedRole === role.id ? "border-primary bg-primary/5" : ""}`}
                >
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => onSelectRole(role.id)}
                  >
                    <p className="font-medium">{role.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {role.description || "No description"}
                    </p>
                  </button>
                  {!role.is_system && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${role.name}`}
                      onClick={() => void removeRole(role.id)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="rounded-lg border p-4">
            {selectedRole ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-medium">Assigned permissions</h3>
                    <p className="text-sm text-muted-foreground">
                      Changes are checked by the organization API.
                    </p>
                  </div>
                  <form onSubmit={addPermission} className="flex gap-2">
                    <select
                      aria-label="Permission to add"
                      className="h-9 max-w-[220px] rounded-md border bg-background px-2 text-sm"
                      value={permissionId}
                      onChange={(event) => setPermissionId(event.target.value)}
                    >
                      <option value="">Add permission</option>
                      {permissions
                        .filter(
                          (permission) =>
                            !rolePermissions.some(
                              (assigned) => assigned.id === permission.id,
                            ),
                        )
                        .map((permission) => (
                          <option key={permission.id} value={permission.id}>
                            {permission.name}
                          </option>
                        ))}
                    </select>
                    <Button type="submit" size="sm">
                      Add
                    </Button>
                  </form>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {rolePermissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No permissions assigned.
                    </p>
                  ) : (
                    rolePermissions.map((permission) => (
                      <span
                        key={permission.id}
                        className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
                      >
                        {permission.name}
                        <button
                          aria-label={`Remove ${permission.name}`}
                          onClick={() => void removePermission(permission)}
                        >
                          <Trash2Icon className="size-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a role to inspect and configure its permissions.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
