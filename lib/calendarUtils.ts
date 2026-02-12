// Calendar utilities for date calculations
export function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function startOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // Monday as first day
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + diff);
}

export function endOfWeek(date: Date): Date {
    const start = startOfWeek(date);
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
}

export function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function parseDate(dateStr: string): Date {
    return new Date(dateStr + 'T00:00:00');
}

export function getMonthDays(date: Date): Date[] {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days: Date[] = [];

    // Start from Monday of the week containing the 1st
    const firstWeekStart = startOfWeek(start);

    // End on Sunday of the week containing the last day
    const lastWeekEnd = endOfWeek(end);

    let current = new Date(firstWeekStart);
    while (current <= lastWeekEnd) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    return days;
}

export function isSameMonth(date1: Date, date2: Date): boolean {
    return date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();
}

export function isSameDay(date1: Date, date2: Date): boolean {
    return formatDate(date1) === formatDate(date2);
}

export function formatMonthYear(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
