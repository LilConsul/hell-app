import { useRef, useEffect, useState } from "react";
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
import { PasswordRequirements } from "@/components/password/password-requirements";
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

export function SettingsModals({
  // Current Password Modal props
  showCurrentPasswordModal,
  setShowCurrentPasswordModal,
  currentPassword,
  setCurrentPassword,
  showCurrentPassword,
  setShowCurrentPassword,
  handleProceedCurrentPassword,
  
  // New Password Modal props
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
  
  // Password validation props
  passwordErrors,
  showRequirements,
  setShowRequirements,
  isPasswordValid,
  
  // Delete Account Modal props
  showDeleteModal,
  setShowDeleteModal,
  deleteConfirmText,
  setDeleteConfirmText,
  handleSendDeleteConfirmation,
  isDeletionEmailSent,
  
  // Email Sent Confirmation Modal props
  showDeletionEmailSentModal,
  setShowDeletionEmailSentModal,
  
  // Auth props
  logout,
  
  // General props
  errorMessage,
  user
}) {
  const currentPasswordRef = useRef(null);
  const newPasswordRef = useRef(null);
  // Add state to track dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Set up dark mode detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = (e) => {
      setIsDarkMode(e.matches);
    };
    applyTheme(mediaQuery);
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
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
      {/* Current Password Modal */}
      <Dialog open={showCurrentPasswordModal} onOpenChange={setShowCurrentPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Your Identity</DialogTitle>
            <DialogDescription>
              Please enter your current password to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input 
                  ref={currentPasswordRef} 
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"} 
                  placeholder="Enter your current password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-2 top-2/4 -translate-y-1/2" 
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              {errorMessage && (
                <p className="text-sm font-medium text-red-500 dark:text-red-400 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {errorMessage}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCurrentPasswordModal(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleProceedCurrentPassword}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Password Modal */}
      <Dialog open={showNewPasswordModal} onOpenChange={setShowNewPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set New Password</DialogTitle>
            <DialogDescription>
              Create a strong, unique password to protect your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input 
                  ref={newPasswordRef} 
                  id="new-password"
                  type={showNewPassword ? "text" : "password"} 
                  placeholder="Enter new password" 
                  value={newPassword} 
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (!showRequirements) setShowRequirements(true);
                  }} 
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-2 top-2/4 -translate-y-1/2" 
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input 
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Confirm new password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-2 top-2/4 -translate-y-1/2" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm font-medium text-red-500 dark:text-red-400 flex items-center gap-1">
                  <X size={14} />
                  Passwords do not match
                </p>
              )}
            </div>

            <PasswordRequirements passwordErrors={passwordErrors} showRequirements={showRequirements} />
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewPasswordModal(false)}
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
      
      {/* Delete Account Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700 dark:text-red-500 flex items-center gap-2">
              <Trash2 size={18} />
              Delete Account
            </DialogTitle>
            <DialogDescription className="pt-2">
              This action cannot be undone. To proceed, we'll send a confirmation email to your address.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg overflow-hidden border border-red-200 dark:border-red-900">
              <div className="bg-red-600 dark:bg-red-900 py-2 px-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-white" />
                  <h4 className="font-semibold text-white">WARNING</h4>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-950 p-4">
                <div className="space-y-3">
                  <p className="text-red-800 dark:text-red-300 font-medium">You are requesting to delete your account!</p>
                  <ul className="text-red-700 dark:text-red-400 space-y-1.5 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="min-w-4 h-4 rounded-full bg-red-400 dark:bg-red-800 flex items-center justify-center mt-0.5">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                      <span>All your data will be permanently erased</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="min-w-4 h-4 rounded-full bg-red-400 dark:bg-red-800 flex items-center justify-center mt-0.5">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                      <span>Your exam history and results will be lost</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="min-w-4 h-4 rounded-full bg-red-400 dark:bg-red-800 flex items-center justify-center mt-0.5">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                      <span>Your account settings and personal information will be removed</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-2 pb-4">
          <div className="bg-blue-50 dark:bg-[#121212] p-4 rounded-lg border border-blue-100 dark:border-gray-800 mb-4">
  <div className="flex flex-col items-center text-center gap-3">
    <div className="p-3 rounded-full bg-blue-100 dark:bg-gray-800">
      <Bell className="h-8 w-8 text-blue-600 dark:text-gray-300" />
    </div>
    <div className="space-y-2">
      <p className="font-medium">Email Confirmation Required</p>
      <p className="font-bold">{user?.email}</p>
      <p className="text-sm text-blue-700 dark:text-gray-400 mt-2">
        For security purposes, we'll send a confirmation email to this address.
        You must click the link in that email to complete the account deletion process.
      </p>
    </div>
  </div>
</div>
            <Label htmlFor="confirm-delete" className="text-sm font-medium mb-2 block">Type "DELETE" to confirm</Label>
            <Input 
              id="confirm-delete"
              placeholder="DELETE" 
              className="border-red-200 focus:border-red-300 dark:border-red-900 dark:focus:border-red-700" 
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
            {errorMessage && (
              <p className="text-sm font-medium text-red-500 dark:text-red-400 flex items-center gap-1 mt-2">
                <AlertTriangle size={14} />
                {errorMessage}
              </p>
            )}
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmText("");
              }}
              className="sm:w-auto w-full"
            >
              Cancel
            </Button>
            <Button 
  type="button"
  onClick={handleSendDeleteConfirmation}
  className="sm:w-auto w-full bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-600 text-white font-medium rounded-md px-4 py-2"
  disabled={deleteConfirmText !== "DELETE" || isDeletionEmailSent}
>
  {isDeletionEmailSent ? (
    <div className="flex items-center gap-2">
      <span className="animate-spin">⟳</span>
      <span>Sending Email...</span>
    </div>
  ) : (
    "Send Confirmation Email"
  )}
</Button>

          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Sent Confirmation Modal */}
      <Dialog 
        open={showDeletionEmailSentModal} 
        onOpenChange={setShowDeletionEmailSentModal}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600 dark:text-gray-300">
              <CheckCircle size={18} />
              Account Deletion Initiated
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-blue-50 dark:bg-[#121212] p-4 rounded-lg border border-blue-100 dark:border-gray-800">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-gray-800">
                  <Mail className="h-8 w-8 text-blue-600 dark:text-gray-300" />
                </div>
                <div className="space-y-2">
                  <p className="font-medium">We've sent a confirmation email to:</p>
                  <p className="font-bold">{user?.email || "your email address"}</p>
                  <p className="text-sm text-blue-700 dark:text-gray-400 mt-2">
                    Your account has been marked for deletion. 
                    Please check your inbox and click the confirmation link to complete the process. 
                    The link will expire in 30 minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              onClick={() => {
                setShowDeletionEmailSentModal(false);
                // Removed the logout() call here to keep the user logged in
              }}
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}