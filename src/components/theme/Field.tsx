import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "./Typography"

const inputClass =
    "w-full border border-m-line/25 bg-m-bg/60 px-3 py-2 font-m-mono text-sm text-m-fg placeholder:text-m-muted focus:border-m-accent focus:outline-none"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => <input ref={ref} className={cn(inputClass, "h-10", className)} {...props} />,
)
Input.displayName = "Input"

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => <textarea ref={ref} className={cn(inputClass, "min-h-28", className)} {...props} />,
)
Textarea.displayName = "Textarea"

type FieldProps = {
    label: React.ReactNode
    htmlFor?: string
    error?: string
    children: React.ReactNode
    className?: string
}

// Label, control, and error line for a form input.
export const Field = ({ label, htmlFor, error, children, className }: FieldProps) => (
    <div className={cn("flex w-full flex-col gap-2", className)}>
        <label htmlFor={htmlFor} className="m-0 text-base">
            <Label tone="fg">{label}</Label>
        </label>
        {children}
        {error && <Label className="text-m-pink">{"! "}{error}</Label>}
    </div>
)
