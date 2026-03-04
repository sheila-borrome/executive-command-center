import { getEntityColor } from "../constants/entities";

interface EntityTagProps {
  name: string;
  slug: string;
  color?: string;
  small?: boolean;
}

export function EntityTag({ name, slug, color }: EntityTagProps) {
  const c = color ?? getEntityColor(slug);
  return (
    <span
      className="inline-flex items-center rounded-full border font-medium"
      style={{
        borderColor: `${c}60`,
        backgroundColor: `${c}18`,
        color: c,
        fontSize: "0.7rem",
        padding: "0.15rem 0.5rem",
        letterSpacing: "0.05em",
      }}
    >
      {name}
    </span>
  );
}
