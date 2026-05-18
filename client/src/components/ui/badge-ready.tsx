import { Badge } from "@/components/ui/badge"
import { GoCheckCircleFill } from "react-icons/go"

const BadgeReady = () => {
  return (
    <Badge
      variant="outline"
      className="rounded-sm border-green-600 bg-green-600/10 text-green-600 dark:border-green-400 dark:bg-green-400/10 dark:text-green-400"
    >
      <GoCheckCircleFill className="size-3" />
      Ready
    </Badge>
  )
}

export default BadgeReady
