import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { 
  Pencil, 
  Save, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  User, 
  Lock, 
  Globe, 
  Bell, 
  Trash2, 
  X, 
  AlertTriangle,
  Mail
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { PasswordRequirements } from "@/components/password/password-requirements";
import { usePasswordValidation } from "@/components/password/password-validation";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { user, refreshUser } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [editField, setEditField] = useState("");
  const [language, setLanguage] = useState("en");
  const [notifications, setNotifications] = useState({ 
    email: true
  });
  const [showCurrentPasswordModal, setShowCurrentPasswordModal] = useState(false);
  const [showNewPasswordModal, setShowNewPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("account");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeletionEmailSent, setIsDeletionEmailSent] = useState(false);
  const [showDeletionEmailSentModal, setShowDeletionEmailSentModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const currentPasswordRef = useRef(null);
  const newPasswordRef = useRef(null);

  const { passwordErrors, showRequirements, setShowRequirements, isPasswordValid } = usePasswordValidation(newPassword);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  // Update local state when user data changes
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setLanguage(user.language || "en");
      setNotifications({ email: user.receive_notifications || true });
    }
  }, [user]);

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

  // Fetch user data from API
  const fetchUserData = async () => {
    try {
      // Get the authentication token from localStorage
      const token = localStorage.getItem('authToken');
      
      const response = await fetch("/api/v1/users/me", {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Add the auth token to the request
        },
        credentials: 'include', // Include cookies if using cookie-based auth
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData = await response.json();
      
      // Use the refreshUser function from context instead of directly setting the user
      refreshUser();
      
      // Update local state
      setFirstName(userData.data.first_name || "");
      setLastName(userData.data.last_name || "");
      setLanguage(userData.data.language || "en");
      setNotifications({ email: userData.data.receive_notifications || true });
    } catch (error) {
      console.error("Error fetching user data:", error);
      showError("Failed to load user data. Please try again.");
    }
  };

  const handleSaveName = async (field) => {
    // Prevent multiple submissions
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      const payload = {};
      
      if (field === "firstName") {
        payload.first_name = firstName;
      } else if (field === "lastName") {
        payload.last_name = lastName;
      }
      
      // Get the authentication token from localStorage
      const token = localStorage.getItem('authToken');
      
      const response = await fetch("/api/v1/users/me", {
        method: "PUT",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Add the auth token to the request
        },
        credentials: 'include', // Include cookies if using cookie-based auth
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("API error response:", errorData);
        throw new Error(errorData?.message || "Failed to update profile");
      }

      // Update the user data using the refreshUser function from context
      refreshUser();
      
      setEditField("");
      showSuccess("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      showError(`Failed to update profile: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangeLanguage = async (value) => {
    try {
      // Get the authentication token from localStorage
      const token = localStorage.getItem('authToken');
      
      const response = await fetch("/api/v1/users/me", {
        method: "PUT",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Add the auth token to the request
        },
        credentials: 'include', // Include cookies if using cookie-based auth
        body: JSON.stringify({
          language: value
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to update language");
      }

      // Update the user data using the refreshUser function from context
      refreshUser();
      
      setLanguage(value);
      showSuccess("Language updated successfully!");
    } catch (error) {
      console.error("Error updating language:", error);
      showError(`Failed to update language: ${error.message}`);
    }
  };
  
  const handleToggleNotifications = async (value) => {
    try {
      // Get the authentication token from localStorage
      const token = localStorage.getItem('authToken');
      
      const response = await fetch("/api/v1/users/me", {
        method: "PUT",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Add the auth token to the request
        },
        credentials: 'include', // Include cookies if using cookie-based auth
        body: JSON.stringify({
          receive_notifications: value
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to update notification preferences");
      }

      // Update the user data using the refreshUser function from context
      refreshUser();
      
      setNotifications({ ...notifications, email: value });
      showSuccess("Notification preferences updated successfully!");
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      showError(`Failed to update notification preferences: ${error.message}`);
    }
  };

  const handleOpenCurrentPasswordModal = () => {
    setErrorMessage("");
    setCurrentPassword("");
    setShowCurrentPasswordModal(true);
  };

  const handleProceedCurrentPassword = () => {
    if (currentPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters!");
      return;
    }
    setErrorMessage("");
    setShowCurrentPasswordModal(false);
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPasswordModal(true);
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please make sure your passwords match and try again.");
      return;
    }

    try {
      // Get the authentication token from localStorage
      const token = localStorage.getItem('authToken');
      
      const response = await fetch("/api/v1/users/me/change-password", {
        method: "PUT",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Add the auth token to the request
        },
        credentials: 'include', // Include cookies if using cookie-based auth
        body: JSON.stringify({
          password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Incorrect current password!");
      }

      setShowNewPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showSuccess("Password changed successfully!");
    } catch (error) {
      setErrorMessage(`Password change failed: ${error.message}`);
    }
  };

  const handleSendDeleteConfirmation = async () => {
    if (deleteConfirmText !== "DELETE") {
      setErrorMessage("Please type DELETE to confirm sending the confirmation email");
      return;
    }
  
    try {
      setIsDeletionEmailSent(true);
      // Get the authentication token from localStorage
      const token = localStorage.getItem('authToken');
  
      const response = await fetch("/api/v1/users/me/request-delete", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to send confirmation email");
      }
      setShowDeleteModal(false);
      setDeleteConfirmText("");
      setShowDeletionEmailSentModal(true);
    } catch (error) {
      console.error("Error sending confirmation email:", error);
      setErrorMessage(`Failed to send confirmation email: ${error.message}`);
    } finally {
      setIsDeletionEmailSent(false);
    }
  };
  
  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };
  
  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 5000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <Navbar />
      <main className="flex-1 container max-w-4xl mx-auto py-10 px-4 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        
        {successMessage && (
          <div className="flex items-center justify-center p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm font-medium transition-opacity duration-500">
            <CheckCircle className="h-4 w-4 mr-2" />
            {successMessage}
          </div>
        )}
        
        {errorMsg && (
          <div className="flex items-center justify-center p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm font-medium transition-opacity duration-500">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {errorMsg}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="account" className="flex gap-2 items-center">
              <User size={16} />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex gap-2 items-center">
              <Lock size={16} />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex gap-2 items-center">
              <Globe size={16} />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="danger" className="flex gap-2 items-center">
              <Trash2 size={16} />
              <span className="hidden sm:inline">Danger Zone</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your account information and how others see you on the platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    disabled 
                    value={user?.email || ""} 
                    className="bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your email cannot be changed. Contact support if you need to update it.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="firstName"
                      value={firstName} 
                      disabled={editField !== "firstName"} 
                      onChange={(e) => setFirstName(e.target.value)} 
                      className={cn(editField !== "firstName" && "border-transparent bg-muted/30")}
                    />
                    {editField === "firstName" ? (
                      <Button 
                        size="icon" 
                        onClick={() => handleSaveName("firstName")}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <span className="animate-spin">⟳</span>
                        ) : (
                          <Save size={16} />
                        )}
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost" onClick={() => setEditField("firstName")}>
                        <Pencil size={16} />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="lastName"
                      value={lastName} 
                      disabled={editField !== "lastName"} 
                      onChange={(e) => setLastName(e.target.value)} 
                      className={cn(editField !== "lastName" && "border-transparent bg-muted/30")}
                    />
                    {editField === "lastName" ? (
                      <Button 
                        size="icon" 
                        onClick={() => handleSaveName("lastName")}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <span className="animate-spin">⟳</span>
                        ) : (
                          <Save size={16} />
                        )}
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost" onClick={() => setEditField("lastName")}>
                        <Pencil size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Change Password</h3>
                    <p className="text-sm text-muted-foreground">
                      We recommend updating your password regularly for security.
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleOpenCurrentPasswordModal}>
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Language</CardTitle>
                <CardDescription>
                  Choose your preferred language for the application interface.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2 max-w-xs">
                  <Label htmlFor="language">Select Language</Label>
                  <Select value={language} onValueChange={handleChangeLanguage} id="language">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ro">Română</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how you receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive updates, results, and important announcements via email.
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.email} 
                    onCheckedChange={(v) => handleToggleNotifications(v)} 
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="danger" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-red-500 flex items-center gap-2">
                  <Trash2 size={18} />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Actions that could have serious consequences for your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
                  <p className="text-sm font-medium text-red-500 flex items-center gap-1">
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
                  <p className="text-sm font-medium text-red-500 flex items-center gap-1">
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
              <DialogTitle className="text-red-500 flex items-center gap-2">
                <Trash2 size={18} />
                Delete Account
              </DialogTitle>
              <DialogDescription className="pt-2">
                This action cannot be undone. To proceed, we'll send a confirmation email to your address.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="rounded-lg overflow-hidden border border-red-200">
                <div className="bg-red-500 py-2 px-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-white" />
                    <h4 className="font-semibold text-white">WARNING</h4>
                  </div>
                </div>
                <div className="bg-red-50 p-4">
                  <div className="space-y-3">
                    <p className="text-red-800 font-medium">You are requesting to delete your account!</p>
                    <ul className="text-red-700 space-y-1.5 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="min-w-4 h-4 rounded-full bg-red-400 flex items-center justify-center mt-0.5">
                          <span className="text-white text-xs font-bold">!</span>
                        </div>
                        <span>All your data will be permanently erased</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="min-w-4 h-4 rounded-full bg-red-400 flex items-center justify-center mt-0.5">
                          <span className="text-white text-xs font-bold">!</span>
                        </div>
                        <span>Your exam history and results will be lost</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="min-w-4 h-4 rounded-full bg-red-400 flex items-center justify-center mt-0.5">
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
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                <div className="flex items-start gap-2">
                  <Bell className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Email Confirmation Required</p>
                    <p className="mt-1">
                      For security purposes, we'll send a confirmation email to <span className="font-semibold">{user?.email}</span>. 
                      You must click the link in that email to complete the account deletion process.
                    </p>
                  </div>
                </div>
              </div>
              <Label htmlFor="confirm-delete" className="text-sm font-medium mb-2 block">Type "DELETE" to confirm</Label>
              <Input 
                id="confirm-delete"
                placeholder="DELETE" 
                className="border-red-200 focus:border-red-300" 
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
              {errorMessage && (
                <p className="text-sm font-medium text-red-500 flex items-center gap-1 mt-2">
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
                  setErrorMessage("");
                }}
                className="sm:w-auto w-full"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleSendDeleteConfirmation}
                className="sm:w-auto w-full bg-red-600 hover:bg-red-700"
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
        <Dialog open={showDeletionEmailSentModal} onOpenChange={setShowDeletionEmailSentModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-600">
                <CheckCircle size={18} />
                Confirmation Email Sent
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Mail className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">We've sent a confirmation email to:</p>
                    <p className="font-bold">{user?.email}</p>
                    <p className="text-sm text-blue-700 mt-2">
                      Please check your inbox and click the confirmation link to complete the account deletion process. 
                      The link will expire in 30 minutes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                onClick={() => setShowDeletionEmailSentModal(false)}
                className="w-full"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}