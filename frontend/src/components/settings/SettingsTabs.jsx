import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Save, User, Lock, Globe, Trash2 } from "lucide-react";
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
  handleSaveName
}) {

  return (
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

const SecurityTab = memo(function SecurityTab({ handleOpenCurrentPasswordModal }) {
  return (
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
            <h3 className="text-sm font-medium">Change Password</h3>
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
          <CardTitle>Language</CardTitle>
          <CardDescription>
            Choose your preferred language for the application interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 max-w-xs">
            <Label htmlFor="language">Select Language</Label>
            <Select value={language} onValueChange={handleChangeLanguage}>
              <SelectTrigger id="language" className="w-full">
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
  handleChangeLanguage,
  handleToggleNotifications,
  handleOpenCurrentPasswordModal,
  setShowDeleteModal
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
    <div className="w-full max-w-5xl mx-auto">
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
          />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecurityTab handleOpenCurrentPasswordModal={handleOpenCurrentPasswordModal} />
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