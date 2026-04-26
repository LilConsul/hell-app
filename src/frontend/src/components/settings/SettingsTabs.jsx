import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot, REGEXP_ONLY_DIGITS } from "@/components/ui/input-otp";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Save, User, Lock, Globe, Trash2, ShieldCheck, ShieldAlert, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const EditableField = memo(function EditableField({
  id,
  label,
  value,
  isEditing,
  isUpdating,
  onEdit,
  onChange,
  onSave
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && isEditing && !isUpdating) {
      onSave();
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          value={value}
          disabled={!isEditing}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            !isEditing && "border-transparent bg-muted/30",
            "dark:bg-neutral-800 dark:border-neutral-700"
          )}
        />
        {isEditing ? (
          <Button size="icon" onClick={onSave} disabled={isUpdating}>
            {isUpdating ? <span className="animate-spin">⟳</span> : <Save className="h-4 w-4" />}
          </Button>
        ) : (
          <Button size="icon" variant="ghost" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
});

const AccountTab = memo(function AccountTab({
  user,
  firstName,
  lastName,
  editField,
  isUpdating,
  setEditField,
  setFirstName,
  setLastName,
  handleSaveName,
  handleFileUpload,
  handleDeletePicture,
  isPictureUpdating
}) {
  const initials = `${user?.first_name?.[0] || user?.firstName?.[0] || ""}${user?.last_name?.[0] || user?.lastName?.[0] || ""}`.trim() || "U";
  const profilePictureUrl = user?.profile_picture_url || "";
  const normalizedProfilePictureUrl = String(profilePictureUrl).trim().toLowerCase();
  const isSvgAvatar = Boolean(profilePictureUrl) && (
    normalizedProfilePictureUrl.startsWith("data:image/svg+xml")
    || normalizedProfilePictureUrl.includes("<svg")
    || normalizedProfilePictureUrl.includes("image/svg+xml")
    || /\.svg([?#].*)?$/.test(normalizedProfilePictureUrl)
  );
  const isDefaultAvatarProvider = normalizedProfilePictureUrl.includes("ui-avatars.com/api/");
  const hasProfilePicture = Boolean(profilePictureUrl) && !isSvgAvatar && !isDefaultAvatarProvider;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Update your account information and how others see you on the platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <div>
            <h3 className="text-base font-semibold">Profile Picture</h3>
            <p className="text-sm text-muted-foreground">
              Upload a profile picture to personalize your account.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max file size: 2 MB.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Avatar className="h-20 w-20 border shadow-sm">
              <AvatarImage src={profilePictureUrl} alt="Profile picture" />
              <AvatarFallback className="text-lg font-semibold">{initials.toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="w-full max-w-sm space-y-2">
              <Label htmlFor="profile-picture-upload">Choose image</Label>
              <Input
                id="profile-picture-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isPictureUpdating}
                className="bg-background hover:cursor-pointer file:mr-3 file:rounded file:border file:border-input file:bg-muted/30 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted"
              />
              {hasProfilePicture ? (
                <Button
                  variant="secondary"
                  onClick={handleDeletePicture}
                  disabled={isPictureUpdating}
                  className="w-fit"
                >
                  {isPictureUpdating ? (
                    <span className="animate-spin">⟳</span>
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Remove Picture
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            disabled
            value={user?.email || ""}
            className="bg-muted/50 dark:bg-neutral-800 dark:border-neutral-700"
          />
          <p className="text-xs text-muted-foreground">
            Your email cannot be changed. Contact support if you need to update it.
          </p>
        </div>

        <EditableField
          id="firstName"
          label="First Name"
          value={firstName}
          isEditing={editField === "firstName"}
          isUpdating={isUpdating}
          onEdit={() => setEditField("firstName")}
          onChange={setFirstName}
          onSave={() => handleSaveName("firstName")}
        />

        <EditableField
          id="lastName"
          label="Last Name"
          value={lastName}
          isEditing={editField === "lastName"}
          isUpdating={isUpdating}
          onEdit={() => setEditField("lastName")}
          onChange={setLastName}
          onSave={() => handleSaveName("lastName")}
        />
      </CardContent>
    </Card>
  );
});

const SecurityTab = memo(function SecurityTab({
  user,
  handleOpenCurrentPasswordModal,
  mfaSetupData,
  mfaSetupCode,
  setMfaSetupCode,
  isMfaSettingUp,
  isMfaVerifying,
  handleEnableMfa,
  handleVerifyMfa,
  showMfaDisablePrompt,
  setShowMfaDisablePrompt,
  mfaDisableCode,
  setMfaDisableCode,
  isMfaDisabling,
  handleStartDisableMfa,
  handleDisableMfa
}) {
  const isMfaEnabled = Boolean(user?.mfa_enabled);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedDisableSecret, setCopiedDisableSecret] = useState(false);
  const [isSetupOtpInputUnlocked, setIsSetupOtpInputUnlocked] = useState(false);
  const [isDisableOtpInputUnlocked, setIsDisableOtpInputUnlocked] = useState(false);

  const handleCopySecret = (secret) => {
    navigator.clipboard.writeText(secret).then(() => {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    });
  };

  const handleCopyDisableSecret = (secret) => {
    navigator.clipboard.writeText(secret).then(() => {
      setCopiedDisableSecret(true);
      setTimeout(() => setCopiedDisableSecret(false), 2000);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>
          Update your password and manage multi-factor authentication.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {isMfaEnabled ? (
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-amber-600" />
              )}
              <h3 className="text-sm font-medium">Change Password</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              We recommend updating your password regularly for security.
            </p>
          </div>
          <Button variant="outline" onClick={handleOpenCurrentPasswordModal}>
            Change Password
          </Button>
        </div>

        <div className="rounded-lg border p-4 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-medium">Two-Factor Authentication (MFA)</h3>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                  isMfaEnabled
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                )}
              >
                {isMfaEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Add an authenticator app for an extra verification step when signing in.
            </p>
          </div>

          {!isMfaEnabled ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={handleEnableMfa} disabled={isMfaSettingUp}>
                  {isMfaSettingUp ? <span className="animate-spin">⟳</span> : "Enable 2FA"}
                </Button>
                {mfaSetupData ? (
                  <span className="text-sm text-muted-foreground">
                    Scan the QR code, then enter the 6-digit code from your authenticator app.
                  </span>
                ) : null}
              </div>

              {mfaSetupData ? (
                <div className="grid gap-4 md:grid-cols-[auto,1fr] md:items-start rounded-lg border bg-muted/20 p-4">
                  <div className="flex flex-col items-center gap-3 rounded-lg bg-background p-4">
                    {mfaSetupData.qr_code_url ? (
                      <div className="rounded-lg border bg-white p-3">
                        <img src={mfaSetupData.qr_code_url} alt="2FA QR Code" className="w-44 h-44" />
                      </div>
                    ) : null}
                    {mfaSetupData.secret ? (
                      <div className="w-full space-y-2">
                        <div className="text-center text-xs text-muted-foreground">Manual secret:</div>
                        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
                          <code className="flex-1 text-center font-mono text-sm break-all text-foreground">
                            {mfaSetupData.secret}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopySecret(mfaSetupData.secret)}
                            className="h-8 w-8 p-0 flex-shrink-0"
                            title="Copy secret"
                          >
                            {copiedSecret ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="mfa-setup-code">Verification code</Label>
                    <InputOTP
                      id="mfa-setup-code"
                      name="mfa-setup-code"
                      maxLength={6}
                      value={mfaSetupCode}
                      pattern={REGEXP_ONLY_DIGITS}
                      onChange={(value) => setMfaSetupCode(value.replace(/\D/g, "").slice(0, 6))}
                      onComplete={(value) => setMfaSetupCode(value.replace(/\D/g, "").slice(0, 6))}
                      onMouseDown={() => setIsSetupOtpInputUnlocked(true)}
                      onTouchStart={() => setIsSetupOtpInputUnlocked(true)}
                      onFocus={() => setIsSetupOtpInputUnlocked(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && mfaSetupCode.length === 6 && !isMfaVerifying) {
                          e.preventDefault();
                          handleVerifyMfa();
                        }
                      }}
                      inputMode="numeric"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      pushPasswordManagerStrategy="none"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      readOnly={!isSetupOtpInputUnlocked}
                      disabled={isMfaVerifying}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        onClick={handleVerifyMfa}
                        disabled={isMfaVerifying || mfaSetupCode.length !== 6}
                      >
                        {isMfaVerifying ? <span className="animate-spin">⟳</span> : "Verify & Enable"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setMfaSetupCode("");
                        }}
                        disabled={isMfaVerifying}
                      >
                        Clear Code
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="destructive"
                  onClick={handleStartDisableMfa}
                  disabled={isMfaDisabling}
                >
                  {isMfaDisabling ? <span className="animate-spin">⟳</span> : "Disable 2FA"}
                </Button>
                <span className="text-sm text-muted-foreground">
                  You will need to confirm with a 6-digit code from your authenticator app.
                </span>
              </div>

              {showMfaDisablePrompt ? (
                <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                  <Label htmlFor="mfa-disable-code">Authenticator code</Label>
                  <InputOTP
                    id="mfa-disable-code"
                    name="mfa-disable-code"
                    maxLength={6}
                    value={mfaDisableCode}
                    pattern={REGEXP_ONLY_DIGITS}
                    onChange={(value) => setMfaDisableCode(value.replace(/\D/g, "").slice(0, 6))}
                    onComplete={(value) => setMfaDisableCode(value.replace(/\D/g, "").slice(0, 6))}
                    onMouseDown={() => setIsDisableOtpInputUnlocked(true)}
                    onTouchStart={() => setIsDisableOtpInputUnlocked(true)}
                    onFocus={() => setIsDisableOtpInputUnlocked(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && mfaDisableCode.length === 6 && !isMfaDisabling) {
                        e.preventDefault();
                        handleDisableMfa();
                      }
                    }}
                    inputMode="numeric"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    pushPasswordManagerStrategy="none"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    readOnly={!isDisableOtpInputUnlocked}
                    disabled={isMfaDisabling}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleDisableMfa}
                      disabled={isMfaDisabling || mfaDisableCode.length !== 6}
                    >
                      {isMfaDisabling ? <span className="animate-spin">⟳</span> : "Disable 2FA"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowMfaDisablePrompt(false);
                        setMfaDisableCode("");
                      }}
                      disabled={isMfaDisabling}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

const PreferencesTab = memo(function PreferencesTab({
  language,
  notifications,
  handleChangeLanguage,
  handleToggleNotifications
}) {
  return (
    <>

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
              <h3 className="text-sm font-medium">Email Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Receive updates, results, and important announcements via email.
              </p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={handleToggleNotifications}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
});

const DangerTab = memo(function DangerTab({ setShowDeleteModal }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-destructive" />
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
        <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
          Delete Account
        </Button>
      </CardContent>
    </Card>
  );
});

export const SettingsTabs = memo(function SettingsTabs({
  activeTab,
  setActiveTab,
  user,
  firstName,
  lastName,
  language,
  notifications,
  editField,
  setEditField,
  isUpdating,
  setFirstName,
  setLastName,
  handleSaveName,
  handleFileUpload,
  handleDeletePicture,
  isPictureUpdating,
  handleChangeLanguage,
  handleToggleNotifications,
  handleOpenCurrentPasswordModal,
  setShowDeleteModal,
  mfaSetupData,
  mfaSetupCode,
  setMfaSetupCode,
  isMfaSettingUp,
  isMfaVerifying,
  handleEnableMfa,
  handleVerifyMfa,
  showMfaDisablePrompt,
  setShowMfaDisablePrompt,
  mfaDisableCode,
  setMfaDisableCode,
  isMfaDisabling,
  handleStartDisableMfa,
  handleDisableMfa
}) {
  const tabIcons = {
    account: <User className="h-4 w-4" />,
    security: <Lock className="h-4 w-4" />,
    preferences: <Globe className="h-4 w-4" />,
    danger: <Trash2 className="h-4 w-4" />
  };
  
  const tabNames = {
    account: "Account",
    security: "Security",
    preferences: "Preferences",
    danger: "Danger Zone"
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          {Object.keys(tabIcons).map((tab) => (
            <TabsTrigger key={tab} value={tab} className="flex items-center gap-2">
              {tabIcons[tab]}
              <span className="hidden sm:inline">{tabNames[tab]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <AccountTab
            user={user}
            firstName={firstName}
            lastName={lastName}
            editField={editField}
            isUpdating={isUpdating}
            setEditField={setEditField}
            setFirstName={setFirstName}
            setLastName={setLastName}
            handleSaveName={handleSaveName}
            handleFileUpload={handleFileUpload}
            handleDeletePicture={handleDeletePicture}
            isPictureUpdating={isPictureUpdating}
          />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecurityTab
            user={user}
            handleOpenCurrentPasswordModal={handleOpenCurrentPasswordModal}
            mfaSetupData={mfaSetupData}
            mfaSetupCode={mfaSetupCode}
            setMfaSetupCode={setMfaSetupCode}
            isMfaSettingUp={isMfaSettingUp}
            isMfaVerifying={isMfaVerifying}
            handleEnableMfa={handleEnableMfa}
            handleVerifyMfa={handleVerifyMfa}
            showMfaDisablePrompt={showMfaDisablePrompt}
            setShowMfaDisablePrompt={setShowMfaDisablePrompt}
            mfaDisableCode={mfaDisableCode}
            setMfaDisableCode={setMfaDisableCode}
            isMfaDisabling={isMfaDisabling}
            handleStartDisableMfa={handleStartDisableMfa}
            handleDisableMfa={handleDisableMfa}
          />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <PreferencesTab
            language={language}
            notifications={notifications}
            handleChangeLanguage={handleChangeLanguage}
            handleToggleNotifications={handleToggleNotifications}
          />
        </TabsContent>

        <TabsContent value="danger" className="space-y-4">
          <DangerTab setShowDeleteModal={setShowDeleteModal} />
        </TabsContent>
      </Tabs>
    </div>
  );
});