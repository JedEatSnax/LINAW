"use client";

import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Modal for PATCH /api/userManagementRouter/profile[cite: 4]
export const editProfileModal = (
  <Dialog>
    <form>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Profile
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Profile</DialogTitle>
          <DialogDescription>Update user information.</DialogDescription>
        </DialogHeader>

        <FieldGroup className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                name="first_name"
                minLength={3}
                maxLength={40}
                required
              />
            </Field>
            <Field>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                name="last_name"
                minLength={3}
                maxLength={40}
                required
              />
            </Field>
          </div>

          <Field>
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" required />
          </Field>

          <Field>
            <Label htmlFor="job_title">Job Title (Optional)</Label>
            <Input
              id="job_title"
              name="job_title"
              minLength={3}
              maxLength={40}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <DialogClose
            render={
              <Button variant="destructive" type="button">
                Cancel
              </Button>
            }
          />
          <Button type="submit">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </form>
  </Dialog>
);

// Modal for POST /api/userManagementRouter/companies/register[cite: 4]
export const registerCompanyModal = (
  <Dialog>
    <form>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Building2 className="h-4 w-4" />
            Register Company
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Register Company</DialogTitle>
          <DialogDescription>
            Register a new company for your tenant. You will be assigned as the
            initial organization administrator[cite: 4].
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="grid gap-4 py-2">
          <Field>
            <Label htmlFor="legal_name">Legal Name</Label>
            <Input
              id="legal_name"
              name="legal_name"
              placeholder="e.g. Example Procurement Ltd"
              minLength={3}
              maxLength={200}
              required
            />
          </Field>

          <Field>
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              name="display_name"
              placeholder="e.g. Example Procurement"
              minLength={3}
              maxLength={150}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                required
              />
            </Field>

            <Field>
              <Label htmlFor="contact_phone">Contact Phone (Optional)</Label>
              <Input
                id="contact_phone"
                name="contact_phone"
                placeholder="+63-917-123-4567"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Accepts 4-15 digits after normalization[cite: 4].
              </p>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label htmlFor="tax_id">Tax ID (Optional)</Label>
              <Input id="tax_id" name="tax_id" placeholder="123-456-789" />
              <p className="text-[10px] text-muted-foreground mt-1">
                Must contain 9 or 12 digits[cite: 4].
              </p>
            </Field>

            <Field>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                minLength={10}
                maxLength={300}
                required
              />
            </Field>
          </div>
        </FieldGroup>

        <DialogFooter>
          <DialogClose
            render={
              <Button variant="destructive" type="button">
                Cancel
              </Button>
            }
          />
          <Button type="submit">Register Organization</Button>
        </DialogFooter>
      </DialogContent>
    </form>
  </Dialog>
);
