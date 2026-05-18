import { BsBanFill } from "react-icons/bs"

import { Badge } from "@/components/ui/badge"

const BadgeError = () => {
  return (
    <Badge
      variant="outline"
      className="rounded-sm border-destructive bg-destructive/10 text-destructive"
    >
      <BsBanFill className="size-3" />
      Error
    </Badge>
  )
}

export default BadgeError
