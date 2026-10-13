import { ATELIERS } from "../ateliers";
import type { AtelierDefinition } from "../ateliers/types";
import { FORMATIONS, formationsDe, type Formation } from "../formations";
import { familyOf, SCENARIO_CHOICES, type ScenarioDefinition } from "./registry";

/**
 * UNE MÊME ENTREPRISE SERT PLUSIEURS FORMATIONS.
 *
 * Le propriétaire : « une situation peut servir plusieurs formations, donc les
 * indiquer. » Une situation, dans ses mots, c'est l'entreprise jouée : NOVA et
 * ses six trimestres, l'hôtel et sa haute saison, le bistrot et son mois
 * d'août. Le site la présentait comme un secteur, et rattachait chaque
 * formation à un déroulé ; rien ne disait qu'un enseignant de DCG et un élève
 * de première jouent la même usine d'enceintes, chacun à son niveau.
 *
 * DEUX SOURCES, ET L'ORDRE DU REGISTRE. La première se déduit : les ateliers
 * qui jouent cette entreprise servent des formations, donc l'entreprise les
 * sert. La seconde s'écrit, ici, parce qu'une entreprise convient à des
 * formations pour lesquelles aucun déroulé n'est encore publié : le bâtiment
 * n'a pas d'atelier et sert pourtant la gestion de la PME. Chaque entrée de
 * cette seconde liste se justifie par les blocs du référentiel, dans
 * docs/12-audit-ateliers-durees-niveaux.md, et une garde vérifie qu'elle ne
 * cite que des formations qui existent.
 *
 * Une famille (NOVA en un produit ou en gamme) est une seule entreprise : ses
 * formations se comptent sur la tête de famille, celle qu'on choisit.
 */
export const CONVIENT_AUSSI: Readonly<Record<string, readonly string[]>> = {
  // L'usine d'enceintes : stock, coût de revient, délais de règlement ; en
  // gamme, le mix et l'investissement typé. Le lycée, la comptabilité, le DCG
  // et le BUT y trouvent chacun leur étage.
  nova: ["stmg", "bts-cg", "dcg", "but-gea"],
  // La boutique de maille : marge, taux de marque, approvisionnement, saison.
  // Le lycée la joue en prolongement de NOVA, pour opposer fabriquer et
  // revendre.
  boutique: ["bts-mco", "stmg"],
  // L'hôtel : prix moyen, taux d'occupation, clientèles qui paient à terme.
  hotel: ["bts-mhr"],
  // Le bistrot : ratio matières, fournisseurs, mois creux ; options B et C du
  // BTS MHR, et la gestion opérationnelle du BTS MCO en seconde année.
  bistrot: ["bts-mhr-bc", "bts-mco"],
  // Le cabinet de conseil : poste clients, risques, recrutement ; la PME, et
  // la gestion financière du BUT.
  conseil: ["bts-gpme", "but-gea"],
  // La boutique en ligne : coût d'acquisition, retours, partenaires ; la
  // relation client à distance, et l'animation de l'offre du BTS MCO.
  ecommerce: ["bts-ndrc", "bts-mco"],
  // La salle de sport : adhérents, attrition, encaissement d'avance ; la
  // fidélisation des deux BTS commerciaux.
  fitness: ["bts-ndrc", "bts-mco"],
  // Le bâtiment : chantiers, sous-traitance, trésorerie de chantier ; la PME
  // et le BUT, sans déroulé publié à ce jour.
  batiment: ["bts-gpme", "but-gea"],
  // Le transport : coût à la palette, flotte, grand compte à soixante jours ;
  // l'investissement et le financement du BUT, du DCG et de la PME.
  transport: ["but-gea", "dcg", "bts-gpme"],
};

/** La tête de famille d'un code de scénario : l'entreprise qu'on choisit. */
export function teteDeFamille(code: string): string {
  return familyOf(code)?.head ?? code;
}

/** Les ateliers qui font jouer cette entreprise, quelle que soit la variante. */
export function ateliersDuScenario(tete: string): AtelierDefinition[] {
  return ATELIERS.filter((a) => teteDeFamille(a.reglages.scenarioCode) === tete);
}

/**
 * Les formations qu'une entreprise sert : celles des ateliers qui la jouent,
 * et celles pour lesquelles elle convient, dans l'ordre du registre des
 * formations et sans doublon.
 */
export function formationsServies(tete: string): Formation[] {
  const codes = new Set<string>([
    ...ateliersDuScenario(tete).flatMap((a) => a.formations),
    ...(CONVIENT_AUSSI[tete] ?? []),
  ]);
  return FORMATIONS.filter((f) => codes.has(f.code));
}

/** Les mêmes, sans celles qu'un atelier donné sert déjà : « cette entreprise sert aussi… ». */
export function formationsServiesEnPlus(a: AtelierDefinition): Formation[] {
  return formationsServies(teteDeFamille(a.reglages.scenarioCode)).filter(
    (f) => !a.formations.includes(f.code),
  );
}

/** Les entreprises qui servent une formation, dans l'ordre des choix. */
export function scenariosServant(formation: string): ScenarioDefinition[] {
  return SCENARIO_CHOICES.filter((s) =>
    formationsServies(s.code).some((f) => f.code === formation),
  );
}

/** Par entreprise, dans l'ordre des choix : ses ateliers et ses formations. */
export function entreprisesEtFormations(): {
  scenario: ScenarioDefinition;
  ateliers: AtelierDefinition[];
  formations: Formation[];
}[] {
  return SCENARIO_CHOICES.map((scenario) => ({
    scenario,
    ateliers: ateliersDuScenario(scenario.code),
    formations: formationsServies(scenario.code),
  }));
}

/** « STMG, BTS CG et DCG » : les sigles, en énumération française. */
export function sertEnClair(formations: readonly Formation[]): string {
  return enumereLesSigles(formations);
}

function enumereLesSigles(formations: readonly Formation[]): string {
  const sigles = formationsDe(formations.map((f) => f.code)).map((f) => f.sigle);
  if (sigles.length === 0) return "";
  if (sigles.length === 1) return sigles[0]!;
  return `${sigles.slice(0, -1).join(", ")} et ${sigles[sigles.length - 1]}`;
}
