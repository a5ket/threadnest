import { ChangeEmailForm } from '@/features/me/components/change-email-form'
import { ChangePasswordForm } from '@/features/me/components/change-password-form'

export default function AccountSecurityPage() {
  return (
    <div className='flex flex-col gap-8'>
      <h1 className='text-lg font-semibold'>Account security</h1>

      <div className='flex flex-col gap-3'>
        <h2 className='text-sm font-semibold'>Change password</h2>
        <ChangePasswordForm />
      </div>

      <div className='flex flex-col gap-3'>
        <h2 className='text-sm font-semibold'>Change email</h2>
        <ChangeEmailForm />
      </div>
    </div>
  )
}
