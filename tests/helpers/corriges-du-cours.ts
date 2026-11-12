import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS } from "../../src/config/cours/situations";
import type { ChampDeMontant, Chapitre } from "../../src/config/cours/types";
import { chapitreDuCas, etatAvant, indexDeLEtape } from "../../src/pedagogy/cours/deroule";

/**
 * LES CORRIGÉS DU COURS, LUS COMME L'ÉLÈVE LES LIT : chaque chapitre et chaque cas pratique, dans chaque
 * entreprise où il se joue (comme tests/architecture/deux-decimales.test.ts). Pour les gardes des
 * égalités et des deux chemins (tests/helpers/chaines-des-corriges.ts).
 */

/** Un texte du cours où un calcul peut s'écrire : le corrigé d'un champ, une explication, un retour, une lecture. */
export interface TexteDuCours {
  /** « chapitre / étape chez entreprise ». */
  ou: string;
  code: string;
  quoi: string;
  texte: string;
}

/** Une étape de montants, ses champs dans l'ordre : ce que les deux chemins relisent ensemble. */
export interface EtapeDeMontants {
  ou: string;
  code: string;
  etape: string;
  entreprise: string;
  champs: readonly ChampDeMontant[];
  /** L'explication de l'étape, lue après les champs. */
  explication: readonly string[];
}

const CONTENUS: readonly Chapitre[] = [...CHAPITRES, ...SITUATIONS];

function* parcourir(): Generator<{ chapitre: Chapitre; entreprise: string; d: Chapitre; i: number }> {
  for (const chapitre of CONTENUS) {
    for (const entreprise of ENTREPRISES_DU_COURS.filter((c) => !chapitre.entreprises || chapitre.entreprises.codes.includes(c))) {
      const d = chapitreDuCas(chapitre, casDeLEntreprise(entreprise));
      for (let i = 0; i < d.etapes.length; i++) yield { chapitre, entreprise, d, i };
    }
  }
}

export function etapesDeMontants(): EtapeDeMontants[] {
  const out: EtapeDeMontants[] = [];
  for (const { chapitre, entreprise, d, i } of parcourir()) {
    const e = d.etapes[i]!;
    if (e.type !== "montants") continue;
    const cas = casDeLEntreprise(entreprise);
    const avant = etatAvant(d, cas, i);
    out.push({ ou: `${chapitre.code} / ${e.id} chez ${entreprise}`, code: chapitre.code, etape: e.id, entreprise, champs: e.champs(cas, avant), explication: e.explication(cas, avant) });
  }
  return out;
}

export function textesDuCours(): TexteDuCours[] {
  const out: TexteDuCours[] = [];
  for (const { chapitre, entreprise, d, i } of parcourir()) {
    const e = d.etapes[i]!;
    const cas = casDeLEntreprise(entreprise);
    const ou = `${chapitre.code} / ${e.id} chez ${entreprise}`;
    const ajouter = (quoi: string, textes: readonly string[]) => textes.forEach((texte) => out.push({ ou, code: chapitre.code, quoi, texte }));
    const avant = etatAvant(d, cas, i);
    switch (e.type) {
      case "lecture":
        ajouter("lecture", [...e.texte(cas), ...(e.repere ? [e.repere(cas)] : [])]);
        break;
      case "montants":
        for (const c of e.champs(cas, avant)) ajouter(`corrigé de « ${c.libelle} »`, [c.calcul]);
        ajouter("explication", e.explication(cas, avant));
        break;
      case "ecriture":
        ajouter("explication", e.explication(cas, etatAvant(d, cas, i + 1)));
        break;
      case "choix":
        ajouter("retour", e.options(cas, avant).map((o) => o.retour));
        break;
      case "comparaison": {
        const debut = etatAvant(d, cas, indexDeLEtape(d, e.avantLEtape));
        ajouter("retour", e.options(cas, debut, avant).map((o) => o.retour));
        ajouter("explication", e.explication(cas, debut, avant));
        break;
      }
      case "tri":
        ajouter("explication", e.explication(cas));
        break;
      case "curseur":
        ajouter("explication", e.explication(cas));
        break;
      case "simulation":
        ajouter("explication", e.explication(cas, e.defi(cas).solution));
        break;
      case "a-completer":
        for (const l of e.grille(cas).lignes) for (const c of l.cellules) if (c.saisir && c.calcul) ajouter(`corrigé de « ${l.libelle} »`, [c.calcul]);
        ajouter("explication", e.explication(cas));
        break;
    }
  }
  return out;
}
