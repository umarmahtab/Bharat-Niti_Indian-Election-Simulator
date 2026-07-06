/**
 * BHARAT NITI — Utility: cn (class name merger)
 */

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
