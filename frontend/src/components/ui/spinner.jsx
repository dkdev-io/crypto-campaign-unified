import * as React from "react"
import { cn } from "../../lib/utils"

const Spinner = React.forwardRef(({ className, size = "default", ...props }, ref) => {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  }

  return (
    <div
      ref={ref}
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
})

Spinner.displayName = "Spinner"

const LoadingOverlay = React.forwardRef(({ className, message = "Loading...", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      <div className="flex flex-col items-center space-y-4">
        <Spinner size="lg" className="text-primary" />
        {message && (
          <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
        )}
      </div>
    </div>
  )
})

LoadingOverlay.displayName = "LoadingOverlay"

const InlineLoader = React.forwardRef(({ className, text = "Loading", showSpinner = true, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn("inline-flex items-center gap-2", className)}
      {...props}
    >
      {showSpinner && <Spinner size="xs" />}
      <span className="text-sm">{text}</span>
    </span>
  )
})

InlineLoader.displayName = "InlineLoader"

export { Spinner, LoadingOverlay, InlineLoader }