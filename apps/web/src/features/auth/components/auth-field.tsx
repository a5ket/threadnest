import { InputHTMLAttributes, ReactNode } from 'react'
import { UseFormRegisterReturn } from 'react-hook-form'

interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string
  label: string
  error?: string
  registration: UseFormRegisterReturn
  trailing?: ReactNode
}

export function AuthField({ id, label, error, registration, trailing, ...inputProps }: AuthFieldProps) {
  return (
    <div className='flex flex-col gap-1.5'>
      <div className='flex items-center justify-between gap-2'>
        <label htmlFor={id} className='text-sm font-medium'>
          {label}
        </label>

        {trailing}
      </div>

      <input
        id={id}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-destructive'
        {...registration}
        {...inputProps}
      />

      {error && (
        <p id={`${id}-error`} role='alert' className='text-sm text-destructive'>
          {error}
        </p>
      )}
    </div>
  )
}
