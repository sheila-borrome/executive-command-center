export const ENTITY_SLUGS = ["ldu", "ldg", "sldg", "lacounty", "bigkika"] as const;
export type EntitySlug = (typeof ENTITY_SLUGS)[number];

export interface Entity {
  id: string;
  name: string;
  slug: EntitySlug;
  color: string;
  sortOrder: number;
}

export const DEFAULT_ENTITIES: Omit<Entity, "id">[] = [
  { name: "LDU", slug: "ldu", color: "#f59e0b", sortOrder: 1 },
  { name: "LDG", slug: "ldg", color: "#10b981", sortOrder: 2 },
  { name: "SLDG", slug: "sldg", color: "#3b82f6", sortOrder: 3 },
  { name: "LA County", slug: "lacounty", color: "#8b5cf6", sortOrder: 4 },
  { name: "Big Kika", slug: "bigkika", color: "#ec4899", sortOrder: 5 },
];

export const ENTITY_COLORS: Record<EntitySlug, string> = {
  ldu: "#f59e0b",
  ldg: "#10b981",
  sldg: "#3b82f6",
  lacounty: "#8b5cf6",
  bigkika: "#ec4899",
};

export function getEntityColor(slug: string): string {
  return ENTITY_COLORS[slug as EntitySlug] ?? "#6b7280";
}
