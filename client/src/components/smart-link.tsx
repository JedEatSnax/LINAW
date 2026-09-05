import { Link, type LinkProps } from "react-router-dom"
import { preloadMap } from "@/routes.config"

export function SmartLink({ to, onMouseEnter, onFocus, ...props }: LinkProps) {
  const preload = () => {
    const target =
      typeof to === "string" ? to : `${to.pathname ?? ""}${to.search ?? ""}`

    if (target) {
      preloadMap
        .get(target)?.()
        .catch(() => undefined)
    }
  }

  return (
    <Link
      {...props}
      to={to}
      onMouseEnter={(event) => {
        preload()
        onMouseEnter?.(event)
      }}
      onFocus={(event) => {
        preload()
        onFocus?.(event)
      }}
    />
  )
}
