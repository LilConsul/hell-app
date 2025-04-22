import { useState } from "react"
import { LoginModal } from "@/components/login-modal"
import { RegisterModal } from "@/components/register-modal"
import { ForgotPasswordModal } from "@/components/forgot-password-modal"

export function AuthModals() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)

  if (typeof window !== "undefined") {
    window.openLoginModal = () => setShowLoginModal(true)
    window.openRegisterModal = () => setShowRegisterModal(true)
    window.openForgotPasswordModal = () => setShowForgotPasswordModal(true)
  }

  return (
    <>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onRegisterClick={() => {
          setShowLoginModal(false)
          setShowRegisterModal(true)
        }}
        onForgotPasswordClick={() => {
          setShowLoginModal(false)
          setShowForgotPasswordModal(true)
        }}
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onLoginClick={() => {
          setShowRegisterModal(false)
          setShowLoginModal(true)
        }}
      />
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        onBackToLogin={() => {
          setShowForgotPasswordModal(false)
          setShowLoginModal(true)
        }}
      />
    </>
  )
}
