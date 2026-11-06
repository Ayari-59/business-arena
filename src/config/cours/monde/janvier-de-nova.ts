import { CODES_DES_REGULARISATIONS, regularisationsDeNova } from "../chapitres/regularisations";
import { auCentime } from "./amortissement";
import { cloture, type CodeDeTravail, type LigneDEcriture } from "./cloture";
import { EXERCICE_DE_NOVA } from "./exercice-de-nova";

/**
 * LE MONDE DU COURS : LE JANVIER N+1 DE NOVA, LES EXTOURNES ET LES PIÈCES QUI ARRIVENT (décision du
 * propriétaire, novembre 2026 : une activité par chapitre ; le format « bureau » ; chapitre
 * « Régularisations de fin d'exercice »).
 *
 * Le bureau (config/cours/bureaux/les-pieces-de-janvier.ts) lit tout ici. Le 9 janvier N+1, l'élève
 * ouvre le nouvel exercice de NOVA : il extourne les cinq régularisations du 31 décembre, passe les
 * pièces de janvier qui les dénouent, puis dit au président ce que N+1 en garde.
 *
 * TOUT VIENT DU MONDE ET DU CHAPITRE, RIEN N'EST CHOISI ICI : les cinq régularisations sont celles de la
 * clôture de NOVA (monde/cloture.ts, `cloture`, les travaux que le chapitre nomme) ; les pièces de
 * janvier sont celles de la fiche (monde/exercice-de-nova.ts) : la facture de la commande urgente de
 * CampusTech part le 4 janvier, le compte à terme arrive à échéance le 6, la facture de Composants
 * Express arrive le 8, les 120 enceintes de la facture du 20 décembre sont livrées le 8 ; la prime
 * d'assurance, payée en octobre, ne laisse aucune pièce en janvier. Les montants de N+1 sont ceux du
 * chapitre (`regularisationsDeNova`, l'étape « Ce que garde N+1 »).
 */

const f = EXERCICE_DE_NOVA;

/** L'entreprise du bureau : NOVA, la seule où le chapitre se joue. */
export const ENTREPRISE_DE_JANVIER = f.code;

/** L'extourne d'une régularisation : les lignes du 31 décembre, retournées au 1er janvier. */
export function extourne(code: CodeDeTravail): LigneDEcriture[] {
  const t = cloture(f).travaux.find((x) => x.code === code)!;
  const retournees = t.lignes.map((l) => ({ compte: l.compte, debit: l.credit, credit: l.debit }));
  // Les débits d'abord, comme au journal.
  return [...retournees.filter((l) => l.debit > 0), ...retournees.filter((l) => l.debit === 0)];
}

/** Tout ce que le bureau lit : les régularisations, leurs extournes, les pièces de janvier, ce que N+1 garde. */
export function janvierDeNova() {
  const x = regularisationsDeNova({ code: f.code });
  const k = cloture(f);
  const regularisations = CODES_DES_REGULARISATIONS.map((code) => {
    const t = k.travaux.find((y) => y.code === code)!;
    return { code, libelle: t.libelle, lignes: t.lignes, effet: t.effetSurLeResultat, extourne: extourne(code) };
  });
  const p = f.placement;
  // Ce que chaque opération fait au résultat de N+1 : l'extourne, puis la pièce de janvier.
  const effets = {
    chargeConstateeDAvance: { extourne: -x.prime.chargeConstateeDAvance, piece: 0 },
    factureNonParvenue: { extourne: x.fnp.ht, piece: -x.fnp.ht },
    factureAEtablir: { extourne: -x.fae.ht, piece: x.fae.ht },
    produitConstateDAvance: { extourne: x.pca, piece: 0 },
    interetsDuPlacement: { extourne: -x.placement, piece: x.aLEcheance },
  } as const satisfies Partial<Record<CodeDeTravail, { extourne: number; piece: number }>>;
  const reste = (c: keyof typeof effets) => auCentime(effets[c].extourne + effets[c].piece);
  return {
    x,
    f,
    entreprise: f.entreprise,
    regularisations,
    placement: { capital: p.montant, interets: x.aLEcheance, verse: auCentime(p.montant + x.aLEcheance), compte: p.compte, compteDesInteretsCourus: p.compteDesInteretsCourus, compteDeProduit: p.compteDeProduit, echeance: p.echeance },
    effets,
    reste,
    totalDesExtournes: x.extournes,
    totalDesPieces: x.piecesDeJanvier,
    resteDansNPlus1: x.resteDansNPlus1,
  };
}

export type JanvierDeNova = ReturnType<typeof janvierDeNova>;
