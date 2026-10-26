"use client";

import { Edit2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const modal = (
  <Dialog>
    <form>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Edit2 className="h-4 w-4" />
            Update PO
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Purchase Order</DialogTitle>
          <DialogDescription>
            Modify the expected delivery date and currency for this issued
            order.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="grid gap-4 py-2">
          {/* Delivery Date */}
          <Field>
            <Label htmlFor="expected_delivery_date">
              Expected Delivery Date
            </Label>
            <Input
              id="expected_delivery_date"
              name="expected_delivery_date"
              type="date"
              required
            />
          </Field>

          {/* Currency */}
          <Field>
            <Label htmlFor="currency_code">Currency Code</Label>
            <Select name="currency_code" defaultValue="PHP">
              <SelectTrigger id="currency_code">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PHP">PHP - Philippine Peso</SelectItem>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="rounded-md border p-3 mt-2 bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Item modifications (quantities and unit pricing) must be updated
              via the line-item editor table.
            </p>
          </div>
        </FieldGroup>

        <DialogFooter>
          <DialogClose render={<Button variant="destructive">Cancel</Button>} />
          <Button type="submit">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </form>
  </Dialog>
);
