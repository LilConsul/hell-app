import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useAuth } from "@/contexts/auth-context";
import { usePasswordValidation } from "@/components/password/password-validation";
import { useNavigate } from "react-router-dom";

// Import refactored components
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

  // Fetch user data from API
  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/v1/users/me", {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData = await response.json();
      
      // Use the refreshUser function from context
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
      
      const response = await fetch("/api/v1/users/me", {
        method: "PUT",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include cookies
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

  // Handle language change
  const handleChangeLanguage = async (value) => {
    try {
      const response = await fetch("/api/v1/users/me", {
        method: "PUT",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include cookies
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
  
  // Handle notification toggle
  const handleToggleNotifications = async (value) => {
    try {
      const response = await fetch("/api/v1/users/me", {
        method: "PUT",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include cookies
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

    try {
      const response = await fetch("/api/v1/users/me/change-password", {
        method: "PUT",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include cookies
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

  // Account deletion handling - UPDATED to not log out automatically
  const handleSendDeleteConfirmation = async () => {
    if (deleteConfirmText !== "DELETE") {
      setErrorMessage("Please type DELETE to confirm sending the confirmation email");
      return;
    }
  
    try {
      setIsDeletionEmailSent(true);
  
      const response = await fetch("/api/v1/users/me/request-delete", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include cookies
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to send confirmation email");
      }
      
      // Close the delete confirmation modal
      setShowDeleteModal(false);
      setDeleteConfirmText("");
      
      // Show the confirmation email sent modal
      setShowDeletionEmailSentModal(true);
      
      // Removed the automatic logout timeout
      
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
          
          // Auth props - Added logout prop
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