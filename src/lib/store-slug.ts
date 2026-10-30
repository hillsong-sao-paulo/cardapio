const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function slugFromName(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
  return slug;
}

export function isValidStoreSlug(slug: string): boolean {
  return slug.length >= 3 && slug.length <= 63 && SLUG_PATTERN.test(slug);
}
