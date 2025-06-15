import { Button } from "@/components/ui/button"
import { CheckCircle2, CircleDot, Plus } from "lucide-react"

export function QuestionControls({ onAddQuestion }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium">Collection Questions</h3>
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={() => onAddQuestion("mcq")}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Multiple Choice
        </Button>
        <Button variant="outline" size="sm" onClick={() => onAddQuestion("singlechoice")}>
          <CircleDot className="mr-2 h-4 w-4" />
          Single Choice
        </Button>
        <Button variant="outline" size="sm" onClick={() => onAddQuestion("shortanswer")}>
          <Plus className="mr-2 h-4 w-4" />
          Short Answer
        </Button>
      </div>
    </div>
  )
}