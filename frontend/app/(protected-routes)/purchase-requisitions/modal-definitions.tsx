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
            <Plus className="h-4 w-4" />
            Create Requisition
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Draft Purchase Requisition</DialogTitle>
          <DialogDescription>
            Create a new draft requisition. You can add more line items later
            before submission.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="grid gap-6 py-4">
          {/* Header Details */}
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label htmlFor="purpose">Purpose (Optional)</Label>
              <Input
                id="purpose"
                name="purpose"
                placeholder="e.g. Office equipment"
              />
            </Field>

            <Field>
              <Label htmlFor="needed_by_date">Needed By Date</Label>
              <Input
                id="needed_by_date"
                name="needed_by_date"
                type="date"
                required
              />
            </Field>

            <Field>
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue="NORMAL">
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <Label htmlFor="currency_code">Currency</Label>
              <Select name="currency_code" defaultValue="USD">
                <SelectTrigger id="currency_code">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="PHP">PHP - Philippine Peso</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field>
            <Label htmlFor="justification">Justification</Label>
            <Textarea
              id="justification"
              name="justification"
              placeholder="Provide a reason for this purchase (10-500 characters)."
              minLength={10}
              maxLength={500}
              required
              className="resize-none h-20"
            />
          </Field>

          {/* Initial Line Item Requirement */}
          <div className="rounded-md border p-4 bg-muted/20">
            <h4 className="text-sm font-semibold mb-3">Initial Line Item</h4>
            <p className="text-xs text-muted-foreground mb-4">
              At least one item is required to create a draft requisition[cite:
              5].
            </p>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <Label htmlFor="item_type">Item Type</Label>
                <Select name="items[0].item_type" defaultValue="GOODS">
                  <SelectTrigger id="item_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GOODS">Goods</SelectItem>
                    <SelectItem value="SERVICE">Service</SelectItem>
                    <SelectItem value="ASSET">Asset</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="items[0].description"
                  placeholder="e.g. Business Laptop"
                  required
                />
              </Field>

              <Field>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="items[0].quantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                />
              </Field>

              <Field>
                <Label htmlFor="unit_of_measure">Unit of Measure</Label>
                <Input
                  id="unit_of_measure"
                  name="items[0].unit_of_measure"
                  placeholder="e.g. EA"
                  required
                />
              </Field>

              <Field className="col-span-2">
                <Label htmlFor="estimated_unit_cost">Estimated Unit Cost</Label>
                <Input
                  id="estimated_unit_cost"
                  name="items[0].estimated_unit_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                />
              </Field>
            </div>
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
          <Button type="submit">Create Draft</Button>
        </DialogFooter>
      </DialogContent>
    </form>
  </Dialog>
);
