"use client";

import { ShieldPlus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

export const roleModal = (
  <Dialog>
    <form>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <ShieldPlus className="h-4 w-4" />
            Create Role
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Custom Role</DialogTitle>
          <DialogDescription>
            Define a new role for your organization. You can assign specific
            permissions to this role after creation[cite: 2].
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="py-4 space-y-4">
          <Field>
            <Label htmlFor="name">Role Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Finance Manager"
              maxLength={100}
              required
            />
          </Field>
          <Field>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Briefly describe the responsibilities of this role..."
              maxLength={500}
              className="resize-none h-24"
              required
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" type="button">
                Cancel
              </Button>
            }
          />
          <Button type="submit">Create Role</Button>
        </DialogFooter>
      </DialogContent>
    </form>
  </Dialog>
);
