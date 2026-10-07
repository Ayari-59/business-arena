/**
 * LE HASARD DE CHAQUE DÉBRIEF : le trimestre qu'un groupe joue ensemble, pour
 * comparer ses choix sous le même hasard.
 *
 * Le n° 12 sert à tous les épisodes où il ne punit pas la bonne méthode et ne
 * fait pas payer un réflexe ; les autres ont le leur, choisi par la règle de
 * `src/pedagogy/episodes/hasard-du-debrief.ts`. Le tableau est figé ici pour
 * que les liens et les fiches ne le recalculent pas ; un test vérifie qu'il
 * suit la règle, et le signale si un modèle change.
 */
export const HASARD_HABITUEL = 12;

const AUTRES_HASARDS: Readonly<Record<string, number>> = {
  "trimestre-qui-derape": 19,
  "depot-qui-deborde": 10,
  "projet-qui-glisse": 11,
  "quai-dangereux": 18,
  "client-qui-s-en-va": 4,
  "tournees-qui-debordent": 8,
  "site-qui-ne-vend-pas": 25,
  "talent-qui-veut-partir": 8,
  "competences-qui-manquent": 18,
  "facture-qui-flambe": 13,
  "controle-qui-s-annonce": 5,
  "fusion-des-agences": 4,
  "nouveau-service": 4,
  "faire-ou-faire-faire": 8,
  "ecarts-du-budget": 6,
  "croissance-a-financer": 28,
  "client-a-risque": 15,
  "discounter-qui-arrive": 9,
  "concurrent-a-racheter": 23,
  "marche-qui-s-ouvre": 1,
  "projet-a-arreter": 18,
  "reseau-a-redessiner": 22,
  "grand-compte-exclusif": 2,
  "saisonniers-de-juillet": 16,
  "postes-introuvables": 21,
  "spa-a-financer": 6,
  "enseigne-a-la-porte": 2,
};

export const hasardDuDebrief = (code: string): number => AUTRES_HASARDS[code] ?? HASARD_HABITUEL;

export const lienDuDebrief = (code: string) =>
  `/entreprises/episode/${code}?hasard=${hasardDuDebrief(code)}`;
