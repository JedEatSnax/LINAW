"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRightIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  Clock3Icon,
  FilePlus2Icon,
  FilterIcon,
  MoreHorizontalIcon,
  PackageCheckIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  WalletCardsIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  fetchDashboardData,
  type DashboardData,
  type DashboardTransaction,
} from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/currencies";
import { useAuthState } from "@/components/auth-state-provider";

const toneClasses: Record<string, string> = {
  blue: "ring-1 ring-blue-100 dark:ring-blue-700/50",
  amber: "ring-1 ring-amber-100 dark:ring-amber-700/50",
  violet: "ring-1 ring-violet-100 dark:ring-violet-700/50",
  green: "ring-1 ring-emerald-100 dark:ring-emerald-700/50",
  slate: "ring-1 ring-slate-200 dark:ring-slate-700/50",
};

function formatAmount(transaction: DashboardTransaction): string {
  if (transaction.amount === null || !transaction.currency)
    return "Unavailable";

  return formatCurrency(transaction.amount, transaction.currency);
}

function formatDate(value: string | null): string {
  if (!value) return "Unavailable";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function transactionTone(category: DashboardTransaction["category"]): string {
  return category === "Purchase order"
    ? (toneClasses["green"] ?? "")
    : category === "RFQ"
      ? (toneClasses["violet"] ?? "")
      : (toneClasses["blue"] ?? "");
}

export default function Page() {
  const { transitionRevision } = useAuthState();
  const [filter, setFilter] = useState("All activity");
  const [search, setSearch] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const controller = new AbortController();
    setDashboard(null);
    setLoading(true);
    setRequestError(false);
    setCurrentDate(new Date());

    fetchDashboardData(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        if (result.authFailed) {
          window.location.assign("/login");
          return;
        }

        setDashboard(result);
        setRequestError(result.errors.length > 0);
      })
      .catch(() => setRequestError(true))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [transitionRevision]);

  const transactions = useMemo(
    () =>
      [
        ...(dashboard?.requisitions ?? []),
        ...(dashboard?.rfqs ?? []),
        ...(dashboard?.purchaseOrders ?? []),
      ]
        .sort((left, right) => {
          if (!left.updatedAt) return 1;
          if (!right.updatedAt) return -1;
          return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
        })
        .filter((transaction) => {
          const matchesFilter =
            filter === "All activity" ||
            (filter === "Pending" && transaction.status === "PENDING") ||
            (filter === "Published" && transaction.status === "PUBLISHED") ||
            (filter === "ORDERED" && transaction.status === "ORDERED") ||
            transaction.status === filter;
          const query = search.trim().toLowerCase();
          const matchesSearch =
            !query ||
            [
              transaction.id,
              transaction.title,
              transaction.requester,
              transaction.status,
            ]
              .join(" ")
              .toLowerCase()
              .includes(query);
          return matchesFilter && matchesSearch;
        }),
    [dashboard, filter, search],
  );

  const userName = [dashboard?.profile?.firstName, dashboard?.profile?.lastName]
    .filter(Boolean)
    .join(" ");
  const stats = [
    {
      label: "Purchase requisitions",
      value: dashboard?.requisitionTotal ?? dashboard?.requisitions.length ?? 0,
      change: "Live",
      note: "authorized records",
      icon: FilePlus2Icon,
      tone: "blue",
    },
    {
      label: "Pending approvals",
      value: dashboard?.approvalTotal ?? dashboard?.approvals.length ?? 0,
      change: "Live",
      note: "assigned to you",
      icon: Clock3Icon,
      tone: "amber",
    },
    {
      label: "Active RFQs",
      value: dashboard?.rfqTotal ?? dashboard?.rfqs.length ?? 0,
      change: "Live",
      note: "published RFQs",
      icon: SendIcon,
      tone: "violet",
    },
    {
      label: "Open commitments",
      value: "Unavailable",
      change: "N/A",
      note: "no budget API available",
      icon: WalletCardsIcon,
      tone: "green",
    },
  ];

  return (
    <main className="min-h-[calc(100svh-var(--header-height))] flex-1 ">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-7 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        {requestError && (
          <div className="rounded-lg border border-amber-200 px-4 py-3 text-sm">
            Some dashboard sections could not be loaded. Displayed values may be
            partial.
          </div>
        )}
        <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] ">
              {currentDate?.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              }) ?? ""}
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              {currentDate
                ? currentDate.getHours() < 12
                  ? "Good morning"
                  : currentDate.getHours() < 18
                    ? "Good afternoon"
                    : "Good evening"
                : "Welcome"}
              {userName ? `, ${userName}` : ""}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6">
              Here&apos;s what&apos;s happening across{" "}
              {dashboard?.companyName ?? "your procurement workspace"}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="shadow-sm"
              disabled
              title="Date-range filtering is not supported by the procurement APIs."
            >
              <CalendarDaysIcon className="size-4" />
              This month
            </Button>
            <Button
              className="shadow-[0_6px_16px_rgba(28,99,242,0.2)]"
              onClick={() => window.location.assign("/purchase-requisitions")}
            >
              <PlusIcon className="size-4" />
              New requisition
            </Button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex size-9 items-center justify-center rounded-lg ring-1 ${toneClasses[stat.tone]}`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <span className="rounded-full px-2 py-1 text-[11px] font-semibold">
                    {stat.change}
                  </span>
                </div>
                <p className="mt-5 text-2xl font-semibold tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-medium">{stat.label}</p>
                <p className="mt-3 text-[11px]">{stat.note}</p>
              </div>
            );
          })}
        </section>

        <section className="rounded-xl border border-slate-200/80 px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:px-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Procurement pipeline</p>
              <p className="mt-1 text-xs">
                Track activity from request to purchase order.
              </p>
            </div>
            <Link
              href="/purchase-requisitions"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold sm:mt-0"
            >
              View all activity <ArrowUpRightIcon className="size-3.5" />
            </Link>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-5">
            {[
              [
                "Requisitions",
                dashboard?.requisitionTotal ??
                  dashboard?.requisitions.length ??
                  0,
              ],
              [
                "Approvals",
                dashboard?.approvalTotal ?? dashboard?.approvals.length ?? 0,
              ],
              ["RFQs", dashboard?.rfqTotal ?? dashboard?.rfqs.length ?? 0],
              ["Quotations", dashboard?.quotationTotal ?? 0],
              [
                "Purchase orders",
                dashboard?.purchaseOrderTotal ??
                  dashboard?.purchaseOrders.length ??
                  0,
              ],
            ].map(([label, value], index) => (
              <div
                key={label}
                className="relative flex items-center gap-3 rounded-lg px-3 py-3 md:block md:px-0 md:py-0"
                onClick={
                  label === "Quotations"
                    ? () => window.location.assign("/quotations")
                    : undefined
                }
                onKeyDown={
                  label === "Quotations"
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ")
                          window.location.assign("/quotations");
                      }
                    : undefined
                }
                role={label === "Quotations" ? "link" : undefined}
                tabIndex={label === "Quotations" ? 0 : undefined}
              >
                <div className="flex items-center gap-2 md:mb-3">
                  <span className="text-xs font-medium">{label}</span>
                </div>
                <p className="text-xl font-semibold md:pl-4">{value}</p>
                {index < 4 && (
                  <ChevronRightIcon className="absolute right-2 top-1/2 hidden size-4 -translate-y-1/2 md:block" />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.45fr_0.8fr]">
          <div className="min-w-0 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-sm font-semibold">Recent transactions</p>
                <p className="mt-1 text-xs">
                  The latest changes across your workspace.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative hidden sm:block">
                  <SearchIcon className="absolute left-2.5 top-2 size-3.5" />
                  <input
                    aria-label="Search transactions"
                    placeholder="Search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-8 w-32 rounded-md border border-slate-200 pl-8 pr-2 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-slate-200 text-xs"
                >
                  <FilterIcon className="size-3.5" />
                  Filter
                </Button>
              </div>
            </div>
            <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-5 pt-3 sm:px-6">
              {["All activity", "Pending", "Published", "ORDERED"].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    className="whitespace-nowrap border-b-2 px-1 pb-3 text-xs font-medium transition-colors"
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-170 text-left text-sm">
                <thead className="text-[11px] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 font-semibold sm:px-6">
                      Reference
                    </th>
                    <th className="px-3 py-3 font-semibold">Requester</th>
                    <th className="px-3 py-3 font-semibold">Amount</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Updated</th>
                    <th className="px-5 py-3 sm:px-6" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-10 text-center text-sm"
                      >
                        Loading transactions...
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        onClick={() =>
                          setSelectedTransaction(
                            selectedTransaction === transaction.id
                              ? null
                              : transaction.id,
                          )
                        }
                        className="cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-4 sm:px-6">
                          <div className="font-semibold">{transaction.id}</div>
                          <div className="mt-1 max-w-47.5 truncate text-xs">
                            {transaction.title}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-xs">
                          {transaction.requester}
                        </td>
                        <td className="px-3 py-4 text-xs font-semibold">
                          {formatAmount(transaction)}
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${transactionTone(transaction.category)}`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-xs">
                          {formatDate(transaction.updatedAt)}
                        </td>
                        <td className="px-5 py-4 text-right sm:px-6">
                          <MoreHorizontalIcon className="ml-auto size-4" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {!loading && transactions.length === 0 && (
                <div className="px-6 py-10 text-center text-sm">
                  No transactions match this filter.
                </div>
              )}
            </div>
            {selectedTransaction && (
              <div className="flex items-center justify-between border-t border-blue-100 px-5 py-3 text-xs sm:px-6">
                <span>
                  Selected <strong>{selectedTransaction}</strong>. Open the
                  module for full details.
                </span>
                <Link
                  href={
                    transactions.find((item) => item.id === selectedTransaction)
                      ?.href ?? "/purchase-requisitions"
                  }
                  className="font-semibold"
                >
                  View record{" "}
                  <ArrowUpRightIcon className="ml-1 inline size-3" />
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <p className="text-sm font-semibold">Needs your review</p>
                <p className="mt-1 text-xs">Approvals waiting in your queue.</p>
              </div>
              <span className="flex size-7 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-amber-50 dark:ring-amber-700/50">
                {dashboard?.approvals.length ?? 0}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="px-5 py-10 text-center text-sm">
                  Loading approvals...
                </div>
              ) : (
                dashboard?.approvals.map((approval) => (
                  <div key={approval.id} className="px-5 py-4 sm:px-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {approval.title}
                        </p>
                        <p className="mt-1 text-xs">
                          {approval.reference} · {approval.requester}
                        </p>
                      </div>
                      <button
                        aria-label={`More actions for ${approval.id}`}
                        className=""
                      >
                        <MoreHorizontalIcon className="size-4" />
                      </button>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        {approval.amount === null
                          ? "Unavailable"
                          : `${approval.amount} ${approval.currency ?? ""}`}
                      </span>
                      <span className="text-[11px]">
                        {formatDate(approval.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {!loading && dashboard?.approvals.length === 0 && (
                <div className="px-5 py-10 text-center text-sm">
                  No approvals require your action.
                </div>
              )}
            </div>
            <Link
              href="/approval-workflows"
              className="flex items-center justify-center gap-1 border-t border-slate-100 px-5 py-4 text-xs font-semibold"
            >
              Review all approvals <ChevronRightIcon className="size-3.5" />
            </Link>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-xl border border-slate-200/80 p-6 shadow-[0_10px_28px_rgba(19,34,56,0.12)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">Spend overview</p>
                <p className="mt-1 text-xs">
                  Budget and authoritative commitment data are not available.
                </p>
              </div>
              <WalletCardsIcon className="size-5" />
            </div>
            <div className="mt-7 flex items-end gap-3">
              <span className="text-3xl font-semibold tracking-tight">
                Unavailable
              </span>
              <span className="mb-1 rounded-full px-2 py-1 text-[11px] font-semibold">
                N/A
              </span>
            </div>
            <p className="mt-5 text-xs">
              No financial reporting endpoint is implemented for this workspace.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/80 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">Quick actions</p>
                <p className="mt-1 text-xs">
                  Start the next step in your workflow.
                </p>
              </div>
              <CheckCircle2Icon className="size-5" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Link
                href="/purchase-requisitions"
                className="group rounded-lg border border-slate-200 p-3 transition-colors"
              >
                <FilePlus2Icon className="size-4 text-[#1c63f2]" />
                <p className="mt-3 text-xs font-semibold">New requisition</p>
                <p className="mt-1 text-[11px]">Request goods or services</p>
              </Link>
              <Link
                href="/approval-workflows"
                className="group rounded-lg border border-slate-200 p-3 transition-colors"
              >
                <PackageCheckIcon className="size-4 text-[#1c63f2]" />
                <p className="mt-3 text-xs font-semibold">Review approvals</p>
                <p className="mt-1 text-[11px]">
                  {dashboard?.approvals.length ?? 0} items need review
                </p>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
