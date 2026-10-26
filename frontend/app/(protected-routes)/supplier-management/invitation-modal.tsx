"use client";

import { UserRoundPlus } from "lucide-react";
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

export const invitationsModal = (
  <Dialog>
    <form>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <UserRoundPlus className="h-4 w-4" />
            Invite
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Send Supplier Invitation</DialogTitle>
          <DialogDescription>
            An email will be dispatched with a 72-hour registration link
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="py-4">
          <Field>
            <Label htmlFor="email">Supplier Contact Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              maxLength={254}
              required
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
          <Button type="submit">Send Invitation</Button>
        </DialogFooter>
      </DialogContent>
    </form>
  </Dialog>
);
