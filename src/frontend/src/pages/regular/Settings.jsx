import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useAuth } from "@/contexts/auth-context";
import { usePasswordValidation } from "@/components/password/password-validation";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/utils";

// Import refactored components
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { SettingsModals } from "@/components/settings/SettingsModals";
import { FeedbackAlerts } from "@/components/settings/FeedbackAlerts";


export default function Settings() {
  // Auth context
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  
  // User data state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [language, setLanguage] = useState("en");
  const [notifications, setNotifications] = useState({ email: true });
  
  // UI state
  const [activeTab, setActiveTab] = useState("account");
  const [editField, setEditField] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  // Password modal state
  const [showCurrentPasswordModal, setShowCurrentPasswordModal] = useState(false);
  const [showNewPasswordModal, setShowNewPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletionEmailSent, setIsDeletionEmailSent] = useState(false);
  const [showDeletionEmailSentModal, setShowDeletionEmailSentModal] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);
  
  // Password validation
  const { passwordErrors, showRequirements, setShowRequirements, isPasswordValid } = usePasswordValidation(newPassword);

  // Single effect to fetch user data on mount
  useEffect(() => {
    // Only fetch user data once on component mount
    refreshUser();
  }, []);

  // Update local state when user data changes
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setLanguage(user.language || "en");
      // Ensure we're setting the initial state correctly with proper fallback
      setNotifications({ email: user.receive_notifications === false ? false : true });
    }
  }, [user]);

  // Handle name updates
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
      
      const response = await apiRequest("/api/v1/users/me", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      // Update both local state and auth context
      // This helps maintain UI consistency without an extra API call
      if (response && response.data) {
        // Assuming refreshUser can accept direct data to avoid an API call
        refreshUser(response.data);
      }
      
      setEditField("");
      showSuccess("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      showError(`Failed to update profile: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle language change
  const handleChangeLanguage = async (value) => {
    try {
      // Set loading state
      setIsUpdating(true);
      
      // Update local state immediately for better UX
      setLanguage(value);
      
      const response = await apiRequest("/api/v1/users/me", {
        method: "PUT",
        body: JSON.stringify({
          language: value
        }),
      });
      
      // Update both the local state and the auth context
      if (response && response.data) {
        // Update the auth context with the new user data
        refreshUser(response.data);
      }
      
      showSuccess("Language updated successfully!");
    } catch (error) {
      // Revert on error
      setLanguage(user?.language || "en");
      console.error("Error updating language:", error);
      showError(`Failed to update language: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // FIXED toggle function that prevents immediate reversion
  const handleToggleNotifications = async (value) => {
    try {
      // Prevent multiple submissions
      if (isUpdating) return;
      
      // Set loading state
      setIsUpdating(true);
      
      // Store the original value in case we need to revert
      const originalValue = notifications.email;
      
      // Update local state immediately for better user experience
      setNotifications({ ...notifications, email: value });
      
      const response = await apiRequest("/api/v1/users/me", {
        method: "PUT",
        body: JSON.stringify({
          receive_notifications: value
        }),
      });
      
      // Success case
      if (response && response.data) {
        // Don't call refreshUser here as it might override our local state
        // Just show success message
        showSuccess("Notification preferences updated successfully!");
      }
    } catch (error) {
      // Revert local state change if API call fails
      setNotifications(prev => ({ ...prev, email: !value }));
      console.error("Error updating notification preferences:", error);
      showError(`Failed to update notification preferences: ${error.message}`);
    } finally {
      // Reset loading state
      setIsUpdating(false);
    }
  };

  // Password handling functions
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

    if (!isPasswordValid) {
      setErrorMessage("Please ensure your password meets all requirements.");
      return;
    }

    try {
      setIsUpdating(true);
      
      await apiRequest("/api/v1/users/me/change-password", {
        method: "PUT",
        body: JSON.stringify({
          password: currentPassword,
          new_password: newPassword,
        }),
      });

      setShowNewPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showSuccess("Password changed successfully!");
    } catch (error) {
      setErrorMessage(`Password change failed: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Account deletion handling
  const handleSendDeleteConfirmation = async () => {
    if (deleteConfirmText !== "DELETE") {
      setErrorMessage("Please type DELETE to confirm sending the confirmation email");
      return;
    }
  
    try {
      setIsDeletionEmailSent(true);
  
      await apiRequest("/api/v1/users/me/request-delete", {
        method: "POST",
      });
      
      // Close the delete confirmation modal
      setShowDeleteModal(false);
      setDeleteConfirmText("");
      
      // Show the confirmation email sent modal
      setShowDeletionEmailSentModal(true);
      
    } catch (error) {
      console.error("Error sending confirmation email:", error);
      setErrorMessage(`Failed to send confirmation email: ${error.message}`);
      setIsDeletionEmailSent(false);
    }
  };
  
  // Feedback handling
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
        
        {/* Success and error feedback */}
        <FeedbackAlerts 
          successMessage={successMessage} 
          errorMsg={errorMsg} 
        />
  
        {/* Main settings tabs */}
        <SettingsTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          firstName={firstName}
          lastName={lastName}
          language={language}
          notifications={notifications}
          editField={editField}
          setEditField={setEditField}
          isUpdating={isUpdating}
          setFirstName={setFirstName}
          setLastName={setLastName}
          handleSaveName={handleSaveName}
          handleChangeLanguage={handleChangeLanguage}
          handleToggleNotifications={handleToggleNotifications}
          handleOpenCurrentPasswordModal={handleOpenCurrentPasswordModal}
          setShowDeleteModal={setShowDeleteModal}
        />

        {/* Modal dialogs */}
        <SettingsModals
          // Current Password Modal props
          showCurrentPasswordModal={showCurrentPasswordModal}
          setShowCurrentPasswordModal={setShowCurrentPasswordModal}
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          showCurrentPassword={showCurrentPassword}
          setShowCurrentPassword={setShowCurrentPassword}
          handleProceedCurrentPassword={handleProceedCurrentPassword}
          
          // New Password Modal props
          showNewPasswordModal={showNewPasswordModal}
          setShowNewPasswordModal={setShowNewPasswordModal}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          showNewPassword={showNewPassword}
          setShowNewPassword={setShowNewPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          handlePasswordChange={handlePasswordChange}
          
          // Password validation props
          passwordErrors={passwordErrors}
          showRequirements={showRequirements}
          setShowRequirements={setShowRequirements}
          isPasswordValid={isPasswordValid}
          
          // Delete Account Modal props
          showDeleteModal={showDeleteModal}
          setShowDeleteModal={setShowDeleteModal}
          deleteConfirmText={deleteConfirmText}
          setDeleteConfirmText={setDeleteConfirmText}
          handleSendDeleteConfirmation={handleSendDeleteConfirmation}
          isDeletionEmailSent={isDeletionEmailSent}
          
          // Email Sent Confirmation Modal props
          showDeletionEmailSentModal={showDeletionEmailSentModal}
          setShowDeletionEmailSentModal={setShowDeletionEmailSentModal}
          
          // Auth props
          logout={logout}
          
          // General props
          errorMessage={errorMessage}
          user={user}
        />
      </main>
      <Footer />
    </div>
  );
}