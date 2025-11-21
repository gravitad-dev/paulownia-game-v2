"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import DatePickerLib from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DatePickerProps {
  value?: string | Date
  onChange?: (date: Date | undefined) => void
  disabled?: boolean
  placeholder?: string
  id?: string
  name?: string
  className?: string
}

export function DatePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Selecciona una fecha",
  id,
  name,
  className,
}: DatePickerProps) {
  const [selected, setSelected] = React.useState<Date | null>(
    value ? (typeof value === 'string' ? new Date(value) : value) : null
  )

  React.useEffect(() => {
    if (value) {
      const date = typeof value === 'string' ? new Date(value) : value
      setSelected(date)
    } else {
      setSelected(null)
    }
  }, [value])

  const handleChange = (date: Date | null) => {
    setSelected(date)
    onChange?.(date || undefined)
  }

  const CustomInput = React.forwardRef<HTMLButtonElement, { onClick?: () => void }>(
    ({ onClick, ...props }, ref) => (
      <Button
        type="button"
        variant="outline"
        ref={ref}
        onClick={onClick}
        className={cn(
          "w-full justify-start text-left font-normal",
          !selected && "text-muted-foreground",
          className
        )}
        disabled={disabled}
        {...props}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {selected ? format(selected, "PPP", { locale: es }) : <span>{placeholder}</span>}
      </Button>
    )
  )
  CustomInput.displayName = "CustomInput"

  return (
    <div className="relative w-full">
      <DatePickerLib
        selected={selected}
        onChange={handleChange}
        disabled={disabled}
        locale={es}
        dateFormat="dd/MM/yyyy"
        showYearDropdown
        showMonthDropdown
        dropdownMode="select"
        yearDropdownItemNumber={100}
        scrollableYearDropdown
        maxDate={new Date()}
        wrapperClassName="w-full"
        className={cn("w-full", className)}
        popperClassName="z-50"
        popperPlacement="bottom-start"
        customInput={<CustomInput />}
      />
      {name && (
        <input
          type="hidden"
          name={name}
          id={id}
          value={selected ? format(selected, "yyyy-MM-dd") : ""}
        />
      )}
    </div>
  )
}
