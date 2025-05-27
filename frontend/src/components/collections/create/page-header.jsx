import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, Lock, Save, Archive, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatusAlerts } from "./status-alerts";
import { ArchiveConfirmationModal } from "../confirm-operation-modals";

export function PageHeader({ 
  title = "Create Test Collection",
  status,
  onStatusChange, 
  onSave, 
  onDuplicateClick, 
  error = false,
  errorMessage = "There was an error. Please try again.",
  canEdit = true,
  isNewCollection = true
}) {
  const [isSticky, setIsSticky] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDisplayTitle = () => {
    if (isNewCollection) return "Create Test Collection";
    if (!canEdit) return `View Collection${title ? ': ' + title : ''}`;
    return `Edit ${title}`;
  };

  const getDisplaySubtitle = () => {
    if (isNewCollection) return "Create a new collection of test questions";
    if (!canEdit) return "View this collection of test questions";
    if (status === "archived") return "This collection is archived and cannot be edited";
    return "Edit collection details and questions";
  };

  const getStatusButtonVariant = () => {
    switch(status) {
      case "published":
        return "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/40";
      case "archived":
        return "bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900/40";
      default: // draft
        return "";
    }
  };

  const renderStatusIcon = () => {
    switch(status) {
      case "published":
        return <Globe className="mr-2 h-4 w-4" />;
      case "archived":
        return <Archive className="mr-2 h-4 w-4" />;
      default: // draft
        return <Lock className="mr-2 h-4 w-4" />;
    }
  };

  const getStatusDisplay = () => {
    switch(status) {
      case "published":
        return "Public";
      case "archived":
        return "Archived";
      default: // draft
        return "Draft";
    }
  };
  
  const handleArchiveClick = () => {
    setIsArchiveModalOpen(true);
  };
  
  const handleArchiveConfirm = () => {
    onStatusChange("archived");
    setIsArchiveModalOpen(false);
  };

  return (
    <>
      <div 
        className={`bg-background/90 backdrop-blur-sm transition-all duration-200 z-10 
          ${isSticky ? 'sticky top-12' : ''}`}
      >
        <div className="py-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Button variant="ghost" size="sm" className="mr-2" asChild>
                  <Link to="/collections">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Link>
                </Button>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">{getDisplayTitle()}</h2>
                  <p className="text-muted-foreground">{getDisplaySubtitle()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Status button/dropdown, Show static if user can't edit */}
                {canEdit ? (
                  status === "archived" ? (
                    // For archived status, show a dropdown with restore option
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className={getStatusButtonVariant()}
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archived
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onStatusChange("draft")} className="cursor-pointer">
                          <Lock className="mr-2 h-4 w-4" />
                          Restore to Draft
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    // For non-archived statuses, show a dropdown with status options
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className={getStatusButtonVariant()}
                        >
                          {renderStatusIcon()}
                          {getStatusDisplay()}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {status !== "draft" && (
                          <DropdownMenuItem onClick={() => onStatusChange("draft")} className="cursor-pointer">
                            <Lock className="mr-2 h-4 w-4" />
                            Make Draft
                          </DropdownMenuItem>
                        )}
                        {status !== "published" && (
                          <DropdownMenuItem onClick={() => onStatusChange("published")} className="cursor-pointer">
                            <Globe className="mr-2 h-4 w-4" />
                            Make Public
                          </DropdownMenuItem>
                        )}
                        {status !== "archived" && (
                          <DropdownMenuItem onClick={handleArchiveClick} className="cursor-pointer">
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                ) : (
                  // For other user's just show status
                  <Button
                    variant="outline"
                    className={getStatusButtonVariant()}
                  >
                    {renderStatusIcon()}
                    {getStatusDisplay()}
                  </Button>
                )}
                
                {canEdit ? (
                  <Button onClick={onSave} disabled={status === "archived"}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Collection
                  </Button>
                ) : (
                  <Button onClick={onDuplicateClick}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate Collection
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-screen-2xl mx-auto">
          <StatusAlerts 
            error={error}
            errorMessage={errorMessage}
            status={status}
            className="pb-4"
          />
        </div>
      </div>
      <ArchiveConfirmationModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onArchive={handleArchiveConfirm}
        collectionTitle={title}
      />
    </>
  );
}
