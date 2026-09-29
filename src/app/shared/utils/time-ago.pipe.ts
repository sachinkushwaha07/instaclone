import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'timeAgo', standalone: true, pure: true })
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date): string {
    const date = typeof value === 'string' ? new Date(value) : value;
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    const steps: [number, string][] = [
      [31536000, 'y'], [2592000, 'mo'], [86400, 'd'], [3600, 'h'], [60, 'm'],
    ];
    for (const [secs, label] of steps) {
      const n = Math.floor(seconds / secs);
      if (n >= 1) return `${n}${label}`;
    }
    return 'now';
  }
}