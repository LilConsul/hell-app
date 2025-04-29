import { useState } from "react";
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
import { Copy } from "lucide-react";

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
            <Button type="button" variant="outline" onClick={onClose} className="text-white">
              Cancel
            </Button>
            <Button type="submit">Duplicate</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}