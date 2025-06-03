// SettingsModals.jsx
import { useRef, useEffect, useState, memo } from "react";
import { CurrentPasswordModal } from "@/components/settings/current-password-modal.jsx";
import NewPasswordModal from "@/components/settings/new-password-modal.jsx";
import { DeleteAccountModal } from "@/components/settings/delete-account-modal.jsx";
import { EmailSentModal } from "@/components/settings/email-sent-modal.jsx";

export const SettingsModals = memo(function SettingsModals({
  showCurrentPasswordModal,
  setShowCurrentPasswordModal,
  currentPassword,
  setCurrentPassword,
  showCurrentPassword,
  setShowCurrentPassword,
  handleProceedCurrentPassword,
  showNewPasswordModal,
  setShowNewPasswordModal,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  handlePasswordChange,
  passwordErrors,
  showRequirements,
  isPasswordValid,
  showDeleteModal,
  setShowDeleteModal,
  deleteConfirmText,
  setDeleteConfirmText,
  handleSendDeleteConfirmation,
  isDeletionEmailSent,
  showDeletionEmailSentModal,
  setShowDeletionEmailSentModal,
  logout,
  errorMessage,
  user
}) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const currentPasswordRef = useRef(null);
  const newPasswordRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = (e) => setIsDarkMode(e.matches);
    applyTheme(mediaQuery);

    // Use event listener properly
    const handler = (e) => applyTheme(e);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (showCurrentPasswordModal && currentPasswordRef.current) {
      currentPasswordRef.current.focus();
    }
  }, [showCurrentPasswordModal]);

  useEffect(() => {
    if (showNewPasswordModal && newPasswordRef.current) {
      newPasswordRef.current.focus();
    }
  }, [showNewPasswordModal]);

  return (
    <>
      <CurrentPasswordModal
        open={showCurrentPasswordModal}
        onOpenChange={setShowCurrentPasswordModal}
        currentPassword={currentPassword}
        setCurrentPassword={setCurrentPassword}
        showCurrentPassword={showCurrentPassword}
        setShowCurrentPassword={setShowCurrentPassword}
        handleProceedCurrentPassword={handleProceedCurrentPassword}
        errorMessage={errorMessage}
        inputRef={currentPasswordRef}
      />

      <NewPasswordModal
        open={showNewPasswordModal}
        onOpenChange={setShowNewPasswordModal}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        showNewPassword={showNewPassword}
        setShowNewPassword={setShowNewPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        handlePasswordChange={handlePasswordChange}
        passwordErrors={passwordErrors}
        showRequirements={showRequirements}
        isPasswordValid={isPasswordValid}
        inputRef={newPasswordRef}
      />

      <DeleteAccountModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        deleteConfirmText={deleteConfirmText}
        setDeleteConfirmText={setDeleteConfirmText}
        handleSendDeleteConfirmation={handleSendDeleteConfirmation}
        isDeletionEmailSent={isDeletionEmailSent}
        errorMessage={errorMessage}
        user={user}
      />

      <EmailSentModal
        open={showDeletionEmailSentModal}
        onOpenChange={setShowDeletionEmailSentModal}
        user={user}
      />
    </>
  );
});