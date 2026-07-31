'use client'

import { useAuthOverlayStore } from '../auth-overlay.store'
import { AuthModal } from './auth-modal'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'
import { ResetPasswordForm } from './reset-password-form'

export function AuthOverlay() {
  const view = useAuthOverlayStore((state) => state.view)
  const close = useAuthOverlayStore((state) => state.close)

  if (!view) {
    return null
  }

  return (
    <AuthModal onClose={close}>
      {view === 'login' && <LoginForm onAuthenticated={close} />}
      {view === 'register' && <RegisterForm onAuthenticated={close} />}
      {view === 'reset-password' && <ResetPasswordForm />}
    </AuthModal>
  )
}
