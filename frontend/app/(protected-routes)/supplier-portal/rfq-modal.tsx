"use client";

import { FileText } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

export const rfqModal = (
  <Dialog>
    <form>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <FileText className="h-4 w-4" />
            New Quotation
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Quotation</DialogTitle>
          <DialogDescription>
            Submit your pricing for this RFQ. You must provide a quote for every
            item requested[cite: 6].
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
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

            <Field>
              <Label htmlFor="valid_until">Valid Until (Optional)</Label>
              <Input
                id="valid_until"
                name="valid_until"
                type="date"
                min={new Date().toISOString().split("T")[0]} // Prevents past dates[cite: 6]
              />
            </Field>
          </div>

          <div className="rounded-md border p-4 bg-muted/20">
            <h4 className="text-sm font-semibold mb-3">Line Item Pricing</h4>
            <p className="text-xs text-muted-foreground mb-4">
              Enter your quantities, unit prices, and lead times. All item rows
              must be completed[cite: 6].
            </p>

            <div className="grid grid-cols-3 gap-4">
              <Field className="col-span-3">
                <Label htmlFor="rfq_item_id">RFQ Item ID</Label>
                <Input
                  id="rfq_item_id"
                  name="items[0].rfq_item_id"
                  placeholder="Selected Item UUID"
                  required
                />
              </Field>

              <Field>
                <Label htmlFor="quoted_quantity">Quoted Qty</Label>
                <Input
                  id="quoted_quantity"
                  name="items[0].quoted_quantity"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  required
                />
              </Field>

              <Field>
                <Label htmlFor="unit_price">Unit Price</Label>
                <Input
                  id="unit_price"
                  name="items[0].unit_price"
                  type="number"
                  step="0.0001"
                  min="0"
                  required
                />
              </Field>

              <Field>
                <Label htmlFor="lead_time_days">Lead Time (Days)</Label>
                <Input
                  id="lead_time_days"
                  name="items[0].lead_time_days"
                  type="number"
                  min="0"
                  placeholder="Optional"
                />
              </Field>

              <Field className="col-span-3">
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Textarea
                  id="remarks"
                  name="items[0].remarks"
                  placeholder="Delivery terms, conditions, etc."
                  maxLength={1000}
                  className="resize-none h-16"
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
          <Button type="submit">Submit Quotation</Button>
        </DialogFooter>
      </DialogContent>
    </form>
  </Dialog>
);
