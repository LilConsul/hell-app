import { memo, useCallback, createContext, useContext, useRef } from "react";
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

const PasswordContext = createContext();

const usePasswordContext = () => {
  const context = useContext(PasswordContext);
  if (!context) {
    throw new Error('usePasswordContext must be used within PasswordProvider');
  }
  return context;
};

const PasswordProvider = ({ children, value }) => {
  return (
    <PasswordContext.Provider value={value}>
      {children}
    </PasswordContext.Provider>
  );
};

const PasswordInput = memo(function PasswordInput({
  id,
  label,
  placeholder,
  isConfirm = false,
  inputRef
}) {
  const {
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword
  } = usePasswordContext();

  const value = isConfirm ? confirmPassword : newPassword;
  const setValue = isConfirm ? setConfirmPassword : setNewPassword;
  const showPassword = isConfirm ? showConfirmPassword : showNewPassword;
  const setShowPassword = isConfirm ? setShowConfirmPassword : setShowNewPassword;

  const handleChange = useCallback((e) => {
    setValue(e.target.value);
  }, [setValue]);

  const toggleVisibility = useCallback(() => {
    setShowPassword(!showPassword);
  }, [showPassword, setShowPassword]);

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
          onChange={handleChange}
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-2 top-2/4 -translate-y-1/2"
          onClick={toggleVisibility}
          type="button"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </Button>
      </div>
    </div>
  );
});

const PasswordValidation = memo(function PasswordValidation() {
  const { newPassword, confirmPassword, passwordErrors, showRequirements } = usePasswordContext();

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const showMismatch = newPassword && confirmPassword && !passwordsMatch;

  return (
    <>
      {showMismatch && (
        <p className="text-sm text-destructive flex items-center gap-1 mt-1">
          <X size={14} className="text-destructive" />
          <span>Passwords do not match</span>
        </p>
      )}
      <PasswordRequirements 
        passwordErrors={passwordErrors} 
        showRequirements={showRequirements} 
      />
    </>
  );
});

const ModalFooter = memo(function ModalFooter() {
  const { 
    onOpenChange, 
    handlePasswordChange, 
    isPasswordValid, 
    newPassword, 
    confirmPassword 
  } = usePasswordContext();

  const isFormValid = isPasswordValid && newPassword === confirmPassword;

  return (
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
        disabled={!isFormValid}
      >
        Save Password
      </Button>
    </DialogFooter>
  );
});

const NewPasswordModal = memo(function NewPasswordModal(props) {
  const inputRef = useRef(null);

  return (
    <PasswordProvider value={props}>
      <Dialog open={props.open} onOpenChange={props.onOpenChange}>
        <DialogContent className="sm:max-w-md">
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
              placeholder="Enter new password"
              inputRef={inputRef}
            />

            <PasswordInput
              id="confirm-password"
              label="Confirm New Password"
              placeholder="Confirm new password"
              isConfirm={true}
            />
            
            <PasswordValidation />
          </div>
          
          <ModalFooter />
        </DialogContent>
      </Dialog>
    </PasswordProvider>
  );
});

export default NewPasswordModal;