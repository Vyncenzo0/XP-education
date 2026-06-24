export const CAMPUS_MAP: Record<string, string> = {
  CA: "Cainta",
  TA: "Taytay",
  AN: "Antipolo",
  SU: "Sumulong",
  SM: "San Mateo",
  BI: "Binangonan",
  CO: "Cogeo",
};

export function getCampusName(idOrPrefix: string | null | undefined): string {
  if (!idOrPrefix) return "Unknown Campus";
  const prefix = idOrPrefix.substring(0, 2).toUpperCase();
  return CAMPUS_MAP[prefix] || "Unknown Campus";
}
