import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell, Key, Lock, User, Shield, Star } from "lucide-react";

export default function UserProfile() {
  return (
    <div className="container mx-auto px-4 py-6 md:px-6 2xl:max-w-350">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-6">
          <Avatar className="size-20">
            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold">Account Settings</h1>
            <p className="text-muted-foreground text-sm">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="h-auto w-full justify-start gap-6 bg-transparent p-0">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <User className="mr-2 size-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Lock className="mr-2 size-4" />
              Security
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Bell className="mr-2 size-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="p-0">
              <CardContent className="p-6">
                <h2 className="mb-4 text-lg font-semibold">Profile Details</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" defaultValue="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" defaultValue="Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" defaultValue="Product Designer" readOnly />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="p-0">
              <CardContent className="p-6">
                <h2 className="mb-4 text-lg font-semibold">
                  Connected Accounts
                </h2>
                <div className="space-y-4">
                  {["GitHub", "Google", "Twitter"].map((provider) => (
                    <div
                      key={provider}
                      className="flex flex-col items-start justify-between gap-4 py-3 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                          <Star className="text-muted-foreground size-5" />
                        </div>
                        <div>
                          <p className="font-medium">{provider}</p>
                          <p className="text-muted-foreground text-sm">
                            {provider === "GitHub"
                              ? "Connected"
                              : "Not Connected"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={provider === "GitHub" ? "outline" : "default"}
                      >
                        {provider === "GitHub" ? "Disconnect" : "Connect"}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="p-0">
              <CardContent className="p-6">
                <h2 className="mb-4 text-lg font-semibold">
                  Security Settings
                </h2>
                <div className="space-y-6">
                  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="space-y-1">
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-muted-foreground text-sm">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline">
                      <Shield className="mr-2 size-4" />
                      Enable
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                      <div className="space-y-1">
                        <p className="font-medium">Password</p>
                        <p className="text-muted-foreground text-sm">
                          Last changed 3 months ago
                        </p>
                      </div>
                      <Button variant="outline">
                        <Key className="mr-2 size-4" />
                        Change
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-0">
              <CardContent className="p-6">
                <h2 className="mb-4 text-lg font-semibold">Active Sessions</h2>
                <div className="space-y-4">
                  {[
                    {
                      device: "MacBook Pro",
                      location: "San Francisco, CA",
                      lastActive: "Active now",
                      current: true,
                    },
                    {
                      device: "iPhone 12",
                      location: "New York, NY",
                      lastActive: "2 days ago",
                      current: false,
                    },
                  ].map((session) => (
                    <div
                      key={session.device}
                      className="flex flex-col items-start justify-between gap-3 py-3 sm:flex-row sm:items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{session.device}</p>
                          {session.current && (
                            <Badge variant="secondary">Current</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {session.location} • {session.lastActive}
                        </p>
                      </div>
                      {!session.current && (
                        <Button variant="outline" size="sm">
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="p-0">
              <CardContent className="p-6">
                <h2 className="mb-4 text-lg font-semibold">
                  Notification Preferences
                </h2>
                <div className="space-y-4">
                  {[
                    "Email notifications",
                    "Push notifications",
                    "Monthly newsletter",
                    "Security alerts",
                  ].map((pref) => (
                    <div
                      key={pref}
                      className="flex flex-col items-start justify-between gap-3 py-3 sm:flex-row sm:items-center"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{pref}</p>
                        <p className="text-muted-foreground text-sm">
                          Receive notifications about account activity
                        </p>
                      </div>
                      <Button variant="outline">Configure</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
