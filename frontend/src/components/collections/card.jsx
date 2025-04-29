import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, Copy, Edit, Eye, Globe, Library, Lock, MoreHorizontal } from "lucide-react";
import { DeleteCollectionModal } from "@/components/collections/delete-collection-modal";
import { DuplicateCollectionModal } from "@/components/collections/duplicate-collection-modal";

export function CollectionCard({ collection, onStatusChange, onDelete, onDuplicate }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleStatusChange = () => {
    const newStatus = collection.status === "published" ? "draft" : "published";
    onStatusChange(collection.id, newStatus);
  }

  const handleDuplicate = (title, description) => {
    onDuplicate(collection.id, title, description);
    setShowDuplicateModal(false);
  }

  const handleDelete = () => {
    onDelete(collection.id);
    setShowDeleteModal(false);
  }

  return (
    <>
      <Card key={collection.id} className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              {collection.status === "published" ? (
                <Globe className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <Lock className="h-5 w-5 text-amber-500 mr-2" />
              )}
              <div>
                <CardTitle className="text-xl">{collection.title}</CardTitle>
                <CardDescription className="mt-1">
                  Created by {collection.created_by.first_name} {collection.created_by.last_name} • Last updated{" "}
                  {formatDate(collection.updated_at)}
                </CardDescription>
              </div>
            </div>
            <Badge
              className={
                collection.status === "published"
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : "bg-amber-100 text-amber-800 hover:bg-amber-100"
              }
            >
              {collection.status === "published" ? "Public" : "Draft"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground mb-4">{collection.description}</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center">
              <Library className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {collection.questions ? collection.questions.length : 0} questions
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
              <Eye className="mr-2 h-4 w-4" />
              View
            </Link>
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/collections/${collection.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDuplicateModal(true)} className="cursor-pointer">
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleStatusChange} className="cursor-pointer">
                  {collection.status === "draft" ? (
                    <>
                      <Globe className="mr-2 h-4 w-4" />
                      Make Public
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Make Draft
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteModal(true)} 
                  className="cursor-pointer text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardFooter>
      </Card>

      <DeleteCollectionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
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
  )
}