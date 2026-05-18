import { Badge } from "@/components/ui/badge"
import { MdError } from "react-icons/md"

const BadgePending = () => {
  return (
    <Badge
      variant="outline"
      className="rounded-sm border-sky-600 bg-sky-600/10 text-sky-600 dark:border-sky-400 dark:bg-sky-400/10 dark:text-sky-400 [a&]:hover:bg-sky-600/10"
    >
      <MdError className="size-3" />
      Pending
    </Badge>
  )
}

export default BadgePending
