import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function CollectionDetailsForm({ collectionData, onInputChange, onContinue }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>Set the basic details for your test collection.</CardDescription>
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
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onContinue}>Continue to Questions</Button>
      </CardFooter>
    </Card>
  )
}