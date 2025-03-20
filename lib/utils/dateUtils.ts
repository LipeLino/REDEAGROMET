import { ptBR } from 'date-fns/locale';
import { format, addHours } from 'date-fns';

// Brazil is UTC+3 for display purposes since timestamps are in UTC
const BRAZIL_UTC_OFFSET = 3;

export function formatToBrazilianDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
}

export function toBrazilianTimezone(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return addHours(dateObj, BRAZIL_UTC_OFFSET);
}
