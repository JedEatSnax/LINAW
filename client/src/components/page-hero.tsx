import type { ReactNode } from "react"

interface PageHeroProps {
  title: string
  description: string
  actions?: ReactNode
}

export function PageHero({ title, description, actions }: PageHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.14),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.12),transparent_35%)]" />
      <div className="relative flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-xl text-sm text-white/72 sm:text-base">
            {description}
          </p>
        </div>

        {actions ? (
          <div className="flex flex-wrap gap-3">{actions}</div>
        ) : null}
      </div>
    </div>
  )
}
