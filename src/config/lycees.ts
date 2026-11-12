import { DIPLOMES_PROPOSES, essaiDuDiplome, type EssaiDuDiplome } from "./cours/chapitres-libres";
import { ouvreLExamen, palierDeLArene, parametresAreneDe, remplir, type Catalogue, type ParametresArene } from "./catalogue";
import {
  ELEVES_PAR_CLASSE,
  ENTREPRISE_DES_CONCOURS,
  ENTREPRISES,
  LE_COURS_PAR_OFFRE,
  OFFRES_DE_L_ARENE,
  nomDeLEntreprise,
  nomDOffre,
  variablesDuCatalogue,
  type OffreDeLArene,
} from "./tarifs";

/**
 * LA PAGE DES LYCÉES (/lycees), POUR LE PROVISEUR (décision du propriétaire, 11 novembre 2026 ; audit de
 * l'offre du même jour, P1-3 : le lycée n'avait pas de porte, « Établissements » parlait aux écoles de
 * commerce et son premier bouton menait au devis des épisodes, qui ne s'annoncent pas au lycée).
 *
 * RIEN N'Y EST RECOPIÉ :
 *  · LES DIPLÔMES sont le bac STMG et les BTS, lus dans les formations proposées (une option compte
 *    pour son diplôme), et LE CHAPITRE LIBRE de chacun, avec son cas pratique, est celui de la liste
 *    (config/cours/chapitres-libres.ts, `CHAPITRE_LIBRE_DU_DIPLOME`, par `essaiDuDiplome`) ;
 *  · LES OFFRES se disent comme le code les applique : le paramétrage de l'arène de chaque offre du
 *    catalogue (`parametresAreneDe` ; par défaut, `PARAMETRAGE_DES_OFFRES`), que la licence vendue
 *    reprend et que le serveur tient (config/tarifs.ts, `horsLicence`) ; le plafond d'élèves de l'offre
 *    Classe (services/acces.service.ts, `plafondDEleves`) ; ce que chaque palier ouvre du cours
 *    (`LE_COURS_PAR_OFFRE`, services/cours.service.ts) ; l'entreprise des concours ; l'examen, quand
 *    l'offre porte son module.
 * Garde : tests/architecture/pages-de-l-offre.test.ts.
 */

/** Les diplômes du lycée : le bac STMG et les BTS, dans l'ordre du registre des formations. */
export const DIPLOMES_DES_LYCEES = DIPLOMES_PROPOSES.filter((f) => f.code === "stmg" || f.code.startsWith("bts-"));

/** Le chapitre libre de chacun, et son cas pratique : la liste du propriétaire. */
export const ESSAIS_DES_LYCEES: readonly EssaiDuDiplome[] = DIPLOMES_DES_LYCEES.map((f) => essaiDuDiplome(f.code)).filter(
  (e): e is EssaiDuDiplome => e !== null,
);

export interface OffrePourLesLycees {
  code: OffreDeLArene;
  /** Le nom de l'offre, lu dans la grille (`nomDOffre`). */
  nom: string;
  /** À qui elle s'ouvre, en une phrase. */
  pourQui: string;
  /** Ce que l'application ouvre avec elle, ligne par ligne. */
  lignes: string[];
  /** Son devis : la carte de l'offre au catalogue. */
  devis: string;
}

/** « une entreprise et un niveau, écrits au devis », d'après le paramétrage de l'offre. */
function dansLArene(p: ParametresArene, palier: OffreDeLArene, niveaux: string): string {
  const quoi =
    p.entreprises === "une" && p.niveaux === "un"
      ? "une entreprise et un niveau, écrits au devis"
      : p.entreprises === "une"
        ? `une entreprise, écrite au devis, à tous les niveaux, de ${niveaux}`
        : p.niveaux === "un"
          ? `les ${ENTREPRISES.length} entreprises, à un niveau écrit au devis`
          : `les ${ENTREPRISES.length} entreprises, à tous les niveaux, de ${niveaux}`;
  const parties =
    p.partiesEnCours === 1
      ? "une partie à la fois"
      : p.partiesEnCours === null
        ? "plusieurs parties en même temps"
        : `${p.partiesEnCours} parties en même temps`;
  // Le plafond d'élèves tient au palier Classe (services/acces.service.ts, `plafondDEleves`).
  const eleves = palier === "classe" ? `de ${ELEVES_PAR_CLASSE} élèves au plus` : "sans plafond d'élèves";
  return `Dans l'arène : ${quoi} ; ${parties}, ${eleves}.`;
}

/** À qui l'offre s'ouvre : le plafond d'enseignants de son paramétrage. */
function pourQui(p: ParametresArene): string {
  if (p.enseignants === 1) return "Un enseignant, pour ses classes.";
  if (p.enseignants === "devis") return "Une équipe d'enseignants et d'intervenants, au nombre fixé au devis.";
  if (p.enseignants === null) return "Tous les enseignants et intervenants du lycée, sans limite.";
  return `${p.enseignants} enseignants et intervenants au plus.`;
}

/** Les concours : ils se jouent avec une seule entreprise (config/tarifs.ts, `ENTREPRISE_DES_CONCOURS`). */
function lesConcours(p: ParametresArene): string {
  const nova = nomDeLEntreprise(ENTREPRISE_DES_CONCOURS);
  if (p.entreprises === "toutes") return `Les concours entre classes, qui se jouent avec ${nova}.`;
  return p.partiesEnCours === 1
    ? `Un concours à la place d'une partie, si l'entreprise choisie est ${nova} : les concours se jouent avec elle.`
    : `Les concours entre classes, si l'entreprise choisie est ${nova} : les concours se jouent avec elle.`;
}

/**
 * LES OFFRES CLASSE, PROGRAMME ET CAMPUS, COMME LE CODE LES APPLIQUE, lues au catalogue (/admin/offres) :
 * le paramétrage de l'arène de chacune et ses modules. Une offre masquée ou sans arène ne se dit pas.
 */
export function offresPourLesLycees(c: Catalogue): OffrePourLesLycees[] {
  const variables = variablesDuCatalogue();
  return OFFRES_DE_L_ARENE.flatMap((code) => {
    const o = c.offres.find((x) => x.code === code && x.visible);
    const p = o ? parametresAreneDe(o) : null;
    if (!o || !p) return [];
    const palier = palierDeLArene(p);
    const lignes = [
      dansLArene(p, palier, variables.niveaux!),
      remplir(LE_COURS_PAR_OFFRE[palier], variables),
      lesConcours(p),
      ...(ouvreLExamen(o) ? ["L'examen individuel : une partie solo notée sur une grille fixe, la même pour tous les candidats."] : []),
    ];
    return [{ code, nom: nomDOffre(code), pourQui: pourQui(p), lignes, devis: o.bouton.cible || `/devis?offre=${code}` }];
  });
}
