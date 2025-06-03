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
import { AlertTriangle, Eye, EyeOff } from "lucide-react";

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

export const CurrentPasswordModal = memo(function CurrentPasswordModal({
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