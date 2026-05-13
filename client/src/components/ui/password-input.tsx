"use client"

import { useState, type ComponentProps } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type PasswordInputProps = Omit<ComponentProps<"input">, "type">

export const PasswordInput = ({ className, ...props }: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false)

  const type = showPassword ? "text" : "password"
  const Icon = showPassword ? EyeOffIcon : EyeIcon

  const handleToggle = () => {
    setShowPassword((prev) => !prev)
  }

  return (
    <div className="relative">
      <Input type={type} className={cn("pe-9", className)} {...props} />

      <button
        type="button"
        className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
        onClick={handleToggle}
      >
        <Icon className="size-4 stroke-muted-foreground" />
      </button>
    </div>
  )
}
