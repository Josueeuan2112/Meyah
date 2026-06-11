import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/shared/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap outline-none transition-[transform,box-shadow,background-color,color] duration-200 ease-[cubic-bezier(.2,.7,.3,1)] focus-visible:ring-[3px] focus-visible:ring-meyah-jade-500/40 active:translate-y-px active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-meyah-terracota-500/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-meyah-jade-500 text-white shadow-[0_6px_16px_-6px_rgba(27,153,139,0.5)] hover:bg-meyah-jade-700 hover:-translate-y-px hover:shadow-[0_10px_22px_-8px_rgba(27,153,139,0.55)]",
        destructive:
          "bg-meyah-terracota-50 text-meyah-terracota-700 hover:bg-meyah-terracota-500 hover:text-white",
        outline:
          "border border-meyah-border bg-white text-meyah-tinta-900 shadow-xs hover:bg-meyah-crema-50 hover:border-meyah-tinta-400 hover:-translate-y-px",
        secondary:
          "bg-meyah-crema-100 text-meyah-tinta-900 hover:bg-meyah-crema-200",
        ghost:
          "bg-transparent text-meyah-tinta-600 hover:bg-meyah-crema-100 hover:text-meyah-jade-900",
        link: "text-meyah-jade-700 underline-offset-4 hover:underline",
      },
      size: {
        default: "px-[22px] py-[13px] text-[15px] has-[>svg]:px-[18px]",
        xs: "gap-1 px-2.5 py-1 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "gap-1.5 px-[15px] py-[9px] text-[13.5px] has-[>svg]:px-3",
        lg: "px-[26px] py-[15px] text-[16px] has-[>svg]:px-5",
        icon: "size-11",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
