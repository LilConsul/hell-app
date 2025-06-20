import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, Bell } from "lucide-react";

export function ExamSettingsTab({
  examSettings,
  setExamSettings
}) {
  const handleSecurityChange = (field, value) => {
    setExamSettings(prev => ({
      ...prev,
      security_settings: {
        ...prev.security_settings,
        [field]: value
      }
    }));
  };

  const handleNotificationChange = (field, value) => {
    setExamSettings(prev => ({
      ...prev,
      notification_settings: {
        ...prev.notification_settings,
        [field]: value
      }
    }));
  };

  const handleReminderToggle = (reminder) => {
    const currentReminders = examSettings.notification_settings.reminders;
    const newReminders = currentReminders.includes(reminder)
      ? currentReminders.filter(r => r !== reminder)
      : [...currentReminders, reminder];
    
    handleNotificationChange('reminders', newReminders);
  };

  const handleTabSwitchLimitChange = (e) => {
    const value = e.target.value;
    // Allow empty string for clearing, otherwise parse as number
    if (value === '') {
      handleSecurityChange('tab_switch_limit', '');
    } else {
      const numValue = parseInt(value);
      if (!isNaN(numValue) && numValue >= 0) {
        handleSecurityChange('tab_switch_limit', numValue);
      }
    }
  };

  const handleTabSwitchLimitFocus = (e) => {
    // Select all text when input is focused
    e.target.select();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Exam Delivery Settings
          </CardTitle>
          <CardDescription>Configure how the exam will be delivered to students.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="shuffle-questions"
              checked={examSettings.security_settings.shuffle_questions}
              onCheckedChange={(checked) => handleSecurityChange('shuffle_questions', checked)}
            />
            <Label htmlFor="shuffle-questions">Randomize question order</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="allow-review"
              checked={examSettings.security_settings.allow_review}
              onCheckedChange={(checked) => handleSecurityChange('allow_review', checked)}
            />
            <Label htmlFor="allow-review">Allow students to review answers before submission</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Monitoring
          </CardTitle>
          <CardDescription>Additional security measures for exam integrity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="prevent-tab-switching"
              checked={examSettings.security_settings.prevent_tab_switching}
              onCheckedChange={(checked) => handleSecurityChange('prevent_tab_switching', checked)}
            />
            <Label htmlFor="prevent-tab-switching">Prevent tab switching during exam</Label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tab-switch-limit">Tab Switch Limit</Label>
            <Input
              id="tab-switch-limit"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={examSettings.security_settings.tab_switch_limit === 0 ? '' : examSettings.security_settings.tab_switch_limit}
              onChange={handleTabSwitchLimitChange}
              onFocus={handleTabSwitchLimitFocus}
              disabled={!examSettings.security_settings.prevent_tab_switching}
              placeholder="Enter limit (0 = No limit)"
              className="w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <p className="text-sm text-muted-foreground">
              Maximum number of tab switches allowed (leave empty or 0 for no limit)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>Configure exam reminders and notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="reminder-enabled"
              checked={examSettings.notification_settings.reminder_enabled}
              onCheckedChange={(checked) => handleNotificationChange('reminder_enabled', checked)}
            />
            <Label htmlFor="reminder-enabled">Enable exam reminders</Label>
          </div>
          
          {examSettings.notification_settings.reminder_enabled && (
            <div className="space-y-3">
              <Label>Reminder Schedule</Label>
              <div className="flex flex-wrap gap-2">
                {['2d', '1d', '12h', '6h', '1h', '30m', '20m', '10m'].map(reminder => (
                  <div key={reminder} className="flex items-center space-x-2">
                    <Badge 
                      variant={examSettings.notification_settings.reminders.includes(reminder) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleReminderToggle(reminder)}
                    >
                      {reminder === '2d' ? '2 days' :
                       reminder === '1d' ? '1 day' :
                       reminder === '12h' ? '12 hours' :
                       reminder === '6h' ? '6 hours' :
                       reminder === '1h' ? '1 hour' :
                       reminder === '30m' ? '30 minutes' :
                       reminder === '20m' ? '20 minutes' :
                       reminder === '10m' ? '10 minutes' : reminder}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Click to toggle reminder times. Selected: {examSettings.notification_settings.reminders.length} reminders
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}