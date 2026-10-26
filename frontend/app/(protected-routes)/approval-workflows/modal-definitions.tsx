"use client";

import { Plus } from "lucide-react";
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

export const modal = (
  <Dialog>
    <form>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Definition
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Workflow Definition</DialogTitle>
          <DialogDescription>
            Configure a new tenant-owned workflow definition
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="grid gap-4 py-2">
          {/* Workflow Code */}
          <Field>
            <Label htmlFor="workflow_code">Workflow Code</Label>
            <Input
              id="workflow_code"
              name="workflow_code"
              placeholder="e.g. PURCHASE_REQUISITION_CUSTOM"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Must match uppercase letters, numbers, and underscores.
            </p>
          </Field>

          {/* Workflow Name */}
          <Field>
            <Label htmlFor="name">Workflow Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Purchase Requisition Custom"
              required
            />
          </Field>

          {/* Entity Type */}
          <Field>
            <Label htmlFor="entity_type">Entity Type</Label>
            <Input
              id="entity_type"
              name="entity_type"
              defaultValue="purchase_requisition"
              required
            />
          </Field>

          {/* Description */}
          <Field>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Approval flow for custom purchase requisitions"
              className="resize-none"
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <DialogClose render={<Button variant="destructive">Cancel</Button>} />
          <Button type="submit">Create Workflow</Button>
        </DialogFooter>
      </DialogContent>
    </form>
  </Dialog>
);
