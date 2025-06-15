import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  PlayCircle, 
  PauseCircle, 
  Clock,
  AlertTriangle,
  Timer,
  XCircle,
  Calendar,
  Shuffle,
  Lock,
  Eye,
  List,
  Unlock,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = {
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Clock,
  AlertTriangle,
  Timer,
  XCircle,
  Calendar,
  Shuffle,
  Lock,
  Eye,
  List,
  Unlock,
  EyeOff
};

export function StatusBadge({ 
  config, 
  showIcon = true, 
  showBadge = true, 
  showText = false,
  size = "default",
  variant = "default",
  className = "",
  onClick
}) {
  if (!config) return null;
  
  const IconComponent = iconMap[config.icon];
  
  // Size configurations
  const sizeConfig = {
    xs: { icon: "h-3 w-3", text: "text-xs", padding: "px-1.5 py-0.5" },
    sm: { icon: "h-3 w-3", text: "text-xs", padding: "px-2 py-0.5" },
    default: { icon: "h-4 w-4", text: "text-xs", padding: "px-2 py-0.5" },
    lg: { icon: "h-5 w-5", text: "text-sm", padding: "px-3 py-1.5" }
  };
  
  const currentSize = sizeConfig[size] || sizeConfig.default;
  
  // Clean container classes
  const containerClasses = cn(
    "inline-flex items-center gap-2",
    onClick && "cursor-pointer hover:opacity-80 transition-opacity duration-200",
    className
  );
  
  // Badge classes with enhanced styling only for large
  const badgeClasses = cn(
    currentSize.text,
    currentSize.padding,
    size === "lg" ? "font-medium border-2 shadow-sm" : "font-medium",
    config.badge?.className
  );
  
  const badgeVariant = variant !== "default" ? variant : config.badge?.variant || "default";
  
  return (
    <div className={containerClasses} onClick={onClick}>
      {showBadge && (
        <Badge 
          variant={badgeVariant} 
          className={cn(badgeClasses, "flex items-center gap-1.5")}
        >
          {showIcon && IconComponent && (
            <IconComponent className={currentSize.icon} />
          )}
          {config.badge?.text || config.text || "Status"}
        </Badge>
      )}
      
      {showText && !showBadge && (
        <span className={cn(
          "font-medium flex items-center gap-1.5",
          currentSize.text,
          config.color || "text-gray-500"
        )}>
          {showIcon && IconComponent && (
            <IconComponent className={currentSize.icon} />
          )}
          {config.badge?.text || config.text || "Status"}
        </span>
      )}
    </div>
  );
}