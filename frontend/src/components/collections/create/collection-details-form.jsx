import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Globe, Lock } from "lucide-react"
import { Link } from "react-router-dom"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function CollectionDetailsForm({ collectionData, onInputChange, onStatusChange, onContinue }) {
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
          <div className="grid gap-2">
            <Label>Collection Status</Label>
            <RadioGroup
              defaultValue={collectionData.status}
              onValueChange={onStatusChange}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="draft" id="draft" />
                <Label htmlFor="draft" className="flex items-center">
                  <Lock className="mr-1 h-4 w-4 text-amber-500" />
                  Draft (Private)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="published" id="published" />
                <Label htmlFor="published" className="flex items-center">
                  <Globe className="mr-1 h-4 w-4 text-green-500" />
                  Public (Visible to all teachers)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" asChild>
          <Link to="/collections">Cancel</Link>
        </Button>
        <Button onClick={onContinue}>Continue to Questions</Button>
      </CardFooter>
    </Card>
  )
}