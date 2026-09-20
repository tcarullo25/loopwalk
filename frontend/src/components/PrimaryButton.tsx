import type { ButtonHTMLAttributes, ReactNode } from 'react'

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  icon?: ReactNode
}

/**
 * The big pill. Lifts a little on hover, presses in on click — the whole
 * personality of the app lives in this one interaction.
 */
export default function PrimaryButton({
  children,
  icon,
  className = '',
  ...rest
}: PrimaryButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={`group flex w-full items-center justify-center gap-2.5 rounded-full bg-sage-500 px-6 py-4 text-lg font-extrabold text-white shadow-sage transition-all duration-200 hover:-translate-y-0.5 hover:bg-sage-600 hover:shadow-lift active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sage-500 ${className}`}
    >
      {icon}
      {children}
    </button>
  )
}
