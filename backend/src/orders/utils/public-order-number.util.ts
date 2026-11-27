export function formatPublicOrderNumber(value: number): string {
  return `MIL-${String(value).padStart(5, '0')}`;
}
