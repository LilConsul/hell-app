import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useAuth } from "@/contexts/auth-context";
import { usePasswordValidation } from "@/components/password/password-validation";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/utils";

// Import refactored components
import { SettingsTabs } from "./SettingsTabs";
import { SettingsModals } from "./SettingsModals";
import { FeedbackAlerts } from "./FeedbackAlerts";

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
      setNotifications({ email: user.receive_notifications || true });
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
        credentials: 'include', // Include cookies
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
      const response = await apiRequest("/api/v1/users/me", {
        method: "PUT",
        credentials: 'include', // Include cookies
        body: JSON.stringify({
          language: value
        }),
      });
      
      // Update both the local state and the auth context
      // This avoids the need for a separate API call via refreshUser()
      if (response && response.data) {
        // Update the auth context with the new user data
        refreshUser(response.data);
      } else {
        // If the response doesn't contain user data, manually update the local state
        setLanguage(value);
      }
      
      showSuccess("Language updated successfully!");
    } catch (error) {
      console.error("Error updating language:", error);
      showError(`Failed to update language: ${error.message}`);
    }
  };
  
  // Handle notification toggle
  const handleToggleNotifications = async (value) => {
    try {
      const response = await apiRequest("/api/v1/users/me", {
        method: "PUT",
        credentials: 'include', // Include cookies
        body: JSON.stringify({
          receive_notifications: value
        }),
      });
      
      // Update both the local state and the auth context
      // This avoids the need for a separate API call via refreshUser()
      if (response && response.data) {
        // Update the auth context with the new user data
        refreshUser(response.data);
      } else {
        // If the response doesn't contain user data, manually update the local state
        setNotifications({ ...notifications, email: value });
      }
      
      showSuccess("Notification preferences updated successfully!");
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      showError(`Failed to update notification preferences: ${error.message}`);
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
      await apiRequest("/api/v1/users/me/change-password", {
        method: "PUT",
        credentials: 'include', // Include cookies
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
        credentials: 'include', // Include cookies
      });
      
      // Close the delete confirmation modal
      setShowDeleteModal(false);
      setDeleteConfirmText("");
      
      // Show the confirmation email sent modal
      setShowDeletionEmailSentModal(true);
      
    } catch (error) {
      console.error("Error sending confirmation email:", error);
      setErrorMessage(`Failed to send confirmation email: ${error.message}`);
    } finally {
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