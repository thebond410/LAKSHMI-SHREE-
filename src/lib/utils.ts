import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeStringToMinutes(time: string): number {
    if (!time || !time.includes(':')) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    return hours * 60 + minutes;
};

export function minutesToHHMM(minutes: number): string {
  if (isNaN(minutes) || minutes < 0) {
    return "00:00";
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.floor(minutes % 60);
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(remainingMinutes)}`;
}
