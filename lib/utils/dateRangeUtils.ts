import {
  startOfDay,
  endOfDay,
  isSameDay,
  isWithinInterval,
  startOfMonth,
  addMonths,
  getMonth,
  getYear
} from "date-fns";

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export class DateRangeManager {
  private currentMonth: Date;
  private range: DateRange;

  constructor(currentMonth: Date, initialRange?: DateRange) {
    this.currentMonth = currentMonth;
    this.range = initialRange || { from: undefined, to: undefined };
  }

  private isDateInCurrentView(date: Date): boolean {
    if (!date) return false;
    
    const firstMonth = startOfMonth(this.currentMonth);
    const secondMonth = startOfMonth(addMonths(this.currentMonth, 1));
    
    return (
      (getMonth(date) === getMonth(firstMonth) && getYear(date) === getYear(firstMonth)) ||
      (getMonth(date) === getMonth(secondMonth) && getYear(date) === getYear(secondMonth))
    );
  }

  setCurrentMonth(month: Date) {
    this.currentMonth = month;
  }

  setRange(range: DateRange) {
    this.range = {
      from: range.from ? startOfDay(range.from) : undefined,
      to: range.to ? endOfDay(range.to) : undefined
    };
  }

  getModifiers() {
    return {
      selected: (date: Date) => {
        if (!this.range.from || !this.range.to) return false;
        if (!this.isDateInCurrentView(date)) return false;
        return isSameDay(date, this.range.from) || isSameDay(date, this.range.to);
      },
      rangeStart: (date: Date) => {
        if (!this.range.from) return false;
        if (!this.isDateInCurrentView(date)) return false;
        return isSameDay(date, this.range.from);
      },
      rangeEnd: (date: Date) => {
        if (!this.range.to) return false;
        if (!this.isDateInCurrentView(date)) return false;
        return isSameDay(date, this.range.to);
      },
      inRange: (date: Date) => {
        if (!this.range.from || !this.range.to) return false;
        if (!this.isDateInCurrentView(date)) return false;
        
        return (
          isWithinInterval(date, {
            start: startOfDay(this.range.from),
            end: endOfDay(this.range.to)
          }) &&
          !isSameDay(date, this.range.from) &&
          !isSameDay(date, this.range.to)
        );
      }
    };
  }

  getRange(): DateRange {
    return this.range;
  }

  isComplete(): boolean {
    return !!(this.range.from && this.range.to);
  }
}
