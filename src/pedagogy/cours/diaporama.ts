import PptxGenJS from "pptxgenjs";
import type { Cas } from "../../config/cours/cas";
import { bureauxDuChapitre } from "../../config/cours/bureaux";
import { casDuChapitre } from "../../config/cours/situations";
import type { Chapitre, OptionDeChoix, TableauDeDonnees } from "../../config/cours/types";
import { montantEcrit } from "./correcteur";
import { servirLeChapitre, solutionDuLaboratoire, type EtapeServie, type LectureDuLaboratoire } from "./chapitre-servi";
import { nombreEcrit, valeurEcrite, type TableauACompleter } from "./tableau-a-completer";

/**
 * LE DIAPORAMA DE L'ENSEIGNANT (décision du propriétaire, novembre 2026) : un PowerPoint fabriqué à
 * la demande à partir des données d'un chapitre, à projeter en classe.
 *
 * Le générateur est générique : un chapitre et le cas d'une entreprise donnent un fichier. Il lit le
 * chapitre tel que la page le sert (chapitre-servi.ts), si bien que les textes, les tableaux et les
 * chiffres sont ceux du monde du cours, calculés, jamais recopiés. Rien de ce que le chapitre dit
 * n'est écrit ici : ce module n'ajoute que les mots de la mise en page (« Question », « Correction »).
 *
 * LE DÉROULÉ : une diapositive de titre (le chapitre, sa formation, l'entreprise), les objectifs, puis
 * le chapitre étape par étape. Une étape de lecture donne son texte, son repère et son tableau. Une
 * étape qui interroge donne ses données, puis une diapositive « question » (l'énoncé et les
 * propositions, sans marquer la bonne), puis, juste après, une diapositive « correction » (la bonne
 * réponse et l'explication du chapitre). La fin annonce le cas pratique et le bureau du chapitre.
 * Sous chaque diapositive, les notes de l'enseignant : l'objectif travaillé, l'explication, le piège,
 * la suite.
 *
 * CE MODULE EST SERVEUR, ET IL PORTE LES CORRIGÉS : aucun composant « use client » ne doit l'importer
 * (tests/architecture/corriges-hors-du-navigateur.test.ts, scripts/verifier-bundles.ts). La route
 * app/cours/[chapitre]/diaporama/route.ts l'appelle après le contrôle d'accès.
 */

// ─────────────────────────────────────────────────────────────────────────────
// LE PLAN : CE QUE DIT CHAQUE DIAPOSITIVE, SANS LA MISE EN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export type Disposition = "TITRE" | "SECTION" | "CONTENU" | "TABLEAU";
export type Role = "titre" | "objectifs" | "lecture" | "donnees" | "question" | "correction" | "fin";

export interface LigneDeTableau {
  cellules: readonly string[];
  fort?: boolean;
}

export type Bloc =
  | { type: "texte"; paragraphes: readonly string[]; puces?: boolean; fort?: boolean }
  | { type: "repere"; texte: string }
  | { type: "tableau"; legende?: string; colonnes: readonly string[]; lignes: readonly LigneDeTableau[]; largeurs?: readonly number[] };

export interface Diapositive {
  disposition: Disposition;
  role: Role;
  /** L'étape du chapitre que la diapositive montre. */
  etape?: string;
  titre: string;
  blocs: readonly Bloc[];
  /** Les notes de l'enseignant, un paragraphe par entrée. */
  notes: readonly string[];
}

/** Les mots de la mise en page : ils préfixent les titres, et le test du générateur les cherche. */
export const MOTS_DU_DIAPORAMA = {
  question: "Question",
  correction: "Correction",
  bonneReponse: "La bonne réponse",
  objectifs: "Ce que vous saurez faire",
  fin: "À faire ensuite",
} as const;

const LETTRES = "ABCDEFGHIJ";
/** Les espaces fines insécables deviennent des insécables ordinaires : toutes les polices les ont. */
const sur = (t: string) => t.replace(/ /g, " ");
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const avecUnite = (x: number, unite?: string) => (unite && unite !== "€" ? `${nombreEcrit(x)} ${unite}` : eur(x));

const texte = (paragraphes: readonly string[], options: { puces?: boolean; fort?: boolean } = {}): Bloc => ({ type: "texte", paragraphes, ...options });
const tableauDeDonnees = (t: TableauDeDonnees): Bloc => ({
  type: "tableau",
  legende: t.titre,
  colonnes: ["", ...t.colonnes],
  lignes: t.lignes.map((l) => ({ cellules: [l.libelle, ...l.valeurs] })),
});
const grille = (t: TableauACompleter, corrigee: boolean): Bloc => ({
  type: "tableau",
  legende: t.titre,
  colonnes: ["", ...t.colonnes],
  lignes: t.lignes.map((l) => ({
    fort: l.fort,
    cellules: [l.libelle, ...l.cellules.map((c) => (c.saisir && !corrigee ? "…" : valeurEcrite(c)))],
  })),
});
const options = (o: readonly OptionDeChoix[]) => o.map((x, i) => `${LETTRES[i]}. ${x.texte}`);
const pieges = (o: readonly OptionDeChoix[]) => o.filter((x) => !x.juste).map((x) => `Le piège « ${x.texte} » : ${x.retour}`);
function bonneReponse(o: readonly OptionDeChoix[]): Bloc[] {
  const i = o.findIndex((x) => x.juste);
  const bonne = o[i]!;
  return [texte([`${MOTS_DU_DIAPORAMA.bonneReponse} : ${LETTRES[i]}. ${bonne.texte}`], { fort: true }), texte([bonne.retour])];
}

interface Brouillon {
  disposition?: Disposition;
  role: Role;
  etape?: string;
  titre: string;
  blocs: Bloc[];
  notes: string[];
}

/** Les diapositives d'une étape : ses données, sa question et sa correction, ou sa lecture. */
function diapositivesDeLEtape(
  e: EtapeServie,
  rang: string,
  objectifs: readonly string[],
  suite: string[],
  /** La solution d'un laboratoire, que le chapitre servi ne porte plus (chapitre-servi.ts). */
  aLaSolution: { solution: Record<string, number>; lecture: LectureDuLaboratoire } | null,
): Brouillon[] {
  const travailles = (e.objectifs ?? []).map((i) => `Objectif travaillé : ${objectifs[i]}`);
  const enTete = [`${rang} · ${e.titre}`, ...travailles];
  const donnees: Brouillon[] =
    e.tableau && e.type !== "lecture" ? [{ role: "donnees", etape: e.id, titre: e.titre, blocs: [tableauDeDonnees(e.tableau)], notes: [...enTete, "Les données de l'étape, à lire avec la classe avant la question."] }] : [];
  const question = (blocs: Bloc[], notes: string[] = []): Brouillon => ({ role: "question", etape: e.id, titre: `${MOTS_DU_DIAPORAMA.question} · ${e.titre}`, blocs, notes: [...enTete, ...notes] });
  const correction = (blocs: Bloc[], notes: string[] = []): Brouillon => ({ role: "correction", etape: e.id, titre: `${MOTS_DU_DIAPORAMA.correction} · ${e.titre}`, blocs, notes: [...enTete, ...notes, ...suite] });

  switch (e.type) {
    case "lecture":
      return [
        {
          role: "lecture",
          etape: e.id,
          titre: e.titre,
          blocs: [texte(e.texte), ...(e.repere ? [{ type: "repere", texte: e.repere } as Bloc] : []), ...(e.tableau ? [tableauDeDonnees(e.tableau)] : [])],
          notes: [...enTete, ...(e.repere ? [`Le repère à faire noter : ${e.repere}`] : []), ...suite],
        },
      ];
    case "choix":
      return [
        ...donnees,
        question([texte([e.question]), texte(options(e.options))]),
        correction(bonneReponse(e.options), pieges(e.options)),
      ];
    case "comparaison":
      return [
        ...donnees,
        question([texte([e.question, `${e.libelles.avant}, puis ${e.libelles.apres}.`]), texte(options(e.options))]),
        correction([...bonneReponse(e.options), texte(e.explication)], pieges(e.options)),
      ];
    case "montants":
      return [
        ...donnees,
        question([texte([e.question]), texte(e.champs.map((c) => `${c.libelle} : ?`), { puces: true })]),
        correction([{ type: "tableau", colonnes: ["", "Le calcul"], lignes: e.champs.map((c) => ({ cellules: [c.libelle, c.calcul] })) }, texte(e.explication)], ["L'explication du chapitre :", ...e.explication]),
      ];
    case "tri":
      return [
        ...donnees,
        question(
          [
            texte([e.question]),
            texte(e.categories.map((k) => k.libelle), { puces: true }),
            { type: "tableau", colonnes: ["À ranger", "Montant"], lignes: e.elements.map((x) => ({ cellules: [x.libelle, eur(x.montant)] })) },
          ],
          e.relance ? [`Si la classe hésite : ${e.relance}`] : [],
        ),
        correction(
          [
            {
              type: "tableau",
              colonnes: ["", "Rangé", "Pourquoi"],
              lignes: e.elements.map((x) => ({ cellules: [x.libelle, e.categories.find((k) => k.code === x.categorie)?.libelle ?? x.categorie, x.pourquoi] })),
            },
            texte(e.explication),
          ],
          e.explication,
        ),
      ];
    case "ecriture":
      return [
        ...donnees,
        question(
          [
            texte([e.evenement]),
            ...(e.piece
              ? [
                  {
                    type: "tableau",
                    legende: `${e.piece.nature} · ${e.piece.de} · ${e.piece.date}`,
                    colonnes: ["", "Montant"],
                    lignes: [...e.piece.lignes.map((l) => ({ cellules: [l.libelle, eur(l.montant)] })), ...e.piece.totaux.map((t) => ({ cellules: [t.libelle, eur(t.montant)], fort: t.fort }))],
                  } as Bloc,
                ]
              : []),
          ],
          e.indices.map((i, n) => `Indice ${n + 1} : ${i}`),
        ),
        correction(
          [
            {
              type: "tableau",
              legende: `${e.attendue.date} · ${e.attendue.libelle}`,
              colonnes: ["Compte", "Ce que la ligne représente", "Débit", "Crédit"],
              lignes: e.attendue.lignes.map((l) => ({ cellules: [l.compte, l.role, l.sens === "debit" ? eur(l.montant) : "", l.sens === "credit" ? eur(l.montant) : ""] })),
            },
            texte(e.explication),
          ],
          e.explication,
        ),
      ];
    case "a-completer": {
      const calculs = e.grille.lignes.flatMap((l, i) => l.cellules.flatMap((c, j) => (c.saisir && c.calcul ? [`${e.grille.lignes[i]!.libelle}, ${e.grille.colonnes[j]} : ${c.calcul}`] : [])));
      const indices = [...new Set(e.grille.lignes.flatMap((l) => l.cellules.flatMap((c) => (c.saisir && c.indice ? [c.indice] : []))))];
      return [
        ...donnees,
        question([texte([e.question]), grille(e.grille, false)], indices.map((i) => `Une piste : ${i}`)),
        correction([grille(e.grille, true), texte(e.explication)], ["Les calculs, case par case :", ...calculs]),
      ];
    }
    case "simulation": {
      const solution = e.leviers.map((l) => `${l.libelle} : ${avecUnite(aLaSolution?.solution[l.code] ?? l.depart, l.unite)}`);
      const lue = aLaSolution?.lecture ?? e.lectureDeDepart;
      return [
        ...donnees,
        question(
          [
            texte([e.question, e.consigne]),
            {
              type: "tableau",
              colonnes: ["Levier", "Au départ", "De", "À"],
              lignes: e.leviers.map((l) => ({ cellules: [l.libelle, avecUnite(l.depart, l.unite), avecUnite(l.min, l.unite), avecUnite(l.max, l.unite)] })),
            },
          ],
        ),
        correction(
          [
            texte(solution, { puces: true, fort: true }),
            {
              type: "tableau",
              colonnes: ["", "Au départ", "À la solution"],
              lignes: lue.lignes.map((l) => ({ cellules: [l.libelle, l.reference === undefined ? "" : avecUnite(l.reference, l.unite), avecUnite(l.montant, l.unite)], fort: l.fort })),
            },
            texte(lue.explication ?? []),
          ],
          lue.explication ?? [],
        ),
      ];
    }
    case "curseur":
      return [
        ...donnees,
        question([texte([e.question, `${e.grandeur.libelle}, de ${nombreEcrit(e.cible.min)} à ${nombreEcrit(e.cible.max)} ${e.grandeur.unite}.`])]),
        correction(
          [
            texte([`${MOTS_DU_DIAPORAMA.bonneReponse} : ${nombreEcrit(e.cible.attendu)} ${e.grandeur.unite}`], { fort: true }),
            { type: "tableau", colonnes: ["", "À cette position"], lignes: e.lectureAttendue.lignes.map((l) => ({ cellules: [l.libelle, eur(l.montant)], fort: l.fort })) },
            texte(e.explication),
          ],
          [`Trop bas : ${e.rates.dessous}`, `Trop haut : ${e.rates.dessus}`, ...e.explication],
        ),
      ];
  }
}

/** Le plan du diaporama d'un chapitre, pour le cas d'une entreprise : des diapositives, mises en pages. */
export function planDuDiaporama(chapitre: Chapitre, cas: Cas): Diapositive[] {
  const servi = servirLeChapitre(chapitre, cas);
  const pratique = casDuChapitre(chapitre.code);
  const bureaux = bureauxDuChapitre(chapitre.code);
  const suite = [
    ...(pratique ? [`Pour la suite, le cas pratique « ${pratique.titre} » reprend ces calculs : ${pratique.accroche}`] : []),
    ...bureaux.map((b) => `Puis « ${b.titre} » : ${b.accroche}`),
  ];
  const n = servi.etapes.length;
  const brouillons: Brouillon[] = [
    {
      disposition: "TITRE",
      role: "titre",
      titre: servi.titre,
      blocs: [texte([`${servi.parcours} · palier ${servi.palier}`, ...servi.blocs, cas.entreprise])],
      notes: [chapitre.accroche, ...(servi.prerequis.length ? [`À avoir vu avant : ${servi.prerequis.map((p) => p.titre).join(" ; ")}.`] : []), ...suite],
    },
    {
      role: "objectifs",
      titre: MOTS_DU_DIAPORAMA.objectifs,
      blocs: [texte(servi.objectifs, { puces: true })],
      notes: servi.objectifs.map((o, i) => {
        const etapes = servi.etapes.filter((e) => e.objectifs?.includes(i)).map((e) => e.titre);
        return `${o} : ${etapes.join(" ; ")}.`;
      }),
    },
    ...servi.etapes.flatMap((e, i) => diapositivesDeLEtape(e, `Étape ${i + 1} sur ${n}`, servi.objectifs, suite, e.type === "simulation" ? solutionDuLaboratoire(chapitre, cas, e.id) : null)),
  ];
  if (pratique || bureaux.length > 0) {
    brouillons.push({
      disposition: "SECTION",
      role: "fin",
      titre: MOTS_DU_DIAPORAMA.fin,
      blocs: [
        ...(pratique ? [texte([`Le cas pratique : « ${pratique.titre} »`], { fort: true }), texte([pratique.accroche])] : []),
        ...bureaux.flatMap((b) => [texte([b.titre], { fort: true }), texte([b.accroche])]),
      ],
      notes: [...(pratique ? [`${pratique.commanditaire} : ${pratique.objectifs.join(" ; ")}.`] : []), ...bureaux.map((b) => `${b.commanditaire} : ${b.objectifs.join(" ; ")}.`)],
    });
  }
  return brouillons.flatMap(mettreEnPages);
}

// ─────────────────────────────────────────────────────────────────────────────
// LA MISE EN PAGES : UNE DIAPOSITIVE TROP LONGUE EST COUPÉE
// ─────────────────────────────────────────────────────────────────────────────

/** La diapositive, en pouces : 16:9 (LAYOUT_WIDE). */
export const FORMAT = { largeur: 13.333, hauteur: 7.5 } as const;
/** La zone du corps, sous le titre. */
export const CORPS = { x: 0.6, y: 1.55, w: 12.13, h: 5.3 } as const;
export const TAILLES = { titreDeCouverture: 40, titre: 30, texte: 20, tableau: 18 } as const;
const INTERLIGNE = 1.2 / 72;
const ECART = 0.2;
const ESPACE_ENTRE_PARAGRAPHES = 8 / 72;
/** Combien de signes tiennent dans un pouce, à une taille donnée (Calibri, une marge de prudence). */
const signesParPouce = (taille: number) => 72 / (taille * 0.47);
const lignes = (t: string, largeur: number, taille: number) => Math.max(1, Math.ceil(t.length / Math.max(1, largeur * signesParPouce(taille))));

const hauteurDuParagraphe = (p: string, puces = false) => lignes(p, CORPS.w - (puces ? 0.4 : 0.1), TAILLES.texte) * TAILLES.texte * INTERLIGNE;
const hauteurDuTexte = (b: Extract<Bloc, { type: "texte" }>) =>
  b.paragraphes.reduce((h, p) => h + hauteurDuParagraphe(p, b.puces), 0) + Math.max(0, b.paragraphes.length - 1) * ESPACE_ENTRE_PARAGRAPHES + 0.1;
const hauteurDuRepere = (t: string) => lignes(t, CORPS.w - 0.6, TAILLES.texte) * TAILLES.texte * INTERLIGNE + 0.3;
const LEGENDE = 0.45;
export const hauteurDeLigne = (cellules: readonly string[], largeurs: readonly number[]) =>
  Math.max(...cellules.map((c, j) => lignes(c, (largeurs[j] ?? 1) - 0.16, TAILLES.tableau))) * TAILLES.tableau * INTERLIGNE + 0.12;

/** Les largeurs des colonnes, selon ce qu'elles portent : la plus bavarde prend le plus de place. */
export function largeursDesColonnes(colonnes: readonly string[], rangees: readonly (readonly string[])[], total: number = CORPS.w): number[] {
  const poids = colonnes.map((c, j) => Math.min(70, Math.max(8, c.length, ...rangees.map((r) => (r[j] ?? "").length))));
  const somme = poids.reduce((a, b) => a + b, 0);
  const brutes = poids.map((p) => Math.max(1.5, (p / somme) * total));
  const s = brutes.reduce((a, b) => a + b, 0);
  return brutes.map((b) => (b / s) * total);
}

export function hauteurDuBloc(b: Bloc): number {
  if (b.type === "texte") return hauteurDuTexte(b);
  if (b.type === "repere") return hauteurDuRepere(b.texte);
  const l = b.largeurs ?? largeursDesColonnes(b.colonnes, b.lignes.map((x) => x.cellules));
  return (b.legende ? LEGENDE : 0) + hauteurDeLigne(b.colonnes, l) + b.lignes.reduce((h, x) => h + hauteurDeLigne(x.cellules, l), 0);
}

/** Un paragraphe trop long pour une diapositive entière, coupé entre ses phrases. */
function couperLeParagraphe(p: string, puces?: boolean): string[] {
  if (hauteurDuParagraphe(p, puces) <= CORPS.h - 0.2) return [p];
  const phrases = p.match(/[^.!?]+[.!?]*\s*/g) ?? [p];
  const morceaux: string[] = [];
  let courant = "";
  for (const ph of phrases) {
    if (courant && hauteurDuParagraphe(courant + ph, puces) > CORPS.h - 0.2) {
      morceaux.push(courant.trim());
      courant = "";
    }
    courant += ph;
  }
  if (courant.trim()) morceaux.push(courant.trim());
  return morceaux;
}

/** Une diapositive en une ou plusieurs pages : les blocs s'empilent, ce qui déborde passe à la suivante. */
function mettreEnPages(d: Brouillon): Diapositive[] {
  if (d.disposition === "TITRE" || d.disposition === "SECTION") {
    return [{ disposition: d.disposition, role: d.role, ...(d.etape ? { etape: d.etape } : {}), titre: d.titre, blocs: d.blocs, notes: d.notes }];
  }
  const pages: Bloc[][] = [[]];
  let reste = CORPS.h;
  const page = () => pages[pages.length - 1]!;
  const nouvelle = () => {
    pages.push([]);
    reste = CORPS.h;
  };
  const tient = (h: number) => h + (page().length > 0 ? ECART : 0) <= reste + 1e-9;
  const poser = (b: Bloc, h: number) => {
    reste -= h + (page().length > 0 ? ECART : 0);
    page().push(b);
  };

  for (const b of d.blocs) {
    if (b.type === "texte") {
      if (b.paragraphes.length === 0) continue;
      let courant: string[] = [];
      const fermer = () => {
        if (courant.length > 0) poser({ ...b, paragraphes: courant }, hauteurDuTexte({ ...b, paragraphes: courant }));
        courant = [];
      };
      for (const p of b.paragraphes.flatMap((x) => couperLeParagraphe(x, b.puces))) {
        const essai = [...courant, p];
        if (!tient(hauteurDuTexte({ ...b, paragraphes: essai }))) {
          if (courant.length > 0) fermer();
          if (!tient(hauteurDuTexte({ ...b, paragraphes: [p] }))) nouvelle();
        }
        courant.push(p);
      }
      fermer();
    } else if (b.type === "repere") {
      const h = hauteurDuRepere(b.texte);
      if (!tient(h)) nouvelle();
      poser(b, h);
    } else {
      const largeurs = largeursDesColonnes(b.colonnes, b.lignes.map((x) => x.cellules));
      const tete = (b.legende ? LEGENDE : 0) + hauteurDeLigne(b.colonnes, largeurs);
      let courant: LigneDeTableau[] = [];
      let h = tete;
      const fermer = () => {
        if (courant.length > 0) poser({ ...b, lignes: courant, largeurs }, h);
        courant = [];
        h = tete;
      };
      // Un tableau qui tient sur une page entière n'est pas coupé : il passe à la suivante.
      const entier = tete + b.lignes.reduce((t, l) => t + hauteurDeLigne(l.cellules, largeurs), 0);
      if (!tient(entier) && entier <= CORPS.h) nouvelle();
      for (const [k, l] of b.lignes.entries()) {
        const hl = hauteurDeLigne(l.cellules, largeurs);
        // Pas de ligne seule en haut de la page suivante : la coupure se fait une ligne plus tôt.
        const derniere = k === b.lignes.length - 1 && courant.length > 1;
        if (derniere && !tient(h + hl)) {
          const reportee = courant.pop()!;
          h -= hauteurDeLigne(reportee.cellules, largeurs);
          fermer();
          nouvelle();
          courant.push(reportee);
          h += hauteurDeLigne(reportee.cellules, largeurs);
        }
        if (!tient(h + hl)) {
          if (courant.length > 0) fermer();
          if (!tient(h + hl)) nouvelle();
        }
        courant.push(l);
        h += hl;
      }
      fermer();
    }
  }
  return pages
    .filter((p) => p.length > 0)
    .map((blocs, i) => ({
      disposition: d.disposition ?? (blocs.some((x) => x.type === "tableau") ? "TABLEAU" : "CONTENU"),
      role: d.role,
      ...(d.etape ? { etape: d.etape } : {}),
      titre: i === 0 ? d.titre : `${d.titre} (suite)`,
      blocs,
      notes: d.notes,
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// LE FICHIER : LE THÈME, LES DISPOSITIONS, PUIS CHAQUE DIAPOSITIVE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Les couleurs du site (src/app/globals.css : --marine, --marine-releve, --accent-plein, --argent,
 * --argent-filet), en hexadécimal sans « # » ni transparence, comme pptxgenjs les veut.
 */
export const COULEURS = {
  marine: "0B2545",
  marineReleve: "13355F",
  accent: "FF8A1F",
  argent: "D5DBE4",
  argentFilet: "6B7A8F",
  blanc: "FFFFFF",
} as const;
export const POLICE = "Calibri";

/** Ce que pptxgenjs écrit tel quel dans le XML (le nom de l'éditeur, le titre d'une disposition). */
export const echapperXml = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const filetDuTitre = () => ({ rect: { x: CORPS.x, y: 1.3, w: 1.1, h: 0.06, fill: { color: COULEURS.accent }, line: { color: COULEURS.accent, width: 0 } } });
const numero = (couleur: string) => ({ x: FORMAT.largeur - 1.4, y: FORMAT.hauteur - 0.55, w: 0.9, h: 0.4, fontFace: POLICE, fontSize: TAILLES.tableau, color: couleur, align: "right" as const });

/** Les quatre dispositions. Chaque appel reçoit ses propres objets d'options : pptxgenjs les modifie. */
function poserLesDispositions(pres: PptxGenJS) {
  pres.defineSlideMaster({
    title: echapperXml("TITRE"),
    background: { color: COULEURS.marine },
    objects: [
      { rect: { x: 0.8, y: 2.0, w: 1.4, h: 0.1, fill: { color: COULEURS.accent }, line: { color: COULEURS.accent, width: 0 } } },
      {
        placeholder: {
          options: { name: "titre", type: "title", x: 0.8, y: 2.25, w: 11.7, h: 2.0, fontFace: POLICE, fontSize: TAILLES.titreDeCouverture, bold: true, color: COULEURS.blanc, align: "left", valign: "top", margin: 0 },
          text: "",
        },
      },
    ],
  });
  pres.defineSlideMaster({
    title: echapperXml("SECTION"),
    background: { color: COULEURS.marineReleve },
    objects: [
      { rect: { x: CORPS.x, y: 1.3, w: 1.1, h: 0.08, fill: { color: COULEURS.accent }, line: { color: COULEURS.accent, width: 0 } } },
      {
        placeholder: {
          options: { name: "titre", type: "title", x: CORPS.x, y: 0.3, w: CORPS.w, h: 0.95, fontFace: POLICE, fontSize: 36, bold: true, color: COULEURS.blanc, align: "left", valign: "bottom", margin: 0 },
          text: "",
        },
      },
    ],
    slideNumber: numero(COULEURS.argent),
  });
  for (const nom of ["CONTENU", "TABLEAU"] as const) {
    pres.defineSlideMaster({
      title: echapperXml(nom),
      background: { color: COULEURS.blanc },
      objects: [
        { rect: { x: 0, y: 0, w: FORMAT.largeur, h: 0.14, fill: { color: COULEURS.marine }, line: { color: COULEURS.marine, width: 0 } } },
        filetDuTitre(),
        {
          placeholder: {
            options: { name: "titre", type: "title", x: CORPS.x, y: 0.28, w: CORPS.w, h: 0.97, fontFace: POLICE, fontSize: TAILLES.titre, bold: true, color: COULEURS.marine, align: "left", valign: "bottom", margin: 0 },
            text: "",
          },
        },
      ],
      slideNumber: numero(COULEURS.argentFilet),
    });
  }
}

/** Une colonne de chiffres s'aligne à droite. */
const chiffree = (valeurs: readonly string[]) => {
  const pleines = valeurs.filter((v) => v.trim() !== "" && v !== "…");
  return pleines.length > 0 && pleines.every((v) => /^[−+-]?\s?[\d\s  ,.]+\s?(€|%|jours?|nombres)?$/.test(v.trim()));
};

function poserLeBloc(slide: PptxGenJS.Slide, b: Bloc, y: number, sombre: boolean): number {
  const couleur = sombre ? COULEURS.blanc : COULEURS.marine;
  const h = hauteurDuBloc(b);
  if (b.type === "texte") {
    slide.addText(
      b.paragraphes.map((p, i) => ({
        text: sur(p),
        options: { breakLine: i < b.paragraphes.length - 1, ...(b.puces ? { bullet: { indent: 22 } } : {}), paraSpaceAfter: 8 },
      })),
      { x: CORPS.x, y, w: CORPS.w, h, isTextBox: true, fontFace: POLICE, fontSize: TAILLES.texte, bold: b.fort ?? false, color: couleur, valign: "top", margin: 0.04 },
    );
  } else if (b.type === "repere") {
    slide.addShape("rect", { x: CORPS.x, y, w: 0.09, h, fill: { color: COULEURS.accent }, line: { color: COULEURS.accent, width: 0 } });
    slide.addText(sur(b.texte), { x: CORPS.x + 0.25, y, w: CORPS.w - 0.25, h, isTextBox: true, fontFace: POLICE, fontSize: TAILLES.texte, bold: true, color: couleur, valign: "middle", margin: 0.06 });
  } else {
    let haut = y;
    if (b.legende) {
      slide.addText(sur(b.legende), { x: CORPS.x, y: haut, w: CORPS.w, h: LEGENDE - 0.05, isTextBox: true, fontFace: POLICE, fontSize: TAILLES.tableau, bold: true, color: couleur, valign: "bottom", margin: 0.02 });
      haut += LEGENDE;
    }
    const largeurs = [...(b.largeurs ?? largeursDesColonnes(b.colonnes, b.lignes.map((x) => x.cellules)))];
    const aDroite = b.colonnes.map((_, j) => j > 0 && chiffree(b.lignes.map((l) => l.cellules[j] ?? "")));
    const cellule = (t: string, j: number, entete: boolean, fort: boolean): PptxGenJS.TableCell => ({
      text: sur(t),
      options: {
        bold: entete || fort,
        color: entete ? COULEURS.blanc : COULEURS.marine,
        fill: { color: entete ? COULEURS.marine : COULEURS.blanc },
        align: aDroite[j] ? "right" : "left",
      },
    });
    const rangees: PptxGenJS.TableRow[] = [
      b.colonnes.map((c, j) => cellule(c, j, true, false)),
      ...b.lignes.map((l) => b.colonnes.map((_, j) => cellule(l.cellules[j] ?? "", j, false, l.fort ?? false))),
    ];
    slide.addTable(rangees, {
      x: CORPS.x,
      y: haut,
      w: CORPS.w,
      colW: largeurs,
      // Une hauteur minimale : la ligne grandit avec son texte à l'affichage.
      rowH: [b.colonnes, ...b.lignes.map((l) => l.cellules)].map(() => 0.3),
      fontFace: POLICE,
      fontSize: TAILLES.tableau,
      valign: "middle",
      margin: 0.06,
      border: { type: "solid", pt: 1, color: COULEURS.argent },
      autoPage: false,
    });
  }
  return y + h + ECART;
}

/** Le diaporama d'un chapitre, pour le cas d'une entreprise : le fichier .pptx. */
export async function diaporamaDuChapitre(chapitre: Chapitre, cas: Cas): Promise<Buffer> {
  const plan = planDuDiaporama(chapitre, cas);
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_WIDE";
  pres.theme = { headFontFace: POLICE, bodyFontFace: POLICE };
  pres.title = chapitre.titre;
  pres.subject = `Le diaporama du chapitre, chez ${cas.entreprise}`;
  pres.author = "Business Arena";
  pres.company = echapperXml(`Business Arena · ${cas.entreprise}`);
  poserLesDispositions(pres);

  for (const d of plan) {
    const slide = pres.addSlide({ masterName: echapperXml(d.disposition) });
    slide.addText(sur(d.titre), { placeholder: "titre" });
    const sombre = d.disposition === "TITRE" || d.disposition === "SECTION";
    if (d.disposition === "TITRE") {
      const [premiere] = d.blocs;
      if (premiere?.type === "texte") {
        slide.addText(
          premiere.paragraphes.map((p, i) => ({ text: sur(p), options: { breakLine: i < premiere.paragraphes.length - 1, paraSpaceAfter: 6 } })),
          { x: 0.8, y: 4.45, w: 11.7, h: 2.5, isTextBox: true, fontFace: POLICE, fontSize: 22, color: COULEURS.argent, valign: "top", margin: 0 },
        );
      }
    } else {
      let y: number = CORPS.y;
      for (const b of d.blocs) y = poserLeBloc(slide, b, y, sombre);
    }
    slide.addNotes(d.notes.map(sur).join("\n\n"));
  }
  // `stream` comprime (DEFLATE) ; `write` sous Node ignore l'option et rend un fichier trois fois plus lourd.
  const sortie = await pres.stream({ compression: true });
  return Buffer.from(sortie as Uint8Array);
}
