import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { SettingsModals } from '@/components/settings/SettingsModals';
import { FeedbackAlerts } from '@/components/settings/FeedbackAlerts';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { apiRequest } from '@/lib/utils';
import { usePasswordValidation } from '@/components/password/password-validation';

export default function SettingsPage() {
  const { user, refreshUser, updateUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('account');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // ✅ Initialize with empty strings instead of undefined
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [editField, setEditField] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // ✅ Initialize password fields with empty strings
  const [showCurrentPasswordModal, setShowCurrentPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPasswordModal, setShowNewPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { 
    passwordErrors, 
    showRequirements, 
    isPasswordValid: isPasswordValidFromHook
  } = usePasswordValidation(newPassword);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState(''); // ✅ Empty string
  const [isDeletionEmailSent, setIsDeletionEmailSent] = useState(false);
  const [showDeletionEmailSentModal, setShowDeletionEmailSentModal] = useState(false);

  const [language, setLanguage] = useState('en'); // ✅ Default value
  const [notifications, setNotifications] = useState({ email: true }); // ✅ Default object

  useEffect(() => {
    if (user) {
      // ✅ Always provide fallback empty strings
      setFirstName(user.first_name || user.firstName || '');
      setLastName(user.last_name || user.lastName || '');
      
      // ✅ Provide fallback for language
      const savedLanguage = localStorage.getItem('userLanguage');
      setLanguage(savedLanguage || user.language || user.preferences?.language || 'en');

      // ✅ Provide fallback for notifications
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        try {
          setNotifications(JSON.parse(savedNotifications));
        } catch (error) {
          setNotifications(user.notifications || user.preferences?.notifications || { email: true });
        }
      } else {
        setNotifications(user.notifications || user.preferences?.notifications || { email: true });
      }
    }
  }, [user]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'userLanguage' && e.newValue !== language) {
        setLanguage(e.newValue || 'en'); // ✅ Fallback
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [language]);

  const handleNameKeyDown = useCallback((event, field) => {
    if (event.key === 'Enter') {
      event.preventDefault(); 
      
      if (editField === field && !isUpdating) {
        handleSaveName(field);
      }
    }
  }, [editField, isUpdating]);

  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const handleSaveName = useCallback(async (field) => {
    setIsUpdating(true);
    setErrorMessage('');

    const newValue = field === 'firstName' ? firstName : lastName;
    const fieldName = field === 'firstName' ? 'first_name' : 'last_name';
    
    updateUser({
      [fieldName]: newValue,
      [field]: newValue 
    });
    
    setSuccessMessage(`${field === 'firstName' ? 'First' : 'Last'} name updated successfully`);
    setEditField(null);
    setIsUpdating(false);

    try {
      const updateData = {
        first_name: field === 'firstName' ? firstName : (user.first_name || user.firstName || ''),
        last_name: field === 'lastName' ? lastName : (user.last_name || user.lastName || ''),
        email: user.email
      };

      apiRequest('/api/v1/users/me', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        credentials: 'include'
      }).then(() => {
        setTimeout(() => {
          refreshUser().catch(console.error);
        }, 500);
      }).catch(error => {
        setErrorMessage('Failed to save changes. Please try again.');
        
        updateUser({
          [fieldName]: user[fieldName],
          [field]: user[field]
        });
        
        // ✅ Always provide fallback values
        if (field === 'firstName') {
          setFirstName(user.first_name || user.firstName || '');
        } else {
          setLastName(user.last_name || user.lastName || '');
        }
      });

    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }, [firstName, lastName, refreshUser, updateUser, user]);

  const handleToggleNotifications = useCallback(async (checked) => {
    const newNotifications = { ...notifications, email: checked };
    setNotifications(newNotifications);

    try {
      localStorage.setItem('notifications', JSON.stringify(newNotifications));

      await apiRequest('/api/v1/users/me', {
        method: 'PUT',
        body: JSON.stringify({ 
          preferences: { 
            notifications: newNotifications 
          } 
        }),
        credentials: 'include'
      });

      setSuccessMessage('Notification preferences updated');
    } catch (error) {
      setErrorMessage('Failed to save notification preferences');
      setNotifications(notifications);
    }
  }, [notifications]);

  const handleChangeLanguage = useCallback((newLanguage) => {
    const oldLanguage = language;
    setLanguage(newLanguage);
    
    try {
      localStorage.setItem('userLanguage', newLanguage);
      setSuccessMessage('Language updated successfully');
    } catch (error) {
      console.error('Failed to save language preference:', error);
      setErrorMessage('Failed to update language preference');
      setLanguage(oldLanguage);
    }
  }, [language]);

  const handleOpenCurrentPasswordModal = useCallback(() => {
    // ✅ Reset to empty strings, not undefined
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setShowCurrentPasswordModal(true);
  }, []);

  const handleProceedCurrentPassword = useCallback(() => {
    if (!currentPassword.trim()) {
      setErrorMessage('Please enter your current password');
      return;
    }

    setErrorMessage('');
    setShowCurrentPasswordModal(false);
    setShowNewPasswordModal(true);
  }, [currentPassword]);

  const handlePasswordChange = useCallback(async () => {
    if (!currentPassword.trim()) {
      setErrorMessage('Current password is required');
      return;
    }

    if (!newPassword.trim()) {
      setErrorMessage('New password is required');
      return;
    }

    if (!confirmPassword.trim()) {
      setErrorMessage('Password confirmation is required');
      return;
    }

    if (!isPasswordValidFromHook) {
      setErrorMessage('Password does not meet all requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage('New password must be different from current password');
      return;
    }

    setErrorMessage('');

    try {
      const payload = {
        password: currentPassword,
        new_password: newPassword      
      };

      await apiRequest('/api/v1/users/me/change-password', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setShowNewPasswordModal(false);
      setSuccessMessage('Password changed successfully');

      // ✅ Reset to empty strings
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setTimeout(() => {
        refreshUser().catch(console.error);
      }, 500);

    } catch (error) {
      let userMessage = error.message || 'An error occurred while changing your password. Please try again.';
      
      if (userMessage.includes('password') && !userMessage.includes('new_password')) {
        userMessage = 'Current password is incorrect.';
        setCurrentPassword(''); // ✅ Empty string
        setShowNewPasswordModal(false);
        setShowCurrentPasswordModal(true);
      } else if (userMessage.includes('new_password') || userMessage.includes('Password validation')) {
        userMessage = 'New password does not meet security requirements.';
      } else if (userMessage.includes('same') || userMessage.includes('different')) {
        userMessage = 'New password must be different from current password.';
      }
      
      setErrorMessage(userMessage);
    }
  }, [currentPassword, newPassword, confirmPassword, isPasswordValidFromHook, refreshUser]);

  const handleSendDeleteConfirmation = useCallback(async () => {
    if (deleteConfirmText !== 'DELETE') {
      setErrorMessage('Please type "DELETE" to confirm');
      return;
    }

    setIsDeletionEmailSent(true);
    setErrorMessage('');

    try {
      await apiRequest('/api/v1/users/me/request-delete', {
        method: 'POST',
        credentials: 'include'
      });

      setShowDeleteModal(false);
      setShowDeletionEmailSentModal(true);
      setDeleteConfirmText(''); // ✅ Empty string

    } catch (error) {
      setErrorMessage(error.message || 'Failed to send confirmation email. Please try again.');
    } finally {
      setIsDeletionEmailSent(false);
    }
  }, [deleteConfirmText]);

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        <div className="container px-4 sm:px-6 mx-auto max-w-6xl py-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences.
            </p>
          </div>

          <FeedbackAlerts
            successMessage={successMessage}
            errorMsg={errorMessage}
          />

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
            handleNameKeyDown={handleNameKeyDown}
          />

          <SettingsModals
            showCurrentPasswordModal={showCurrentPasswordModal}
            setShowCurrentPasswordModal={setShowCurrentPasswordModal}
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            showCurrentPassword={showCurrentPassword}
            setShowCurrentPassword={setShowCurrentPassword}
            handleProceedCurrentPassword={handleProceedCurrentPassword}
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
            passwordErrors={passwordErrors}
            showRequirements={showRequirements}
            isPasswordValid={isPasswordValidFromHook}
            showDeleteModal={showDeleteModal}
            setShowDeleteModal={setShowDeleteModal}
            deleteConfirmText={deleteConfirmText}
            setDeleteConfirmText={setDeleteConfirmText}
            handleSendDeleteConfirmation={handleSendDeleteConfirmation}
            isDeletionEmailSent={isDeletionEmailSent}
            showDeletionEmailSentModal={showDeletionEmailSentModal}
            setShowDeletionEmailSentModal={setShowDeletionEmailSentModal}
            logout={logout}
            errorMessage={errorMessage}
            user={user}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}