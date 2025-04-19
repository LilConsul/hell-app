"use client"

import { useState } from "react"
import { LoginModal } from "@/components/login-modal"
import { RegisterModal } from "@/components/register-modal"

export function AuthModals() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)

  if (typeof window !== "undefined") {
    window.openLoginModal = () => setShowLoginModal(true)
    window.openRegisterModal = () => setShowRegisterModal(true)
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
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onLoginClick={() => {
          setShowRegisterModal(false)
          setShowLoginModal(true)
        }}
      />
    </>
  )
}
