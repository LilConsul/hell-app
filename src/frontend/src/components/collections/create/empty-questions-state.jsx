import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Library, Plus, CheckCircle2, CircleDot } from "lucide-react"

export function EmptyQuestionsState({ onAddQuestion }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-10">
        <Library className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-center text-muted-foreground mb-4">No questions added yet</p>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => onAddQuestion("mcq")}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Add Multiple Choice
          </Button>
          <Button variant="outline" onClick={() => onAddQuestion("singlechoice")}>
            <CircleDot className="mr-2 h-4 w-4" />
            Add Single Choice
          </Button>
          <Button variant="outline" onClick={() => onAddQuestion("shortanswer")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Short Answer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}