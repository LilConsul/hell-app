import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Archive, Calendar, Copy, NotebookPen, Eye, Globe, Library, Lock, MoreHorizontal } from "lucide-react";
import { DeleteCollectionModal, DuplicateCollectionModal, ArchiveConfirmationModal} from "@/components/collections/confirm-operation-modals";

export function CollectionCard({ collection, onStatusChange, onDelete, onDuplicate, canEdit, onFilterByUser }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleStatusChange = (newStatus) => {
    onStatusChange(collection.id, newStatus);
  };

  const handleDuplicate = (title, description) => {
    onDuplicate(collection.id, title, description);
    setShowDuplicateModal(false);
  };

  const handleDelete = () => {
    onDelete(collection.id);
    setShowDeleteModal(false);
  };

  const handleArchive = () => {
    onStatusChange(collection.id, "archived");
    setShowArchiveModal(false);
  };

  const isArchived = collection.status === "archived";

  const renderStatusIcon = () => {
    switch (collection.status) {
      case "published":
        return <Globe className="h-5 w-5 text-green-500 mr-2" />;
      case "archived":
        return <Archive className="h-5 w-5 text-slate-500 mr-2" />;
      default:
        return <Lock className="h-5 w-5 text-amber-500 mr-2" />;
    }
  };

  const renderStatusBadge = () => {
    switch (collection.status) {
      case "published":
        return (
          <Badge className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 hover:bg-green-100">
            Public
          </Badge>
        );
      case "archived":
        return (
          <Badge className="bg-slate-100 dark:bg-slate-900/20 text-slate-800 dark:text-slate-400 hover:bg-slate-100">
            Archived
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 hover:bg-amber-100">
            Draft
          </Badge>
        );
    }
  };

  const handleCreatorClick = (e) => {
    if (onFilterByUser && collection.created_by) {
      e.preventDefault();
      onFilterByUser(
        collection.created_by.id, 
        `${collection.created_by.first_name} ${collection.created_by.last_name}`
      );
    }
  };

  return (
    <>
      <Card className={`overflow-hidden ${isArchived ? "opacity-75" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              {renderStatusIcon()}
              <div>
                <CardTitle className="text-xl">{collection.title}</CardTitle>
                <CardDescription className="mt-1">
                  Created by{" "}
                  <button 
                    className="hover:underline focus:outline-none" 
                    onClick={handleCreatorClick}
                  >
                    {collection.created_by.first_name} {collection.created_by.last_name}
                  </button>{" "}
                  • Last updated{' '}
                  {formatDate(collection.updated_at)}
                </CardDescription>
              </div>
            </div>
            {renderStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground mb-4">{collection.description}</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center">
              <Library className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {collection.question_count || 0}{' '}
                {collection.question_count === 1 ? 'question' : 'questions'}
              </span>
            </div>
            {collection.used_in_exams > 0 && (
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Used in {collection.used_in_exams} tests</span>
              </div>
            )}
          </div>
        </CardContent>
        <Separator />
        <CardFooter className="flex justify-between pt-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/collections/${collection.id}`}>
              <Eye className="mr-2 h-4 w-4" /> View
            </Link>
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/exams/new?collectionId=${collection.id}`}>
                <NotebookPen className="mr-2 h-4 w-4" /> Create Exam
              </Link>
            </Button>
            {canEdit ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setShowDuplicateModal(true)}
                    className="cursor-pointer"
                  >
                    <Copy className="mr-2 h-4 w-4" /> Duplicate
                  </DropdownMenuItem>
                  {collection.status === "draft" && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("published")}
                      className="cursor-pointer"
                    >
                      <Globe className="mr-2 h-4 w-4" /> Make Public
                    </DropdownMenuItem>
                  )}
                  {collection.status === "published" && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("draft")}
                      className="cursor-pointer"
                    >
                      <Lock className="mr-2 h-4 w-4" /> Make Draft
                    </DropdownMenuItem>
                  )}
                  {(collection.status === "draft" || collection.status === "published") && (
                    <DropdownMenuItem
                      onClick={() => setShowArchiveModal(true)}
                      className="cursor-pointer"
                    >
                      <Archive className="mr-2 h-4 w-4" /> Archive
                    </DropdownMenuItem>
                  )}
                  {collection.status === "archived" && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("draft")}
                      className="cursor-pointer"
                    >
                      <Lock className="mr-2 h-4 w-4" /> Restore to Draft
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => setShowDeleteModal(true)}
                    className="cursor-pointer text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowDuplicateModal(true)}>
                <Copy className="mr-2 h-4 w-4" /> Duplicate
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <DeleteCollectionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDelete}
        onArchive={handleArchive}
        collectionTitle={collection.title}
        isArchived={isArchived}
      />

      <ArchiveConfirmationModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onArchive={handleArchive}
        collectionTitle={collection.title}
      />

      <DuplicateCollectionModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        onConfirm={handleDuplicate}
        originalTitle={collection.title}
        originalDescription={collection.description}
      />
    </>
  );
}