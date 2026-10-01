import { ATELIERS } from "./ateliers";
import { adosseAUnReferentiel } from "./ateliers/referentiels";
import { GESTES } from "./competences";
import { FORMATIONS } from "./formations";

/**
 * LA TABLE DE CORRESPONDANCE GESTE ↔ RÉFÉRENTIEL — DÉDUITE, PAS ÉCRITE.
 *
 * CE QUI COINCE AUJOURD'HUI. Un atelier déclare un diplôme, au singulier, et
 * chacune de ses séances nomme les blocs du référentiel DANS LE VOCABULAIRE DE
 * CE DIPLÔME. Le lien atelier → formation est donc écrit en dur, séance par
 * séance : un atelier ne peut pas servir un second diplôme sans que toutes ses
 * séances soient réécrites. Ce n'est pas une contrainte pédagogique, c'est une
 * forme de données, et elle coûte cher. L'atelier de découverte ne travaille
 * que des gestes déjà présents dans les référentiels de sept diplômes, et il
 * n'est rattaché à aucun. L'atelier d'approfondissement atteindrait quatre
 * blocs sur quatre du DCG ; il n'est rattaché à aucun non plus.
 *
 * CE QUE CE FICHIER DÉDUIT. Une séance nomme déjà deux choses : les blocs du
 * référentiel qu'elle mobilise, et — depuis le socle — les gestes qu'elle fait
 * travailler. Leur coexistence DANS UNE MÊME SÉANCE est un lien, et personne
 * n'a besoin de l'écrire. Toute la table en sort.
 *
 * CE QU'UN LIEN DÉDUIT VAUT, ET CE QU'IL NE VAUT PAS. C'est un CANDIDAT. Deux
 * choses présentes dans la même séance ne se servent pas forcément l'une
 * l'autre : une séance qui travaille le seuil de rentabilité et nomme au
 * passage le bloc « Rendre compte » produit un lien que personne ne
 * revendiquerait. D'où les témoins : un lien attesté par quatre séances est
 * d'une autre nature qu'un lien vu une fois, et c'est par les seconds qu'il
 * faut commencer à élaguer. ECARTES recueille ce qui a été coupé, avec sa
 * raison, parce qu'une coupe sans motif se re-fera dans l'autre sens dans six
 * mois.
 *
 * RIEN N'EST BRANCHÉ. Les ateliers gardent leur diplôme unique et leurs blocs
 * écrits à la main ; la page des parcours ne lit pas ce fichier. Il sert à
 * arbitrer, et le rapport se lit par
 * `npx tsx scripts/correspondance-referentiels.ts`.
 */

/** Un lien entre un geste du socle et un bloc de référentiel d'un diplôme. */
export interface Lien {
  geste: string;
  referentiel: string;
  /** Les séances qui attestent le lien, « atelier:séance ». Jamais vide. */
  temoins: readonly string[];
  /**
   * COMBIEN DE BLOCS NOMMAIT LA SÉANCE LA MOINS AMBIGUË.
   *
   * C'est la seule mesure honnête de ce qu'un lien engage, et ce n'est PAS le
   * nombre de témoins : 294 des 337 liens n'en ont qu'un, parce que chaque
   * séance est une combinaison unique. Compter les témoins ne trierait rien.
   *
   * L'ambiguïté ne vient pas non plus du nombre de gestes : une séance qui
   * travaille quatre gestes et ne nomme qu'un bloc donne quatre liens sûrs.
   * Elle vient des BLOCS. Si la séance n'en nomme qu'un, tout ce qu'elle fait
   * travailler sert ce bloc, sans discussion. Si elle en nomme quatre, le
   * geste en sert un ou deux et la coexistence ne dit pas lesquels : le lien
   * est une chance sur quatre, et c'est par ceux-là qu'on élague.
   */
  blocsDeLaSeance: number;
}

/**
 * LES LIENS ÉCARTÉS À LA MAIN.
 *
 * Vide pour l'instant, et c'est normal : personne n'a encore relu les liens.
 * Une entrée ici retire un lien que la coexistence produit mais que le
 * référentiel ne justifie pas. La raison n'est pas un ornement — c'est ce qui
 * empêche la coupe d'être refaite à l'envers par quelqu'un qui ne saura pas
 * qu'elle a été examinée.
 */
export const ECARTES: readonly {
  formation: string;
  geste: string;
  referentiel: string;
  raison: string;
}[] = [];

const ECARTE = new Set(
  ECARTES.map((e) => `${e.formation}|${e.geste}|${e.referentiel}`),
);

/** Les gestes qu'une séance fait travailler, lus des origines du socle. */
const GESTES_PAR_SEANCE = (() => {
  const m = new Map<string, Set<string>>();
  for (const g of GESTES) {
    for (const origine of g.origines) {
      const [code, numero] = origine.split(":");
      const cle = `${code}:${numero}`;
      if (!m.has(cle)) m.set(cle, new Set());
      m.get(cle)!.add(g.code);
    }
  }
  return m;
})();

export function gestesDeLaSeance(atelier: string, numero: number): string[] {
  return [...(GESTES_PAR_SEANCE.get(`${atelier}:${numero}`) ?? [])];
}

/** Les gestes qu'un atelier fait travailler, toutes séances confondues. */
export function gestesDeLAtelier(atelier: string): string[] {
  const vus = new Set<string>();
  for (const s of ATELIERS.find((a) => a.code === atelier)?.seances ?? []) {
    for (const g of gestesDeLaSeance(atelier, s.numero)) vus.add(g);
  }
  return [...vus];
}

/**
 * LES FORMATIONS SERVIES, ET LES ATELIERS QUI LES SERVENT.
 *
 * Le regroupement se faisait sur le NOM du diplôme porté par l'atelier, ce qui
 * interdisait qu'un atelier en serve deux : un nom n'a qu'une valeur. Il se
 * fait sur les rattachements déclarés, donc un atelier paraît sous chacune des
 * formations qu'il sert, et le tournoi inter-filières sous les quatre.
 */
export function formationsAdossees(): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const f of FORMATIONS) {
    const siens = ATELIERS.filter(
      (a) => a.formations.includes(f.code) && adosseAUnReferentiel(a.code),
    ).map((a) => a.code);
    if (siens.length) m.set(f.code, siens);
  }
  return m;
}

/**
 * LA CORRESPONDANCE D'UN DIPLÔME : ses liens geste ↔ bloc, les plus attestés
 * d'abord, puisque ce sont les derniers qu'on remettra en cause.
 */
export function correspondanceDeLaFormation(formation: string): Lien[] {
  const codes = formationsAdossees().get(formation) ?? [];
  const liens = new Map<string, { temoins: string[]; blocs: number }>();
  for (const code of codes) {
    const atelier = ATELIERS.find((a) => a.code === code);
    if (!atelier) continue;
    for (const seance of atelier.seances) {
      for (const geste of gestesDeLaSeance(code, seance.numero)) {
        for (const bloc of seance.processus) {
          if (ECARTE.has(`${formation}|${geste}|${bloc}`)) continue;
          const cle = `${geste}|${bloc}`;
          const vu = liens.get(cle) ?? {
            temoins: [],
            blocs: Number.MAX_SAFE_INTEGER,
          };
          vu.temoins.push(`${code}:${seance.numero}`);
          vu.blocs = Math.min(vu.blocs, seance.processus.length);
          liens.set(cle, vu);
        }
      }
    }
  }
  return [...liens.entries()]
    .map(([cle, vu]) => {
      const [geste, referentiel] = cle.split("|");
      return {
        geste: geste!,
        referentiel: referentiel!,
        temoins: vu.temoins,
        blocsDeLaSeance: vu.blocs,
      };
    })
    .sort(
      (a, b) =>
        a.blocsDeLaSeance - b.blocsDeLaSeance ||
        b.temoins.length - a.temoins.length ||
        a.geste.localeCompare(b.geste),
    );
}

/** Tous les blocs de référentiel d'un diplôme, quels que soient ses chemins. */
export function blocsDeLaFormation(formation: string): string[] {
  const vus = new Set<string>();
  for (const code of formationsAdossees().get(formation) ?? []) {
    for (const s of ATELIERS.find((a) => a.code === code)?.seances ?? []) {
      s.processus.forEach((p) => vus.add(p));
    }
  }
  return [...vus];
}

/**
 * CE QU'UN ENSEMBLE DE GESTES ATTEINT DANS UN DIPLÔME.
 *
 * C'est la fonction qui, le jour où les séances citeront des gestes, dira
 * qu'un atelier sert un diplôme pour lequel il n'a pas été écrit.
 *
 * ATTEINDRE N'EST PAS COUVRIR. Un bloc est atteint dès qu'un seul geste le
 * touche : c'est un plancher, pas une promesse, et la page des parcours devra
 * continuer de dire à quel point, pas seulement si.
 */
export function blocsAtteints(
  gestes: readonly string[],
  formation: string,
): string[] {
  const parGeste = new Map<string, Set<string>>();
  for (const lien of correspondanceDeLaFormation(formation)) {
    if (!parGeste.has(lien.geste)) parGeste.set(lien.geste, new Set());
    parGeste.get(lien.geste)!.add(lien.referentiel);
  }
  const atteints = new Set<string>();
  for (const g of gestes)
    for (const b of parGeste.get(g) ?? []) atteints.add(b);
  return [...atteints];
}
