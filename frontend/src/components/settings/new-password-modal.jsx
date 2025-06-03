import { memo, useCallback } from "react";
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
import { Eye, EyeOff, X } from "lucide-react";

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
  isPasswordValid,
  inputRef
}) {
  const handleNewPasswordChange = useCallback((e) => {
    setNewPassword(e.target.value);
    // Hook-ul usePasswordValidation gestionează automat showRequirements
  }, [setNewPassword]);

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

export default NewPasswordModal;