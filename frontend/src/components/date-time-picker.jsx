import { useState, useRef, useMemo, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function MaskedDateTimeInput({ value, onChange, placeholder, disabled, className }) {
  const inputRef = useRef(null);
  const [displayValue, setDisplayValue] = useState("DD/MM/YYYY HH:MM");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [dateTimeFields, setDateTimeFields] = useState({ 
    day: "", 
    month: "", 
    year: "", 
    hour: "", 
    minute: "" 
  });

  const fieldPositions = {
    day: { start: 0, end: 2, max: 31, min: 1 },
    month: { start: 3, end: 5, max: 12, min: 1 },
    year: { start: 6, end: 10, max: 2099, min: 1900 },
    hour: { start: 11, end: 13, max: 23, min: 0 },
    minute: { start: 14, end: 16, max: 59, min: 0 }
  };

  useEffect(() => {
    if (value) {
      const parsedDate = typeof value === "string" ? new Date(value) : value;
      if (!isNaN(parsedDate.getTime())) {
        const extractedFields = {
          day: String(parsedDate.getDate()).padStart(2, '0'),
          month: String(parsedDate.getMonth() + 1).padStart(2, '0'),
          year: String(parsedDate.getFullYear()),
          hour: String(parsedDate.getHours()).padStart(2, '0'),
          minute: String(parsedDate.getMinutes()).padStart(2, '0')
        };
        setDateTimeFields(extractedFields);
        setDisplayValue(`${extractedFields.day}/${extractedFields.month}/${extractedFields.year} ${extractedFields.hour}:${extractedFields.minute}`);
      }
    } else {
      setDateTimeFields({ day: "", month: "", year: "", hour: "", minute: "" });
      setDisplayValue("DD/MM/YYYY HH:MM");
    }
  }, [value]);

  const updateDisplayValueFromFields = fieldValues => setDisplayValue(
    `${fieldValues.day||'DD'}/${fieldValues.month||'MM'}/${fieldValues.year||'YYYY'} ${fieldValues.hour||'HH'}:${fieldValues.minute||'MM'}`
  );

  // Determines which field the cursor is currently positioned in
  const getCurrentFieldFromCursor = cursorPos => Object.entries(fieldPositions)
    .find(([,position]) => cursorPos >= position.start && cursorPos <= position.end)?.[0] || 'day';

  // Constructs and emits a complete DateTime if all required fields are filled
  const tryEmitCompleteDateTime = fieldValues => {
    const { day, month, year, hour, minute } = fieldValues;
    if (day.length>=2 && month.length>=2 && year.length===4 && hour.length>=2 && minute.length>=2) {
      const constructedDateTime = new Date(+year, +month-1, +day, +hour, +minute);
      if (!isNaN(constructedDateTime)) onChange?.(constructedDateTime);
    }
  };

  // Moves cursor to the next field after completing current field input
  const moveToNextField = currentFieldName => {
    const fieldOrder = ['day','month','year','hour','minute'];
    const currentIndex = fieldOrder.indexOf(currentFieldName);
    if (currentIndex < fieldOrder.length - 1) {
      const nextFieldName = fieldOrder[currentIndex+1];
      const { start, end } = fieldPositions[nextFieldName];
      setCursorPosition(start);
      setTimeout(() => inputRef.current?.setSelectionRange(start, end), 0);
    }
  };

  const handleKeyDown = keyEvent => {
    const currentFieldName = getCurrentFieldFromCursor(cursorPosition);
    const currentFieldValue = dateTimeFields[currentFieldName];
    
    if (/\d/.test(keyEvent.key)) {
      keyEvent.preventDefault();
      const maxFieldLength = currentFieldName==='year'?4:2;
      let newFieldValue = keyEvent.key;
      
      // If field isn't full, append to existing value; if full, replace entirely
      if (currentFieldValue.length < maxFieldLength) {
        newFieldValue = currentFieldValue + keyEvent.key;
      }
      
      // Validate against field maximum
      const numericValue = +newFieldValue;
      if (!isNaN(numericValue) && numericValue > fieldPositions[currentFieldName].max) {
        newFieldValue = String(fieldPositions[currentFieldName].max).padStart(maxFieldLength, '0');
      }
      
      const updatedFields = { ...dateTimeFields, [currentFieldName]: newFieldValue };
      setDateTimeFields(updatedFields); 
      updateDisplayValueFromFields(updatedFields); 
      tryEmitCompleteDateTime(updatedFields);
      
      if (newFieldValue.length === maxFieldLength) moveToNextField(currentFieldName);
    } else if (keyEvent.key==='Backspace') {
      keyEvent.preventDefault();
      if (currentFieldValue) {
        const truncatedValue = currentFieldValue.slice(0,-1);
        const updatedFields = { ...dateTimeFields, [currentFieldName]: truncatedValue };
        setDateTimeFields(updatedFields); 
        updateDisplayValueFromFields(updatedFields); 
        tryEmitCompleteDateTime(updatedFields);
      }
    } else if (['ArrowLeft','ArrowRight'].includes(keyEvent.key)) {
      keyEvent.preventDefault();
      const direction = keyEvent.key==='ArrowLeft'?-1:1;
      const newPosition = Math.max(0, Math.min(displayValue.length, cursorPosition + direction));
      setCursorPosition(newPosition);
      inputRef.current?.setSelectionRange(newPosition, newPosition);
    }
  };

  // Selects entire field when clicking anywhere within it
  const handleInputClick = clickEvent => {
    const clickPosition = clickEvent.target.selectionStart;
    const clickedFieldName = getCurrentFieldFromCursor(clickPosition);
    const { start, end } = fieldPositions[clickedFieldName];
    setCursorPosition(start);
    setTimeout(() => inputRef.current?.setSelectionRange(start, end), 0);
  };

  // Focuses on first empty field, or day field if all are filled
  const handleInputFocus = () => {
    const firstEmptyField = Object.entries(dateTimeFields).find(([,value]) => !value)?.[0] || 'day';
    const { start, end } = fieldPositions[firstEmptyField];
    setTimeout(() => inputRef.current?.setSelectionRange(start, end), 0);
  };

  return (
    <Input 
      ref={inputRef}
      value={displayValue}
      onKeyDown={handleKeyDown}
      onClick={handleInputClick}
      onFocus={handleInputFocus}
      readOnly 
      placeholder={placeholder}
      disabled={disabled} 
      className={cn("font-mono tracking-wider", className)}
    />
  );
}

export function DateTimePicker24h({ value, onChange, placeholder = "DD/MM/YYYY HH:MM", className, disabled = false }) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const hourScrollRef = useRef(null);
  const minuteScrollRef = useRef(null);
  
  const SCROLL_ITEM_HEIGHT = 32;
  const INFINITE_SCROLL_LOOPS = 3;
  
  const availableHours = Array.from({ length: 24 }, (_, i) => i);
  const availableMinutes = Array.from({ length: 12 }, (_, i) => i * 5);
  
  // Create infinite scrolling arrays by repeating base arrays
  const infiniteHours = Array(INFINITE_SCROLL_LOOPS).fill(null).flatMap(() => availableHours);
  const infiniteMinutes = Array(INFINITE_SCROLL_LOOPS).fill(null).flatMap(() => availableMinutes);

  const selectedDateTime = useMemo(() => {
    if (value) {
      const parsedDate = typeof value === 'string' ? new Date(value) : value;
      return !isNaN(parsedDate.getTime()) ? parsedDate : new Date();
    }
    return new Date();
  }, [value]);
  
  const calendarMonth = useMemo(() => {
    if (value) {
      const parsedDate = typeof value === 'string' ? new Date(value) : value;
      return !isNaN(parsedDate.getTime()) ? parsedDate : undefined;
    }
    return undefined;
  }, [value]);

  const emitFormattedDateTime = dateTime => onChange?.(format(dateTime, "yyyy-MM-dd'T'HH:mm"));

  // Rounds up current minute to next 5-minute increment for initial selection
  const getRoundedUpMinuteIndex = currentMinute => {
    const roundedUpMinute = Math.ceil(currentMinute / 5) * 5;
    return (roundedUpMinute % 60) / 5;
  };

  // Centers the scroll position on the selected item within infinite scroll
  const centerScrollOnSelectedItem = (scrollRef, totalListLength, selectedIndex) => {
    const middleLoopIndex = Math.floor(totalListLength / INFINITE_SCROLL_LOOPS) + selectedIndex;
    scrollRef.current.scrollTop = (middleLoopIndex * SCROLL_ITEM_HEIGHT) - 
      (scrollRef.current.clientHeight / 2) + (SCROLL_ITEM_HEIGHT / 2);
  };

  // Maintains infinite scroll illusion by jumping between loop boundaries
  const handleInfiniteScrollLoop = (scrollEvent, totalListLength) => {
    const scrollContainer = scrollEvent.currentTarget;
    const maxScrollTop = SCROLL_ITEM_HEIGHT * totalListLength;
    const singleLoopLength = totalListLength / INFINITE_SCROLL_LOOPS;
    
    if (scrollContainer.scrollTop < SCROLL_ITEM_HEIGHT) {
      scrollContainer.scrollTop += SCROLL_ITEM_HEIGHT * singleLoopLength;
    } else if (scrollContainer.scrollTop > maxScrollTop - (SCROLL_ITEM_HEIGHT * singleLoopLength)) {
      scrollContainer.scrollTop -= SCROLL_ITEM_HEIGHT * singleLoopLength;
    }
  };

  const handleDateSelection = selectedDate => {
    if (!selectedDate) return;
    
    const updatedDateTime = new Date(selectedDateTime);
    updatedDateTime.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    emitFormattedDateTime(updatedDateTime);
    setIsPopoverOpen(false);
  };

  const handleTimeComponentChange = (timeComponent, newValue) => {
    const updatedDateTime = new Date(selectedDateTime);
    if (timeComponent === 'hour') updatedDateTime.setHours(newValue);
    else updatedDateTime.setMinutes(newValue);
    emitFormattedDateTime(updatedDateTime);
  };

  useEffect(() => {
    if (isPopoverOpen) {
      setTimeout(() => {
        centerScrollOnSelectedItem(hourScrollRef, infiniteHours.length, selectedDateTime.getHours());
        centerScrollOnSelectedItem(minuteScrollRef, infiniteMinutes.length, getRoundedUpMinuteIndex(selectedDateTime.getMinutes()));
      }, 100);
    }
  }, [isPopoverOpen, selectedDateTime]);

  return (
    <div className={cn("relative", className)}>
      <MaskedDateTimeInput 
        value={value} 
        onChange={dateTime => emitFormattedDateTime(dateTime)} 
        placeholder={placeholder} 
        disabled={disabled} 
        className="pr-10" 
      />
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted" 
            disabled={disabled}
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <CalendarComponent 
              mode="single" 
              selected={value ? selectedDateTime : undefined}
              defaultMonth={calendarMonth || new Date()}
              onSelect={handleDateSelection} 
              initialFocus 
              className="rounded-r-none border-r" 
            />
            <div className="flex border-l">
              <div className="w-16 border-r">
                <div className="p-2 text-center text-sm font-medium border-b bg-muted/50">
                  <Clock className="h-4 w-4 mx-auto" />
                </div>
                <div
                  ref={hourScrollRef}
                  className="h-64 overflow-y-auto"
                  style={{ 
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitScrollbar: { display: 'none' }
                  }}
                  onScroll={scrollEvent => handleInfiniteScrollLoop(scrollEvent, infiniteHours.length)}
                >
                  {infiniteHours.map((hourValue, index) => (
                    <Button
                      key={index}
                      variant={selectedDateTime.getHours() === (hourValue % 24) ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full h-8 rounded-none justify-center text-sm"
                      onClick={() => handleTimeComponentChange('hour', hourValue % 24)}
                    >
                      {(hourValue % 24).toString().padStart(2, '0')}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="w-16">
                <div className="p-2 text-center text-sm font-medium border-b bg-muted/50">min</div>
                <div
                  ref={minuteScrollRef}
                  className="h-64 overflow-y-auto"
                  style={{ 
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitScrollbar: { display: 'none' }
                  }}
                  onScroll={scrollEvent => handleInfiniteScrollLoop(scrollEvent, infiniteMinutes.length)}
                >
                  {infiniteMinutes.map((minuteValue, index) => {
                    const actualMinute = minuteValue % 60;
                    const roundedSelectedMinute = Math.ceil(selectedDateTime.getMinutes() / 5) * 5;
                    const isCurrentlySelected = actualMinute === (roundedSelectedMinute % 60);
                    
                    return (
                      <Button
                        key={index}
                        variant={isCurrentlySelected ? 'default' : 'ghost'}
                        size="sm"
                        className="w-full h-8 rounded-none justify-center text-sm"
                        onClick={() => handleTimeComponentChange('minute', actualMinute)}
                      >
                        {actualMinute.toString().padStart(2, '0')}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}