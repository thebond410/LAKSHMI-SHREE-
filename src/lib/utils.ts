import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeStringToSeconds(time: string): number {
    if (!time || !time.includes(':')) return 0;
    const parts = time.split(':').map(Number);
    if (parts.some(isNaN)) return 0;
    
    // Handles both HH:MM and HH:MM:SS
    const hours = parts[0] ?? 0;
    const minutes = parts[1] ?? 0;
    const seconds = parts[2] ?? 0;

    return hours * 3600 + minutes * 60 + seconds;
};

export function secondsToHHMMSS(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return "00:00:00";
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function secondsToHHMM(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return "00:00";
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}`;
}


export function minutesToHHMM(minutes: number): string {
  if (isNaN(minutes) || minutes < 0) {
    return "00:00";
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.floor(minutes % 60);
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(remainingMinutes)}`;
}
