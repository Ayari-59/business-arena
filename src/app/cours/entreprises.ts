import { scenarioByCode } from "@/config/scenarios/registry";
import { nomEntreprise, teinteDuMetier } from "@/config/scenarios/presentation";
import { ENTREPRISES_DU_COURS } from "@/config/cours/metiers";

/** Les entreprises du cours, avec leur nom et leur teinte de métier. */
export const ENTREPRISES = ENTREPRISES_DU_COURS.map((code) => {
  const d = scenarioByCode(code);
  return { code, nom: nomEntreprise(d), tagline: d.tagline, teinte: teinteDuMetier(d) };
});
