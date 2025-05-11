import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useAuth } from "@/contexts/auth-context";
import { usePasswordValidation } from "@/components/password/password-validation";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/utils";

import { Separator } from "@/components/ui/separator";

import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { SettingsModals } from "@/components/settings/SettingsModals";
import { FeedbackAlerts } from "@/components/settings/FeedbackAlerts";

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    language: "en",
    notifications: { email: true },
  });

  const [activeTab, setActiveTab] = useState("account");
  const [editField, setEditField] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [passwordState, setPasswordState] = useState({
    showCurrentPasswordModal: false,
    showNewPasswordModal: false,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
    errorMessage: "",
  });

  const [deletionState, setDeletionState] = useState({
    showDeleteModal: false,
    deleteConfirmText: "",
    isDeletionEmailSent: false,
    showDeletionEmailSentModal: false,
    accountDeleted: false,
  });

  const { passwordErrors, showRequirements, setShowRequirements, isPasswordValid } = 
    usePasswordValidation(passwordState.newPassword);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        language: user.language || "en",
        notifications: { email: user.receive_notifications === false ? false : true },
      });
    }
  }, [user]);

  const showSuccess = useCallback((msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  }, []);

  const showError = useCallback((msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 5000);
  }, []);

  const handleUserUpdate = useCallback(async (endpoint, payload, successMsg, fieldName) => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);

      const response = await apiRequest(endpoint, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      if (response && response.data) {
        updateUser(response.data);
        
        if (fieldName) setEditField("");
        
        showSuccess(successMsg);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error updating ${endpoint}:`, error);
      showError(`Failed to update: ${error.message}`);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, updateUser, showSuccess, showError]);

  const handleSaveName = useCallback(async (field) => {
    const payload = {};
    
    if (field === "firstName") {
      payload.first_name = formData.firstName;
    } else if (field === "lastName") {
      payload.last_name = formData.lastName;
    }

    await handleUserUpdate(
      "/api/v1/users/me", 
      payload, 
      "Profile updated successfully!", 
      field
    );
  }, [formData, handleUserUpdate]);

  const handleChangeLanguage = useCallback(async (value) => {
    if (formData.language === value) return;
    
    setFormData(prev => ({ ...prev, language: value }));
    
    const success = await handleUserUpdate(
      "/api/v1/users/me",
      { language: value },
      "Language updated successfully!"
    );

    if (!success) {
      setFormData(prev => ({ 
        ...prev, 
        language: user?.language || "en" 
      }));
    }
  }, [formData, user, handleUserUpdate]);

  const handleToggleNotifications = useCallback(async (value) => {
    if (formData.notifications.email === value) return;
    setFormData(prev => ({ 
      ...prev, 
      notifications: { ...prev.notifications, email: value } 
    }));
    
    const success = await handleUserUpdate(
      "/api/v1/users/me",
      { receive_notifications: value },
      "Notification preferences updated successfully!"
    );
    
    if (!success) {
      setFormData(prev => ({ 
        ...prev, 
        notifications: { ...prev.notifications, email: !value } 
      }));
    }
  }, [formData, handleUserUpdate]);

  const handleOpenCurrentPasswordModal = useCallback(() => {
    setPasswordState(prev => ({
      ...prev,
      errorMessage: "",
      currentPassword: "",
      showCurrentPasswordModal: true
    }));
  }, []);

  const handleProceedCurrentPassword = useCallback(() => {
    if (passwordState.currentPassword.length < 6) {
      setPasswordState(prev => ({
        ...prev,
        errorMessage: "Password must be at least 6 characters!"
      }));
      return;
    }
    
    setPasswordState(prev => ({
      ...prev,
      errorMessage: "",
      showCurrentPasswordModal: false,
      newPassword: "",
      confirmPassword: "",
      showNewPasswordModal: true
    }));
  }, [passwordState]);

  const handlePasswordChange = useCallback(async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordState;
    
    if (newPassword !== confirmPassword) {
      setPasswordState(prev => ({
        ...prev,
        errorMessage: "Passwords do not match. Please make sure your passwords match and try again."
      }));
      return;
    }

    if (!isPasswordValid) {
      setPasswordState(prev => ({
        ...prev,
        errorMessage: "Please ensure your password meets all requirements."
      }));
      return;
    }

    try {
      setIsUpdating(true);

      await apiRequest("/api/v1/users/me/change-password", {
        method: "PUT",
        body: JSON.stringify({
          password: currentPassword,
          new_password: newPassword
        })
      });

      setPasswordState(prev => ({
        ...prev,
        showNewPasswordModal: false,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
      
      showSuccess("Password changed successfully!");
    } catch (error) {
      setPasswordState(prev => ({
        ...prev,
        errorMessage: `Password change failed: ${error.message}`
      }));
    } finally {
      setIsUpdating(false);
    }
  }, [passwordState, isPasswordValid, showSuccess]);

  const handleSendDeleteConfirmation = useCallback(async () => {
    if (deletionState.deleteConfirmText !== "DELETE") {
      setPasswordState(prev => ({
        ...prev,
        errorMessage: "Please type DELETE to confirm sending the confirmation email"
      }));
      return;
    }

    try {
      setDeletionState(prev => ({
        ...prev,
        isDeletionEmailSent: true
      }));

      await apiRequest("/api/v1/users/me/request-delete", {
        method: "POST"
      });

      setDeletionState(prev => ({
        ...prev,
        showDeleteModal: false,
        deleteConfirmText: "",
        showDeletionEmailSentModal: true
      }));
    } catch (error) {
      console.error("Error sending confirmation email:", error);
      setPasswordState(prev => ({
        ...prev,
        errorMessage: `Failed to send confirmation email: ${error.message}`
      }));
      setDeletionState(prev => ({
        ...prev,
        isDeletionEmailSent: false
      }));
    }
  }, [deletionState]);

  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const updatePasswordState = useCallback((field, value) => {
    setPasswordState(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const updateDeletionState = useCallback((field, value) => {
    setDeletionState(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <div className="flex-1">
        <div className="container mx-auto px-4">
          <div className="py-10 space-y-6">
            <div className="w-full max-w-5xl mx-auto">
              <div className="flex flex-col">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                <p className="text-muted-foreground pl-0.5">
                  Manage your account settings and preferences.
                </p>
              </div>
              
              <Separator className="my-6 bg-border w-3/4" />
              
              <div className="space-y-6">
                <FeedbackAlerts successMessage={successMessage} errorMsg={errorMsg} />

                <SettingsTabs
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  user={user}
                  firstName={formData.firstName}
                  lastName={formData.lastName}
                  language={formData.language}
                  notifications={formData.notifications}
                  editField={editField}
                  setEditField={setEditField}
                  isUpdating={isUpdating}
                  setFirstName={(value) => handleFieldChange('firstName', value)}
                  setLastName={(value) => handleFieldChange('lastName', value)}
                  handleSaveName={handleSaveName}
                  handleChangeLanguage={handleChangeLanguage}
                  handleToggleNotifications={handleToggleNotifications}
                  handleOpenCurrentPasswordModal={handleOpenCurrentPasswordModal}
                  setShowDeleteModal={(value) => updateDeletionState('showDeleteModal', value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <SettingsModals
        showCurrentPasswordModal={passwordState.showCurrentPasswordModal}
        setShowCurrentPasswordModal={(value) => updatePasswordState('showCurrentPasswordModal', value)}
        currentPassword={passwordState.currentPassword}
        setCurrentPassword={(value) => updatePasswordState('currentPassword', value)}
        showCurrentPassword={passwordState.showCurrentPassword}
        setShowCurrentPassword={(value) => updatePasswordState('showCurrentPassword', value)}
        handleProceedCurrentPassword={handleProceedCurrentPassword}
        showNewPasswordModal={passwordState.showNewPasswordModal}
        setShowNewPasswordModal={(value) => updatePasswordState('showNewPasswordModal', value)}
        newPassword={passwordState.newPassword}
        setNewPassword={(value) => updatePasswordState('newPassword', value)}
        confirmPassword={passwordState.confirmPassword}
        setConfirmPassword={(value) => updatePasswordState('confirmPassword', value)}
        showNewPassword={passwordState.showNewPassword}
        setShowNewPassword={(value) => updatePasswordState('showNewPassword', value)}
        showConfirmPassword={passwordState.showConfirmPassword}
        setShowConfirmPassword={(value) => updatePasswordState('showConfirmPassword', value)}
        handlePasswordChange={handlePasswordChange}
        passwordErrors={passwordErrors}
        showRequirements={showRequirements}
        setShowRequirements={setShowRequirements}
        isPasswordValid={isPasswordValid}
        showDeleteModal={deletionState.showDeleteModal}
        setShowDeleteModal={(value) => updateDeletionState('showDeleteModal', value)}
        deleteConfirmText={deletionState.deleteConfirmText}
        setDeleteConfirmText={(value) => updateDeletionState('deleteConfirmText', value)}
        handleSendDeleteConfirmation={handleSendDeleteConfirmation}
        isDeletionEmailSent={deletionState.isDeletionEmailSent}
        showDeletionEmailSentModal={deletionState.showDeletionEmailSentModal}
        setShowDeletionEmailSentModal={(value) => updateDeletionState('showDeletionEmailSentModal', value)}
        logout={logout}
        errorMessage={passwordState.errorMessage}
        user={user}
      />
      
      <Footer />
    </div>
  );
}