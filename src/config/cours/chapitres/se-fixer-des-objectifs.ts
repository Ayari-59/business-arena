import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { accordPluriel } from "../accords";
import { type Cas } from "../cas";
import {
  ENTREPRISES_DE_LA_GESTION_DE_BASE,
  FICHE_DE_CAPACITE,
  TAUX_DE_CAPACITE_VISE,
  TAUX_ESSAYES,
  suiviDesObjectifs as suiviDuMonde,
  tauxTenuChaqueTrimestre,
  type VerdictDeLObjectif,
} from "../monde/gestion-et-information";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : SE FIXER DES OBJECTIFS ET LES SUIVRE
 * (Stratégie et management, palier 1 : seconde option management et gestion, première STMG).
 *
 * En janvier de l'année N, la direction de NOVA se fixe un objectif de ventes chiffré, daté et
 * mesurable : vendre chaque trimestre au moins une part de ce qu'elle peut produire. Puis elle le
 * suit, trimestre après trimestre : l'écart entre l'objectif et le réalisé, ce qui l'explique (des
 * clients trop peu nombreux, ou des clients repartis sans être servis, faute d'une production
 * suffisante), et ce qu'elle en conclut : objectif tenu, à revoir dans ses moyens, ou mal posé. Un
 * curseur (le plus haut objectif que chaque trimestre de N aurait tenu) et un laboratoire (l'objectif
 * à poser pour N + 1, sur la demande prévue).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : la capacité de la ligne et de l'équipe,
 * les ventes réalisées de N et la demande prévue de N + 1 (nova-capacite.ts, lus par
 * monde/gestion-et-information.ts). En N, toute la demande a été servie : les ventes sont la demande.
 *
 * CE QUI A CHANGÉ. Le chapitre suivait l'année de l'arène, dans huit entreprises. Il suit maintenant
 * l'année N de NOVA : 7 000 enceintes de capacité par trimestre, un objectif de 4 900, 23 609
 * enceintes vendues pour 19 600 visées.
 */

export { TAUX_DE_CAPACITE_VISE };

/** Les entreprises du chapitre : NOVA seule. */
export const ENTREPRISES_DES_OBJECTIFS = ENTREPRISES_DE_LA_GESTION_DE_BASE;

export const POURQUOI_LES_OBJECTIFS =
  "ce chapitre suit NOVA, dont le cours tient la capacité, les ventes de l'année N et la demande prévue de l'année suivante.";

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
/** Le prix d'une enceinte : les droites du curseur comptent en chiffre d'affaires. */
const PRIX = FICHE_DE_CAPACITE.enceinte.prix;
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
/** Un écart signé : « +250 », « −1 078 ». */
const signe = (n: number) => (n > 0 ? `+${qte(n)}` : qte(n));
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const quE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `qu'${nom}` : `que ${nom}`);
const rang = (k: number) => (k === 1 ? "1er" : `${k}e`);

export type Verdict = VerdictDeLObjectif;

/** L'objectif posé en janvier de N, et l'année suivie face à lui (avec les mots du chapitre). */
export function suiviDesObjectifs(_c?: Cas, taux = TAUX_DE_CAPACITE_VISE, annee: "N" | "N+1" = "N") {
  const o = suiviDuMonde(FICHE_DE_CAPACITE, taux, annee);
  return { ...o, capaciteMachines: o.outil, capaciteEquipe: o.equipe };
}

/** L'objectif, en une phrase : « vendre au moins 4 900 enceintes chaque trimestre de l'année ». */
export const phraseDeLObjectif = (c: Cas, objectif: number) => `vendre au moins ${qte(objectif)} ${c.unites} chaque trimestre de l'année`;

const LIBELLES_DU_VERDICT: Record<Verdict, string> = {
  tenu: "Objectif tenu : les ventes de l'année l'atteignent",
  "a-revoir": "Objectif à revoir dans ses moyens : la demande était là, la production n'a pas suivi",
  "mal-pose": "Objectif mal posé : même en servant tous ses clients, l'entreprise ne l'atteignait pas",
};

/** La conclusion, dans une phrase. */
const CONCLUSIONS: Record<Verdict, string> = {
  tenu: "l'objectif est tenu",
  "a-revoir": "l'objectif était à portée, ce sont les moyens de l'atteindre qui sont à revoir",
  "mal-pose": "l'objectif était mal posé, hors de portée de la demande",
};

export const SE_FIXER_DES_OBJECTIFS: Chapitre = {
  code: "se-fixer-des-objectifs",
  parcours: "strategie",
  palier: 1,
  blocs: [
    "STMG Thème 2 · Le management stratégique, du diagnostic à la fixation des objectifs",
    "2de MG · Organiser et décider, des objectifs à la réalisation",
  ],
  titre: "Se fixer des objectifs et les suivre",
  accroche:
    "Un objectif chiffré, daté et mesurable, posé en janvier, puis suivi trimestre après trimestre : l'écart avec le réalisé, ce qui l'explique, et ce que la direction en conclut.",
  objectifs: [
    "Reconnaître un objectif bien posé : spécifique, mesurable, atteignable, réaliste, daté",
    "Chiffrer un objectif à partir de la capacité de l'entreprise",
    "Calculer l'écart entre l'objectif et le réalisé, trimestre après trimestre",
    "Expliquer un écart : la demande, ou les moyens",
    "Conclure : objectif tenu, à revoir, ou mal posé",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DES_OBJECTIFS, pourquoi: POURQUOI_LES_OBJECTIFS },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un objectif pour l'année",
      notions: ["capacity", "dashboard"],
      texte: (c) => {
        const o = suiviDesObjectifs(c);
        return [
          `En janvier de l'année N, la direction ${dE(c.entreprise)} se fixe un objectif de ventes : ${phraseDeLObjectif(c, o.objectif)}. Elle l'a déduit de ce que l'entreprise peut produire : ${pct(o.taux * 100)} de sa capacité de production par trimestre.`,
          "Un objectif bien posé se vérifie. Il dit précisément ce qu'on vise (spécifique), avec un chiffre (mesurable), à un niveau qu'on peut atteindre (atteignable et réaliste), pour une date (temporel) : on dit SMART. Il se suit ensuite, période après période, en comparant le réalisé à l'objectif.",
        ];
      },
      tableau: (c) => {
        const o = suiviDesObjectifs(c);
        return {
          titre: "Ce que l'entreprise peut produire par trimestre, en janvier",
          colonnes: [`En ${c.unites}`],
          lignes: [
            { libelle: "Capacité de l'équipement", valeurs: [qte(o.capaciteMachines)] },
            { libelle: "Capacité de l'équipe", valeurs: [qte(o.capaciteEquipe)] },
          ],
        };
      },
      repere: () => "Un objectif SMART : spécifique, mesurable, atteignable, réaliste, temporel. Écart = réalisé − objectif.",
    },
    {
      id: "smart",
      objectifs: [0],
      type: "choix",
      titre: "Un objectif bien posé",
      notions: ["dashboard"],
      question: () => "Pourquoi l'objectif de la direction est-il mieux posé que « vendre le plus possible » ?",
      options: () => [
        {
          texte: "Il est chiffré et daté : chaque trimestre, on saura s'il est atteint",
          juste: true,
          retour: `Oui. « Vendre le plus possible » ne se mesure pas : on ne sait jamais si c'est atteint. Un objectif chiffré (un nombre de ventes) et daté (chaque trimestre de l'année) se compare au réalisé, et l'écart dit s'il faut réagir.`,
        },
        {
          texte: "Il est plus facile à atteindre, donc il motive davantage",
          juste: false,
          retour: "Non : un objectif n'est pas fait pour être facile. Il est bien posé parce qu'il se mesure et qu'il a une date ; trop facile, il ne servirait à rien.",
        },
        {
          texte: "Il oblige l'entreprise à produire toute sa capacité",
          juste: false,
          retour: `Non : l'objectif vise ${pct(TAUX_DE_CAPACITE_VISE * 100)} de la capacité, pas toute. Il est bien posé parce qu'il est chiffré et daté.`,
        },
      ],
    },
    {
      id: "objectif",
      objectifs: [1],
      type: "montants",
      titre: "Chiffrer l'objectif",
      notions: ["capacity"],
      question: (c) => {
        const o = suiviDesObjectifs(c);
        return `L'entreprise ne peut pas produire plus que la plus petite de ses deux capacités. Calculez la capacité de production retenue, l'objectif de ventes par trimestre (${pct(o.taux * 100)} de cette capacité, à l'unité), puis l'objectif de l'année (${o.trimestres.length} trimestres).`;
      },
      champs: (c) => {
        const o = suiviDesObjectifs(c);
        return [
          {
            libelle: "Capacité de production retenue, par trimestre",
            attendu: o.capacite,
            calcul: `la plus petite de ${qte(o.capaciteMachines)} et ${qte(o.capaciteEquipe)} : ${qte(o.capacite)}`,
            tolerance: 0,
          },
          {
            libelle: "Objectif de ventes par trimestre",
            attendu: o.objectif,
            calcul: `${qte(o.capacite)} × ${o.taux.toLocaleString("fr-FR")} = ${qte(o.objectif)}`,
            tolerance: 1,
          },
          {
            libelle: "Objectif de ventes de l'année",
            attendu: o.objectifDeLAnnee,
            calcul: `${qte(o.objectif)} × ${o.trimestres.length} = ${qte(o.objectifDeLAnnee)}`,
            tolerance: 4,
          },
        ];
      },
      explication: (c) => {
        const o = suiviDesObjectifs(c);
        const limite = o.capaciteEquipe < o.capaciteMachines ? "l'équipe" : "l'équipement";
        return [
          `C'est ${limite} qui limite ce ${quE(c.entreprise)} peut produire : ${qte(o.capacite)} ${c.unites} par trimestre. L'objectif est donc de ${qte(o.objectif)} ${c.unites} par trimestre, ${qte(o.objectifDeLAnnee)} sur l'année.`,
        ];
      },
    },
    {
      id: "ecarts",
      objectifs: [2],
      type: "montants",
      titre: "L'écart, trimestre après trimestre",
      notions: ["dashboard"],
      tableau: (c) => {
        const o = suiviDesObjectifs(c);
        return {
          titre: `L'objectif et le réalisé, en ${c.unites}`,
          colonnes: o.trimestres.map((x) => `T${x.numero}`),
          lignes: [
            { libelle: "Objectif", valeurs: o.trimestres.map(() => qte(o.objectif)) },
            { libelle: "Ventes réalisées", valeurs: o.trimestres.map((x) => qte(x.ventes)) },
          ],
        };
      },
      question: () =>
        "Calculez l'écart de chaque trimestre (ventes réalisées moins objectif : négatif quand l'objectif est manqué), puis le taux de réalisation de l'année (ventes de l'année sur objectif de l'année, en pourcentage au dixième).",
      champs: (c) => {
        const o = suiviDesObjectifs(c);
        return [
          ...o.trimestres.map((x) => ({
            libelle: `Écart du ${rang(x.numero)} trimestre`,
            attendu: x.ecart,
            calcul: `${qte(x.ventes)} − ${qte(o.objectif)} = ${signe(x.ecart)}`,
            tolerance: 1,
          })),
          {
            libelle: "Taux de réalisation de l'année (%)",
            attendu: o.realisation,
            calcul: `${qte(o.ventesDeLAnnee)} ÷ ${qte(o.objectifDeLAnnee)} × 100 = ${pct(o.realisation)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const o = suiviDesObjectifs(c);
        return [
          `L'objectif est tenu ${o.tenus} ${o.tenus > 1 ? "trimestres" : "trimestre"} sur ${o.trimestres.length}. Sur l'année, ${c.entreprise} vend ${qte(o.ventesDeLAnnee)} ${c.unites} pour un objectif de ${qte(o.objectifDeLAnnee)} : un taux de réalisation de ${pct(o.realisation)}, un écart de ${signe(o.ecartDeLAnnee)} ${c.unites}.`,
          "Suivre un objectif, c'est lire l'écart à chaque période, sans attendre la fin de l'année : un écart vu tôt se corrige encore.",
        ];
      },
    },
    {
      id: "origine",
      objectifs: [3],
      type: "choix",
      titre: "D'où vient l'écart ?",
      notions: ["capacity", "stock"],
      tableau: (c) => {
        const o = suiviDesObjectifs(c);
        return {
          titre: `Ce que les clients ont demandé à ${c.entreprise}, en ${c.unites}`,
          colonnes: o.trimestres.map((x) => `T${x.numero}`),
          lignes: [
            { libelle: "Objectif", valeurs: o.trimestres.map(() => qte(o.objectif)) },
            { libelle: "Demande adressée à l'entreprise", valeurs: o.trimestres.map((x) => qte(x.demande)) },
            { libelle: "Ventes réalisées", valeurs: o.trimestres.map((x) => qte(x.ventes)) },
            { libelle: "Ventes manquées, faute d'avoir produit assez", valeurs: o.trimestres.map((x) => qte(x.manquees)) },
          ],
        };
      },
      question: (c) => {
        const o = suiviDesObjectifs(c);
        return `Le ${rang(o.pire.numero)} trimestre est le plus loin de l'objectif (écart de ${signe(o.pire.ecart)} ${c.unites}). D'où vient cet écart ?`;
      },
      options: (c) => {
        const o = suiviDesObjectifs(c);
        const t = o.pire;
        const chiffres = `la demande adressée était de ${qte(t.demande)} ${c.unites}, pour un objectif de ${qte(o.objectif)}`;
        return [
          {
            texte: "De la demande : il n'y avait pas assez de clients pour atteindre l'objectif",
            juste: t.origine === "demande",
            retour:
              t.origine === "demande"
                ? `Oui : ${chiffres}. Même en servant tous ses clients, l'entreprise n'atteignait pas l'objectif ce trimestre.`
                : `Non : ${chiffres}. Les clients étaient assez nombreux ; ${qte(t.manquees)} ${c.unites} ${accordPluriel(c, "demandé")} n'ont pas été ${accordPluriel(c, "servi")}.`,
          },
          {
            texte: "De la production : des clients sont repartis sans être servis",
            juste: t.origine === "production",
            retour:
              t.origine === "production"
                ? `Oui : ${chiffres}. Les clients étaient là, mais ${qte(t.manquees)} ${c.unites} ${accordPluriel(c, "demandé")} n'ont pas été ${accordPluriel(c, "servi")}, faute d'avoir produit assez. C'est un moyen à revoir, pas l'objectif.`
                : `Non : ${chiffres}. Même en servant tous ses clients, l'entreprise n'y arrivait pas : c'est la demande qui manquait.`,
          },
          {
            texte: "D'une erreur de calcul : un écart négatif veut dire que l'objectif est dépassé",
            juste: false,
            retour: `Non : l'écart est le réalisé moins l'objectif. Négatif, il dit que les ventes (${qte(t.ventes)}) sont restées sous l'objectif (${qte(o.objectif)}).`,
          },
        ];
      },
    },
    {
      id: "conclusion",
      objectifs: [4],
      type: "choix",
      titre: "Que conclut la direction ?",
      notions: ["dashboard", "capacity"],
      question: (c) => {
        const o = suiviDesObjectifs(c);
        return `Sur l'année, ${c.entreprise} a vendu ${qte(o.ventesDeLAnnee)} ${c.unites}, pour un objectif de ${qte(o.objectifDeLAnnee)} ; ses clients en ont demandé ${qte(o.demandeDeLAnnee)}. Que conclut la direction ?`;
      },
      options: (c) => {
        const o = suiviDesObjectifs(c);
        const chiffres = `${qte(o.ventesDeLAnnee)} ${c.unites} ${accordPluriel(c, "vendu")}, ${qte(o.demandeDeLAnnee)} ${accordPluriel(c, "demandé")}, pour un objectif de ${qte(o.objectifDeLAnnee)}`;
        const retours: Record<Verdict, string> = {
          tenu:
            o.verdict === "tenu"
              ? `Oui : ${chiffres}. L'objectif de l'année est atteint${o.tenus < o.trimestres.length ? `, même si ${o.trimestres.length - o.tenus} ${o.trimestres.length - o.tenus > 1 ? "trimestres l'ont manqué" : "trimestre l'a manqué"}` : ""} ; l'an prochain, la direction peut le relever.`
              : `Non : ${chiffres}. Les ventes de l'année restent sous l'objectif, de ${qte(-o.ecartDeLAnnee)} ${c.unites}.`,
          "a-revoir":
            o.verdict === "a-revoir"
              ? `Oui : ${chiffres}. L'objectif était à portée : en servant tous ses clients, l'entreprise l'atteignait. Ce sont les moyens qui sont à revoir : produire assez pour servir la demande.`
              : o.verdict === "tenu"
                ? `Non : ${chiffres}. L'objectif est atteint.`
                : `Non : ${chiffres}. Même en servant tous ses clients, l'entreprise n'atteignait pas l'objectif : produire davantage n'y aurait pas suffi.`,
          "mal-pose":
            o.verdict === "mal-pose"
              ? `Oui : ${chiffres}. Même en servant tous ses clients, l'entreprise n'atteignait pas l'objectif : il n'était pas réaliste, au prix et avec l'offre de l'année. La direction le repose, plus bas, ou se donne d'abord les moyens d'attirer plus de clients.`
              : o.verdict === "tenu"
                ? `Non : ${chiffres}. L'objectif est atteint : il était réaliste.`
                : `Non : ${chiffres}. La demande de l'année suffisait à atteindre l'objectif : il était réaliste, ce sont les moyens qui ont manqué.`,
        };
        return (["tenu", "a-revoir", "mal-pose"] as const).map((v) => ({ texte: LIBELLES_DU_VERDICT[v], juste: v === o.verdict, retour: retours[v] }));
      },
    },
    {
      id: "le-plus-haut-objectif",
      objectifs: [1],
      type: "curseur",
      titre: "Le plus haut objectif tenu chaque trimestre",
      notions: ["capacity", "dashboard"],
      sens: "plus-grande",
      question: (c) => {
        const o = suiviDesObjectifs(c);
        return `Et si la direction avait visé plus haut ? Faites varier la part de la capacité visée, en pour cent. Les deux droites comptent en chiffre d'affaires, à ${eur(PRIX)} l'${c.unite} : l'une donne celui du trimestre le plus faible de l'année (${qte(o.pire.ventes)} ${c.unites}), l'autre celui de l'objectif par trimestre. Placez le curseur sur la plus haute part que chaque trimestre de l'année aurait tenue.`;
      },
      grandeur: () => ({ libelle: "Part de la capacité visée", unite: "%" }),
      cible: () => ({ attendu: tauxTenuChaqueTrimestre(FICHE_DE_CAPACITE, "N"), min: 50, max: 100 }),
      zones: ["Chaque trimestre tient l'objectif", "Un trimestre au moins le manque"],
      rates: () => ({ dessous: "Chaque trimestre tient cet objectif, mais un objectif plus haut l'aurait été aussi : cherchez le plus haut.", dessus: "Avec cet objectif, le trimestre le plus faible le manque." }),
      montrer: "Montrer la part",
      lecture: (_c, t) => {
        const o = suiviDesObjectifs(undefined, t / 100);
        return [
          { libelle: "Chiffre d'affaires de l'objectif par trimestre", montant: o.objectif * PRIX },
          { libelle: "Chiffre d'affaires du trimestre le plus faible", montant: Math.min(...o.trimestres.map((x) => x.ventes)) * PRIX, fort: true },
        ];
      },
      droites: () => {
        const o = suiviDesObjectifs();
        const pire = Math.min(...o.trimestres.map((x) => x.ventes));
        return { produit: () => pire * PRIX, cout: (t) => Math.round((o.capacite * t) / 100) * PRIX, libelles: ["Trimestre le plus faible", "Objectif par trimestre"] };
      },
      explication: (c) => {
        const t = tauxTenuChaqueTrimestre(FICHE_DE_CAPACITE, "N");
        const o = suiviDesObjectifs(c, t / 100);
        const plus = suiviDesObjectifs(c, (t + 1) / 100);
        return [
          `À ${qte(t)} % de la capacité, l'objectif est de ${qte(o.objectif)} ${c.unites} : le trimestre le plus faible, avec ${qte(o.pire.ventes)} ${c.unites}, le tient. À ${qte(t + 1)} %, il faudrait ${qte(plus.objectif)} : il le manque.`,
          `Le ${rang(o.pire.numero)} trimestre est le plus faible de l'année : un objectif par trimestre doit tenir compte de la saison, ou se poser sur l'année.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-objectif",
      objectifs: [1, 4],
      type: "simulation",
      titre: "Poser l'objectif de l'année suivante",
      notions: ["capacity", "dashboard"],
      question: (c) => {
        const n1 = suiviDesObjectifs(c, TAUX_DE_CAPACITE_VISE, "N+1");
        return `Pour l'année N + 1, ${c.entreprise} prévoit ${qte(n1.demandeDeLAnnee)} ${c.unites} de demande, plus que sa ligne ne peut monter au printemps et à Noël. Faites varier la part de la capacité visée, et regardez combien de trimestres tiendraient l'objectif, les ventes ne dépassant jamais la capacité.`;
      },
      leviers: () => [{ code: "taux", libelle: "Part de la capacité visée", unite: "%", ...TAUX_ESSAYES, depart: Math.round(TAUX_DE_CAPACITE_VISE * 100) }],
      lecture: (_c, p) => {
        const o = suiviDesObjectifs(undefined, p.taux! / 100, "N+1");
        const d = suiviDesObjectifs(undefined, TAUX_DE_CAPACITE_VISE, "N+1");
        return [
          { libelle: "Objectif par trimestre", montant: o.objectif, unite: "enceintes", reference: d.objectif },
          { libelle: "Ventes prévues du trimestre le plus faible", montant: Math.min(...o.trimestres.map((x) => x.ventes)), unite: "enceintes" },
          { libelle: "Trimestres qui tiendraient l'objectif", montant: o.tenus, unite: "trimestres", reference: d.tenus, fort: true },
        ];
      },
      defi: () => {
        const juste = tauxTenuChaqueTrimestre(FICHE_DE_CAPACITE, "N+1", TAUX_ESSAYES.pas);
        return {
          consigne: "Trouvez l'objectif le plus ambitieux, de 5 en 5 points, que chaque trimestre de N + 1 tiendrait.",
          atteint: (p) => p.taux === juste,
          indice: (p) => {
            const o = suiviDesObjectifs(undefined, p.taux! / 100, "N+1");
            return o.tenus < o.trimestres.length
              ? `À ${qte(p.taux!)} %, ${qte(o.trimestres.length - o.tenus)} trimestre${o.trimestres.length - o.tenus > 1 ? "s" : ""} sur ${qte(o.trimestres.length)} le manquerai${o.trimestres.length - o.tenus > 1 ? "ent" : "t"} : c'est trop ambitieux.`
              : `À ${qte(p.taux!)} %, chaque trimestre le tiendrait : pouvez-vous viser plus haut ?`;
          },
          solution: { taux: juste },
        };
      },
      explication: (c, p) => {
        const o = suiviDesObjectifs(c, p.taux! / 100, "N+1");
        return [
          `Défi relevé : à ${qte(p.taux!)} % de la capacité, l'objectif de ${qte(o.objectif)} ${c.unites} par trimestre est tenu chaque trimestre de N + 1, même le plus calme, avec ${qte(o.pire.ventes)} ${c.unites} prévues.`,
          `Au-delà, c'est le trimestre le plus calme qui manquerait l'objectif ; au printemps et à Noël, c'est la ligne qui bornerait les ventes, à ${qte(o.capacite)} ${c.unites}. Un objectif se pose sur la demande prévue et sur les moyens, pas sur l'envie.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["dashboard"],
      texte: (c) => {
        const o = suiviDesObjectifs(c);
        return [
          `Chez ${c.entreprise}, l'objectif de ${qte(o.objectif)} ${c.unites} par trimestre est réalisé à ${pct(o.realisation)} sur l'année : ${CONCLUSIONS[o.verdict]}.`,
          "Un écart ne se lit pas seul : il faut savoir d'où il vient. Si la demande manquait, c'est l'objectif qui était mal posé ; si les clients étaient là, ce sont les moyens de l'atteindre qu'il faut revoir.",
        ];
      },
      repere: () => "Écart = réalisé − objectif. Taux de réalisation = réalisé ÷ objectif × 100.",
    },
  ],
};
