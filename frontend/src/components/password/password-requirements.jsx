import { X } from "lucide-react";
import { PASSWORD_CONFIG } from "./password-config";

export function PasswordRequirements({ passwordErrors, showRequirements }) {
  if (!showRequirements || !Object.values(passwordErrors).some((error) => error)) {
    return null;
  }

  return (
    <div className="space-y-2 text-sm">
      {passwordErrors.length && (
        <div className="flex items-center">
          <X className="h-4 w-4 mr-2 stroke-red-500" />
          <span className="text-muted-foreground">At least 8 characters</span>
        </div>
      )}
      {passwordErrors.lowercase && (
        <div className="flex items-center">
          <X className="h-4 w-4 mr-2 stroke-red-500" />
          <span className="text-muted-foreground">At least one lowercase letter (a-z)</span>
        </div>
      )}
      {passwordErrors.uppercase && (
        <div className="flex items-center">
          <X className="h-4 w-4 mr-2 stroke-red-500" />
          <span className="text-muted-foreground">At least one uppercase letter (A-Z)</span>
        </div>
      )}
      {passwordErrors.number && (
        <div className="flex items-center">
          <X className="h-4 w-4 mr-2 stroke-red-500" />
          <span className="text-muted-foreground">At least one number (0-9)</span>
        </div>
      )}
      {passwordErrors.special && (
        <div className="flex items-center">
          <X className="h-4 w-4 mr-2 stroke-red-500" />
          <span className="text-muted-foreground">
            At least one special character (!@#$%^&*()_-+=)
          </span>
        </div>
      )}
    </div>
  );
}
