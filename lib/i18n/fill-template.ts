/** Replace `{key}` placeholders in UI copy templates. */
export function fillTemplate(
  template: string | undefined | null,
  vars: Record<string, string | number>
): string {
  if (template == null || template === "") return "";
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{${key}}`, String(value));
  }
  return out;
}
