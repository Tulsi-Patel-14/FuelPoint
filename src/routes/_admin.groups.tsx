import { createFileRoute } from "@tanstack/react-router";
import { BadgePercent, Pencil, Plus, Power, Tags, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DonutChart, HorizontalBarChart } from "@/components/admin/charts";
import { PageHeader, Panel, StatCard } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useAdmin } from "@/lib/admin-store";
import {
  DEFAULT_GROUP_ID,
  formatCurrency,
  formatDate,
  formatNumber,
} from "@/services/adminService";
import type { Group } from "@/services/types";

export const Route = createFileRoute("/_admin/groups")({
  head: () => ({
    meta: [
      { title: "Groups & Discounts — FuelPoint Admin" },
      {
        name: "description",
        content:
          "Create discount groups, set percentages and assign customers to Family, Friends, Employees and more.",
      },
      { property: "og:title", content: "Groups & Discounts — FuelPoint Admin" },
      {
        property: "og:description",
        content: "Manage dynamic discount groups and customer assignments.",
      },
    ],
  }),
  component: GroupsPage,
});

const blank = { id: "", name: "", discountPercent: 1 as number | string, description: "", active: true };

function GroupsPage() {
  const {
    groups,
    customers,
    saveGroup,
    deleteGroup,
    toggleGroupActive,
    assignCustomerGroup,
  } = useAdmin();
  const [editing, setEditing] = useState<typeof blank | null>(null);
  const [assignTarget, setAssignTarget] = useState<Group | null>(null);
  const [assignCustomer, setAssignCustomer] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalDiscount = useMemo(
    () => groups.reduce((s, g) => s + (g.discountGenerated ?? 0), 0),
    [groups],
  );

  const totalGroupedCustomers = useMemo(
    () => groups.reduce((s, g) => s + (g.customersCount ?? 0), 0),
    [groups],
  );

  const validateForm = () => {
    if (!editing) return false;
    const newErrors: Record<string, string> = {};

    if (!editing.name.trim()) {
      newErrors.name = "Group name is required.";
    }

    const pctStr = String(editing.discountPercent).trim();
    if (pctStr === "" || isNaN(Number(editing.discountPercent))) {
      newErrors.discountPercent = "Discount percentage is required.";
    } else {
      const pct = Number(editing.discountPercent);
      if (pct < 0 || pct > 100) {
        newErrors.discountPercent = "Discount percentage must be between 0 and 100.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async () => {
    if (!editing) return;
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await saveGroup({
        id: editing.id || undefined,
        name: editing.name.trim(),
        discountPercent: Number(editing.discountPercent),
        description: editing.description.trim(),
        active: editing.active,
      } as any);

      toast.success(editing.id ? "Group updated successfully" : "Group created successfully", {
        description: editing.name.trim(),
      });
      setEditing(null);
      setErrors({});
    } catch (err: any) {
      toast.error(err.message || "Failed to save group");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Groups"
        subtitle="Define discount groups and control the percentage applied at scan time."
        actions={
          <Button
            onClick={() => {
              setErrors({});
              setEditing({ ...blank });
            }}
          >
            <Plus className="size-4" /> New group
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total groups" value={formatNumber(groups.length)} icon={Tags} />
        <StatCard
          label="Active groups"
          value={formatNumber(groups.filter((g) => g.active).length)}
          icon={Power}
          tone="teal"
        />
        <StatCard
          label="Grouped customers"
          value={formatNumber(totalGroupedCustomers)}
          icon={Users}
          tone="navy"
        />
        <StatCard
          label="Discount generated"
          value={formatCurrency(totalDiscount)}
          icon={BadgePercent}
          tone="teal"
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {groups.map((group) => {
          return (
            <div
              key={group.id}
              className="surface-card flex flex-col justify-between p-5 transition-all duration-200 hover:shadow-elevated"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">{group.name}</h3>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {group.discountPercent}% discount
                    </span>
                    {!group.active && (
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                    {group.description || "No description provided."}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Created {formatDate(group.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => setAssignTarget(group)}>
                    Assign customers
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Edit group"
                    title="Edit group"
                    onClick={() => {
                      setErrors({});
                      setEditing({
                        id: group.id,
                        name: group.name,
                        discountPercent: group.discountPercent,
                        description: group.description || "",
                        active: group.active,
                      });
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  {!group.isDefault && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Toggle active"
                        title={group.active ? "Deactivate group" : "Activate group"}
                        onClick={async () => {
                          try {
                            await toggleGroupActive(group.id);
                            toast.success(`Group ${group.active ? "deactivated" : "activated"}`);
                          } catch (err: any) {
                            toast.error(err.message || "Failed to toggle group");
                          }
                        }}
                      >
                        <Power className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Delete group"
                        title="Delete group"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeletingGroup(group)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
                {[
                  ["Customers", formatNumber(group.customersCount ?? 0)],
                  ["Transactions", formatNumber(group.transactionsCount ?? 0)],
                  ["Discount generated", formatCurrency(group.discountGenerated ?? 0)],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">{l}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / edit */}
      <Dialog
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null);
            setErrors({});
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>{editing.id ? "Edit group" : "Create discount group"}</DialogTitle>
                <DialogDescription>
                  The discount percentage applies automatically to every scan for this group.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="g-name">
                    Group name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="g-name"
                    value={editing.name}
                    onChange={(e) => {
                      setEditing({ ...editing, name: e.target.value });
                      if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    placeholder="e.g. Neighbours"
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="g-pct">
                    Discount percentage <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="g-pct"
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={editing.discountPercent}
                    onChange={(e) => {
                      setEditing({ ...editing, discountPercent: e.target.value });
                      if (errors.discountPercent) setErrors((prev) => ({ ...prev, discountPercent: "" }));
                    }}
                    className={errors.discountPercent ? "border-destructive" : ""}
                  />
                  {errors.discountPercent && (
                    <p className="mt-1 text-xs text-destructive">{errors.discountPercent}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="g-desc">Description</Label>
                  <Textarea
                    id="g-desc"
                    value={editing.description}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    placeholder="Who belongs in this group?"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setErrors({});
                  }}
                >
                  Cancel
                </Button>
                <Button disabled={isSaving} onClick={submit}>
                  {isSaving ? "Saving..." : editing.id ? "Save changes" : "Create group"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign customers */}
      <Dialog open={!!assignTarget} onOpenChange={(o) => !o && setAssignTarget(null)}>
        <DialogContent className="sm:max-w-md">
          {assignTarget && (
            <>
              <DialogHeader>
                <DialogTitle>Assign customer to {assignTarget.name}</DialogTitle>
                <DialogDescription>
                  Unassigned customers are listed first — they are waiting for a group.
                </DialogDescription>
              </DialogHeader>
              <Select value={assignCustomer} onValueChange={setAssignCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {[...customers]
                    .filter((c) => c.groupId !== assignTarget.id)
                    .sort((a, b) =>
                      a.groupId === DEFAULT_GROUP_ID ? -1 : b.groupId === DEFAULT_GROUP_ID ? 1 : 0,
                    )
                    .slice(0, 60)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} · {c.phone}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAssignTarget(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={!assignCustomer}
                  onClick={async () => {
                    try {
                      await assignCustomerGroup(assignCustomer, assignTarget.id);
                      toast.success("Customer assigned", { description: assignTarget.name });
                      setAssignCustomer("");
                      setAssignTarget(null);
                    } catch (err: any) {
                      toast.error("Failed to assign customer", { description: err.message });
                    }
                  }}
                >
                  Assign
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation modal */}
      <AlertDialog open={!!deletingGroup} onOpenChange={(o) => !o && setDeletingGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will safely remove the discount group{" "}
              <span className="font-semibold text-foreground">"{deletingGroup?.name}"</span>.
              Any assigned customers ({deletingGroup?.customersCount ?? 0}) will automatically be moved to Default / Unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={async (e) => {
                e.preventDefault();
                if (deletingGroup) {
                  setIsDeleting(true);
                  try {
                    await deleteGroup(deletingGroup.id);
                    toast.success("Group deleted successfully", {
                      description: `${deletingGroup.name} customers moved to Default / Unassigned.`,
                    });
                    setDeletingGroup(null);
                  } catch (err: any) {
                    toast.error(err.message || "Failed to delete group");
                  } finally {
                    setIsDeleting(false);
                  }
                }
              }}
            >
              {isDeleting ? "Deleting..." : "Delete group"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
