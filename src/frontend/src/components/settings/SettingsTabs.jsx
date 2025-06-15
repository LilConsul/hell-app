import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Pencil, 
  Save, 
  User, 
  Lock, 
  Globe, 
  Bell, 
  Trash2 
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SettingsTabs({
    // Tab state
    activeTab,
    setActiveTab,
    
    // User data
    user,
    firstName,
    lastName,
    language,
    notifications,
    
    // Form state
    editField,
    setEditField,
    isUpdating,
    
    // State setters
    setFirstName,
    setLastName,
    
    // Event handlers
    handleSaveName,
    handleChangeLanguage,
    handleToggleNotifications,
    handleOpenCurrentPasswordModal,
    setShowDeleteModal
  }) {
  return (
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
  size="sm" 
  onClick={() => setShowDeleteModal(true)}
  className="bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-400 text-white font-medium"
>
  Delete Account
</Button>

          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}