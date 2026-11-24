export function matchesOrderNumber(orderNumber: string, query: string): boolean {
  const normalizedQuery = query.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!normalizedQuery) return true;
  return orderNumber.toUpperCase().replace(/[^A-Z0-9]/g, "").includes(normalizedQuery);
}
