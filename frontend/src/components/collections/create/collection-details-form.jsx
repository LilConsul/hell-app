import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { User } from "lucide-react"

export function CollectionDetailsForm({ 
  collectionData, 
  onInputChange, 
  onContinue,
  isArchived = false,
  canEdit = true,
  createdBy = null
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Details about this test collection.</CardDescription>
        </div>
        {createdBy && (
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="mr-2 h-4 w-4" />
            <span>Created by {createdBy.first_name} {createdBy.last_name}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Collection Title</Label>
            <Input
              id="title"
              name="title"
              value={collectionData.title}
              onChange={onInputChange}
              placeholder="e.g., Advanced Algorithms Questions"
              readOnly={!canEdit || isArchived}
              className={(!canEdit || isArchived) ? "opacity-70 cursor-not-allowed" : ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={collectionData.description}
              onChange={onInputChange}
              placeholder="Provide a description of the collection content..."
              readOnly={!canEdit || isArchived}
              className={(!canEdit || isArchived) ? "opacity-70 cursor-not-allowed" : ""}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onContinue}>
          {canEdit ? "Continue to Questions" : "View Questions"}
        </Button>
      </CardFooter>
    </Card>
  )
}