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
import { AlertTriangle, Eye, EyeOff } from "lucide-react";

// Create current password context
const CurrentPasswordContext = createContext();

// Custom hook to use current password context
const useCurrentPasswordContext = () => {
  const context = useContext(CurrentPasswordContext);
  if (!context) {
    throw new Error('useCurrentPasswordContext must be used within CurrentPasswordProvider');
  }
  return context;
};

// Current password provider component
const CurrentPasswordProvider = ({ children, value }) => {
  return (
    <CurrentPasswordContext.Provider value={value}>
      {children}
    </CurrentPasswordContext.Provider>
  );
};

// Simplified PasswordInput component
const PasswordInput = memo(function PasswordInput({ inputRef }) {
  const {
    currentPassword,
    setCurrentPassword,
    showCurrentPassword,
    setShowCurrentPassword,
    handleProceedCurrentPassword
  } = useCurrentPasswordContext();

  const handleChange = useCallback((e) => {
    setCurrentPassword(e.target.value);
  }, [setCurrentPassword]);

  const toggleVisibility = useCallback(() => {
    setShowCurrentPassword(!showCurrentPassword);
  }, [showCurrentPassword, setShowCurrentPassword]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleProceedCurrentPassword();
    }
  }, [handleProceedCurrentPassword]);

  return (
    <div className="space-y-2">
      <Label htmlFor="current-password">Current Password</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id="current-password"
          type={showCurrentPassword ? "text" : "password"}
          placeholder="Enter your current password"
          value={currentPassword}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-2 top-2/4 -translate-y-1/2"
          onClick={toggleVisibility}
          type="button"
        >
          {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </Button>
      </div>
    </div>
  );
});

// Error message component
const ErrorMessage = memo(function ErrorMessage() {
  const { errorMessage } = useCurrentPasswordContext();

  if (!errorMessage) return null;

  return (
    <p className="text-sm text-destructive flex items-center gap-1 mt-1">
      <AlertTriangle size={14} className="text-destructive" />
      <span>{errorMessage}</span>
    </p>
  );
});

// Modal footer component
const ModalFooter = memo(function ModalFooter() {
  const { onOpenChange, handleProceedCurrentPassword } = useCurrentPasswordContext();

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
        onClick={handleProceedCurrentPassword}
      >
        Continue
      </Button>
    </DialogFooter>
  );
});

// Main modal component - now much cleaner
export const CurrentPasswordModal = memo(function CurrentPasswordModal(props) {
  const inputRef = useRef(null);

  return (
    <CurrentPasswordProvider value={props}>
      <Dialog open={props.open} onOpenChange={props.onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Your Identity</DialogTitle>
            <DialogDescription>
              Please enter your current password to continue.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <PasswordInput inputRef={inputRef} />
            <ErrorMessage />
          </div>
          
          <ModalFooter />
        </DialogContent>
      </Dialog>
    </CurrentPasswordProvider>
  );
});