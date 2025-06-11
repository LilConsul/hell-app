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
  const currentPasswordRef = useRef(null);
  const newPasswordRef = useRef(null);

  const currentPasswordProps = {
    open: showCurrentPasswordModal,
    onOpenChange: setShowCurrentPasswordModal,
    currentPassword,
    setCurrentPassword,
    showCurrentPassword,
    setShowCurrentPassword,
    handleProceedCurrentPassword,
    errorMessage,
    inputRef: currentPasswordRef
  };

  const newPasswordProps = {
    open: showNewPasswordModal,
    onOpenChange: setShowNewPasswordModal,
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
    inputRef: newPasswordRef
  };

  const deleteAccountProps = {
    open: showDeleteModal,
    onOpenChange: setShowDeleteModal,
    deleteConfirmText,
    setDeleteConfirmText,
    handleSendDeleteConfirmation,
    isDeletionEmailSent,
    errorMessage,
    user
  };

  const emailSentProps = {
    open: showDeletionEmailSentModal,
    onOpenChange: setShowDeletionEmailSentModal,
    user
  };

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
      <CurrentPasswordModal {...currentPasswordProps} />
      <NewPasswordModal {...newPasswordProps} />
      <DeleteAccountModal {...deleteAccountProps} />
      <EmailSentModal {...emailSentProps} />
    </>
  );
});