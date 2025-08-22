import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function minutesToHHMM(minutes: number): string {
  if (isNaN(minutes) || minutes < 0) {
    return "00:00";
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(remainingMinutes)}`;
}
