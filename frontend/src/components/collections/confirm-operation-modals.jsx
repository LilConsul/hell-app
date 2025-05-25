import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Archive, Copy } from "lucide-react";


export function DeleteCollectionModal({ isOpen, onClose, onDelete, onArchive, collectionTitle, isArchived = false }) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center text-red-600 dark:text-red-400">
            <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-1 mr-2">
              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            Delete Collection
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <span className="font-semibold text-foreground">{collectionTitle}</span>? This action cannot
            be undone and all questions in this collection will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          {!isArchived && (
            <div className="flex flex-1 justify-start">
              <AlertDialogAction
                onClick={onArchive}
                className="bg-slate-600 text-white hover:bg-slate-700 flex items-center"
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive Instead
              </AlertDialogAction>
            </div>
          )}
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ArchiveConfirmationModal({ isOpen, onClose, onArchive, collectionTitle }) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center text-slate-600 dark:text-slate-400">
            <div className="rounded-full bg-slate-100 dark:bg-slate-900/30 p-1 mr-2">
              <Archive className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
            Archive Collection
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to archive <span className="font-semibold text-foreground">{collectionTitle}</span>? 
            Archiving will hide this collection from active use but preserve its contents.
            You can restore archived collections later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onArchive}
            className="bg-slate-600 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center"
          >
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


export function DuplicateCollectionModal({ isOpen, onClose, onConfirm, originalTitle, originalDescription }) {
  const [title, setTitle] = useState(`${originalTitle} (Copy)`);
  const [description, setDescription] = useState(originalDescription);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(title, description);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Copy className="mr-2 h-5 w-5" />
              Duplicate Collection
            </DialogTitle>
            <DialogDescription>Create a copy of this collection with a new title and description.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Collection title"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Collection description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Duplicate</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}