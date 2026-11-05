// How a reviewer is shown publicly: first name + last initial.
//   "Maya Johnson"      -> "Maya J."
//   "Maya Ann Johnson"  -> "Maya J."
//   "Maya"              -> "Maya"
//   ""                  -> "CampusGlam student"
export function reviewerDisplayName(fullName: string | null): string {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "CampusGlam student";
  }
  if (parts.length === 1) {
    return parts[0];
  }
  const lastInitial = parts[parts.length - 1][0].toUpperCase();
  return `${parts[0]} ${lastInitial}.`;
}
