import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export const ValueSelector = ({
  id,
  value = 1,
  onChange,
  disabled = false,
  customTitle = "Custom value",
  unitLabel = "point"
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value?.toString() || "1")
  const inputRef = useRef(null)
  
  const presets = ["1", "2", "3", "5"]

  const formatUnit = (num) => {
    const count = parseInt(num, 10)
    return `${count} ${unitLabel}${count !== 1 ? "s" : ""}`
  }

  const handleSelect = (preset) => {
    const numValue = parseInt(preset, 10)
    if (numValue !== value) {
      onChange(numValue)
    }
    setInputValue(preset)
    setIsOpen(false)
  }

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
  }

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue, 10)
    if (!isNaN(numValue) && numValue > 0) {
      if (numValue !== value) {
        onChange(numValue)
      }
    } else {
      setInputValue(value?.toString() || "1")
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleInputBlur()
      setIsOpen(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={disabled ? undefined : setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-between",
            disabled && "opacity-50"
          )}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <span>{formatUnit(value)}</span>
          <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-[200px] p-0" 
        align="start"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          setTimeout(() => {
            inputRef.current?.focus()
            inputRef.current?.select()
          }, 0)
        }}
      >
        <div className="p-3 border-b">
          <div className="mb-2 text-sm font-medium">{customTitle}</div>
          <Input
            ref={inputRef}
            type="number"
            min="1"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            className="h-8"
            disabled={disabled}
            aria-label={customTitle}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Please enter a positive integer
          </p>
        </div>

        <div className="py-1" role="menu" aria-orientation="vertical">
          {presets.map((preset) => (
            <div
              key={preset}
              role="menuitem"
              tabIndex={0}
              className={cn(
                "flex cursor-pointer select-none items-center py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                value?.toString() === preset && "font-medium bg-accent/50"
              )}
              onClick={() => !disabled && handleSelect(preset)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  !disabled && handleSelect(preset)
                }
              }}
            >
              {formatUnit(preset)}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}