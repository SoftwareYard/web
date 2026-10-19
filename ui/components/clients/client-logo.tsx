import Image from "next/image"
import { cn } from "@/lib/utils"

interface ClientLogoProps {
  src: string
  alt: string
  // Light/white logos get a dark plate so they're visible on light backgrounds
  onDark: boolean
  className?: string
  align?: "center" | "left"
}

export function ClientLogo({ src, alt, onDark, className, align = "center" }: ClientLogoProps) {
  return (
    <span
      className={cn(
        "relative block",
        onDark && "bg-zinc-900 rounded-lg ring-1 ring-white/10",
        className
      )}
    >
      <span className={cn("absolute", onDark ? "inset-[12%]" : "inset-0")}>
        <span className="relative block w-full h-full">
          <Image
            src={src}
            alt={alt}
            fill
            className={cn("object-contain", align === "left" && !onDark && "object-left")}
          />
        </span>
      </span>
    </span>
  )
}
