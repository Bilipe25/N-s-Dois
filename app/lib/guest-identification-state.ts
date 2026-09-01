export type IdentificationStatus = "found" | "ambiguous" | "not_found";
export type IdentificationStep = "identify" | "register" | "ambiguous";

export function publicIdentificationStep(status: Exclude<IdentificationStatus, "found">): Exclude<IdentificationStep, "identify"> {
  return status === "ambiguous" ? "ambiguous" : "register";
}
