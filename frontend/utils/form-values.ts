export function formString(
  form: HTMLFormElement,
  name: string,
  fallback = "",
): string {
  const value = new FormData(form).get(name);
  return typeof value === "string" ? value : fallback;
}
