import { useRef, useEffect, useState, memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PasswordRequirements } from "@/components/password/password-requirements";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  Eye,
  EyeOff,
  AlertTriangle,
  Trash2,
  X,
  Bell,
  Mail
} from "lucide-react";
const PasswordInput = memo(function PasswordInput({
  id,
  label,
  value,
  onChange,
  showPassword,
  setShowPassword,
  placeholder,
  inputRef,
  onKeyDown
}) {
  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          className="dark:bg-neutral-800 dark:border-neutral-700"
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-2 top-2/4 -translate-y-1/2"
          onClick={() => setShowPassword(!showPassword)}
          type="button"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </Button>
      </div>
    </div>
  );
});

const CurrentPasswordModal = memo(function CurrentPasswordModal({
  open,
  onOpenChange,
  currentPassword,
  setCurrentPassword,
  showCurrentPassword,
  setShowCurrentPassword,
  handleProceedCurrentPassword,
  errorMessage,
  inputRef
}) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleProceedCurrentPassword();
    }
  }, [handleProceedCurrentPassword]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle>Verify Your Identity</DialogTitle>
          <DialogDescription>
            Please enter your current password to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <PasswordInput
            id="current-password"
            label="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            showPassword={showCurrentPassword}
            setShowPassword={setShowCurrentPassword}
            placeholder="Enter your current password"
            inputRef={inputRef}
            onKeyDown={handleKeyDown}
          />
          {errorMessage && (
            <p className="text-sm text-destructive flex items-center gap-1 mt-1">
              <AlertTriangle size={14} className="text-destructive" />
              <span>{errorMessage}</span>
            </p>
          )}
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleProceedCurrentPassword}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

const NewPasswordModal = memo(function NewPasswordModal({
  open,
  onOpenChange,
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
  setShowRequirements,
  isPasswordValid,
  inputRef
}) {
  const handleNewPasswordChange = useCallback((e) => {
    setNewPassword(e.target.value);
    if (!showRequirements) setShowRequirements(true);
  }, [setNewPassword, showRequirements, setShowRequirements]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle>Set New Password</DialogTitle>
          <DialogDescription>
            Create a strong, unique password to protect your account.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <PasswordInput
            id="new-password"
            label="New Password"
            value={newPassword}
            onChange={handleNewPasswordChange}
            showPassword={showNewPassword}
            setShowPassword={setShowNewPassword}
            placeholder="Enter new password"
            inputRef={inputRef}
          />

          <PasswordInput
            id="confirm-password"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            showPassword={showConfirmPassword}
            setShowPassword={setShowConfirmPassword}
            placeholder="Confirm new password"
          />
          
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-sm text-destructive flex items-center gap-1 mt-1">
              <X size={14} className="text-destructive" />
              <span>Passwords do not match</span>
            </p>
          )}

          <PasswordRequirements passwordErrors={passwordErrors} showRequirements={showRequirements} />
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handlePasswordChange}
            disabled={!isPasswordValid || newPassword !== confirmPassword}
          >
            Save Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

const DeleteAccountModal = memo(function DeleteAccountModal({
  open,
  onOpenChange,
  deleteConfirmText,
  setDeleteConfirmText,
  handleSendDeleteConfirmation,
  isDeletionEmailSent,
  errorMessage,
  user
}) {
  const handleOpenChange = useCallback((isOpen) => {
    if (!isOpen) {
      setDeleteConfirmText("");
    }
    onOpenChange(isOpen);
  }, [onOpenChange, setDeleteConfirmText]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto dark:bg-neutral-900">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-destructive mb-2">
            <Trash2 size={18} />
            Delete Account
          </DialogTitle>
          <DialogDescription className="text-sm">
            This action cannot be undone. To proceed, we'll send a confirmation email to your address.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <div className="rounded-md border border-red-300 dark:border-red-900 overflow-hidden">
            <div className="bg-red-500 py-2 px-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive-foreground" />
                <h4 className="font-semibold text-destructive-foreground">WARNING</h4>
              </div>
            </div>
            <div className="bg-destructive/10 p-3 dark:bg-red-900/20">
              <div className="space-y-2">
                <p className="font-medium text-destructive dark:text-red-300 text-sm">You are requesting to delete your account!</p>
                <ul className="space-y-1 text-xs">
                  <li className="flex items-start gap-2">
                    <div className="min-w-3 h-3 rounded-full bg-destructive flex items-center justify-center mt-0.5">
                      <span className="text-destructive-foreground text-[10px] font-bold">!</span>
                    </div>
                    <span className="text-destructive-foreground/80 dark:text-red-200/80">All your data will be permanently erased</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-3 h-3 rounded-full bg-destructive flex items-center justify-center mt-0.5">
                      <span className="text-destructive-foreground text-[10px] font-bold">!</span>
                    </div>
                    <span className="text-destructive-foreground/80 dark:text-red-200/80">Your exam history and results will be lost</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-3 h-3 rounded-full bg-destructive flex items-center justify-center mt-0.5">
                      <span className="text-destructive-foreground text-[10px] font-bold">!</span>
                    </div>
                    <span className="text-destructive-foreground/80 dark:text-red-200/80">Your account settings and personal information will be removed</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-2 pb-2">
          <Card className="mb-3 dark:bg-neutral-800 dark:border-neutral-700">
            <CardContent className="p-3 pt-3">
              <div className="flex items-center text-center gap-2">
                <div className="p-2 rounded-full bg-secondary dark:bg-neutral-700">
                  <Bell className="h-5 w-5 text-secondary-foreground dark:text-neutral-200" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Email Confirmation Required</p>
                  <p className="text-xs text-muted-foreground">
                    We'll send a confirmation email to <span className="font-semibold">{user?.email}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Label htmlFor="confirm-delete" className="text-xs font-medium mb-2 block">Type "DELETE" to confirm</Label>
          <Input
            id="confirm-delete"
            placeholder="DELETE"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            className={cn(
              "dark:bg-neutral-800 dark:border-neutral-700",
              deleteConfirmText === "DELETE" && "border-destructive dark:border-red-500"
            )}
          />
          {errorMessage && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertTriangle size={12} className="text-destructive" />
              <span>{errorMessage}</span>
            </p>
          )}
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="sm:w-auto w-full dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-700"
            size="sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSendDeleteConfirmation}
            variant="destructive"
            className="sm:w-auto w-full"
            disabled={deleteConfirmText !== "DELETE" || isDeletionEmailSent}
            size="sm"
          >
            {isDeletionEmailSent ? (
              <div className="flex items-center gap-1">
                <span className="animate-spin">⟳</span>
                <span>Sending...</span>
              </div>
            ) : (
              "Send Confirmation Email"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

const EmailSentModal = memo(function EmailSentModal({
  open,
  onOpenChange,
  user
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto dark:bg-neutral-900">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle size={20} className="text-neutral-950 dark:text-neutral-50" />
            Account Deletion Initiated
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Card className="dark:bg-neutral-800 dark:border-neutral-700">
            <CardContent className="p-3 pt-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-primary/10 dark:bg-primary/20">
                  <Mail className="h-5 w-5 text-primary dark:text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Confirmation email sent to:</p>
                  <p className="font-semibold text-xs">{user?.email || "your email address"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Please check your inbox and click the confirmation link. The link will expire in 30 minutes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground"
            size="sm"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

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
  setShowRequirements,
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
    const applyTheme = (e) => {
      setIsDarkMode(e.matches);
    };
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
        setShowRequirements={setShowRequirements}
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