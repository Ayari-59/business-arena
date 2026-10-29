import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  ENTREPRISES_DE_LA_PRODUCTION_DE_NOVA,
  POURQUOI_LA_PRODUCTION_DE_NOVA,
  capaciteDUnPoste,
  embaucheDuPremierJanvier,
  enceintesParOperateur,
  ficheDeNova,
  heuresParTrimestre,
  trimestreAvecDesRessources,
  trimestreDeN,
} from "../monde/production-et-logistique";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : ORGANISER L'ACTIVITÉ, CAPACITÉ, ÉQUIPE ET DÉLAIS (Seconde, option management et
 * gestion, palier 1).
 *
 * Combien NOVA peut monter d'enceintes en un trimestre, et ce qui la limite. Deux capacités : celle
 * des postes de la ligne (ce que chacun monte, additionné), celle de l'équipe (les heures de tous les
 * opérateurs ÷ le temps d'une enceinte). La capacité de l'entreprise est la plus petite. L'élève les
 * calcule au 1er trimestre de l'année N (monde/production-et-logistique.ts, qui relit
 * nova-capacite.ts), lit la demande (4 778 enceintes), calcule le taux d'occupation de la ligne, dit
 * ce qui a limité les ventes (les clients), puis le délai d'un renfort : un opérateur recruté le
 * 1er janvier n'arrive que le 1er mars.
 *
 * L'EXPÉRIENCE. Un curseur : la plus grande commande que NOVA pourrait accepter en plus au 1er
 * trimestre (2 222 enceintes). Un laboratoire : les postes et les opérateurs qui servent toute la
 * demande de Noël de N + 1 (7 800), avec le moins de ressources ajoutées (5 et 5).
 *
 * « Produire » (bac STMG) suit l'année entière et la productivité ; ici, un trimestre et ses
 * ressources. CE QUI A CHANGÉ : le chapitre se jouait dans sept entreprises de l'arène ; il se joue
 * chez NOVA seule.
 */

/** Les entreprises du chapitre : NOVA seule. */
export const ENTREPRISES_DE_L_ORGANISATION: readonly string[] = ENTREPRISES_DE_LA_PRODUCTION_DE_NOVA;

/** Le trimestre du chapitre (le 1er de N) et celui du laboratoire (le 4e de N + 1, Noël). */
export const TRIMESTRE_DU_CHAPITRE = 1;
export const TRIMESTRE_DU_LABORATOIRE = 4;

/** Les bornes du curseur (la commande en plus) et du laboratoire (les postes, les opérateurs). */
const COMMANDE_DU_CURSEUR = { min: 0, max: 4_000 } as const;
const POSTES_DU_LABORATOIRE = { min: 4, max: 6, pas: 1 } as const;
const OPERATEURS_DU_LABORATOIRE = { min: 3, max: 6, pas: 1 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(Math.round(t * 10) / 10).toLocaleString("fr-FR")} %`;

const f = (c: Pick<Cas, "code">) => ficheDeNova(c);

/** Le trimestre du chapitre : les capacités, la demande, l'occupation, ce qui a limité. */
export const activiteDuTrimestre = (c: Pick<Cas, "code">) => trimestreDeN(f(c), TRIMESTRE_DU_CHAPITRE);

/** Le renfort du laboratoire : la position des leviers qui sert Noël avec le moins de ressources ajoutées. */
export function renfortDuLaboratoire(c: Pick<Cas, "code">) {
  const positions: ReturnType<typeof trimestreAvecDesRessources>[] = [];
  for (let p = POSTES_DU_LABORATOIRE.min; p <= POSTES_DU_LABORATOIRE.max; p++)
    for (let o = OPERATEURS_DU_LABORATOIRE.min; o <= OPERATEURS_DU_LABORATOIRE.max; o++) positions.push(trimestreAvecDesRessources(f(c), p, o, TRIMESTRE_DU_LABORATOIRE));
  const servies = positions.filter((x) => x.refusees === 0);
  const moins = Math.min(...servies.map((x) => x.postes + x.operateurs));
  return { moins, solution: servies.find((x) => x.postes + x.operateurs === moins)! };
}

function tableauDuTrimestre(c: Cas): TableauDeDonnees {
  const x = f(c);
  const t = activiteDuTrimestre(c);
  return {
    titre: `${c.entreprise}, le 1er trimestre de l'année N`,
    colonnes: ["Valeur"],
    lignes: [
      { libelle: "Postes de montage", valeurs: [qte(x.ligne.postes)] },
      { libelle: `Ce que monte un poste en un trimestre (${c.unites})`, valeurs: [qte(capaciteDUnPoste(x))] },
      { libelle: "Opérateurs", valeurs: [qte(x.plan.operateurs)] },
      { libelle: "Heures d'un opérateur en un trimestre", valeurs: [qte(heuresParTrimestre(x))] },
      { libelle: `Temps de montage d'une ${c.unite} (heure)`, valeurs: [qte(x.operateurs.heuresParEnceinte)] },
      { libelle: `Demande des clients (${c.unites})`, valeurs: [qte(t.demande)] },
    ],
  };
}

export const ORGANISER_L_ACTIVITE: Chapitre = {
  code: "organiser-l-activite",
  parcours: "seconde-mg",
  palier: 1,
  blocs: ["2de MG · Organiser et décider, des objectifs à la réalisation"],
  titre: "Organiser l'activité : capacité, équipe et délais",
  accroche:
    "Combien l'entreprise peut faire en un trimestre, avec ses postes et son équipe ; ce que ses clients lui ont demandé ; et ce qui l'a limitée. Puis ce qu'il faut ajouter pour faire plus, et le délai pour l'avoir.",
  objectifs: [
    "Calculer la capacité des équipements et celle de l'équipe",
    "Calculer le taux d'occupation de l'outil",
    "Dire ce qui limite l'activité : les clients, l'équipe ou les équipements",
    "Tenir compte du délai d'un renfort",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_L_ORGANISATION, pourquoi: POURQUOI_LA_PRODUCTION_DE_NOVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que l'entreprise peut faire",
      notions: ["capacity"],
      tableau: tableauDuTrimestre,
      texte: (c) => [
        `${c.entreprise} monte des ${c.unites} sur une ligne de postes, avec une équipe d'opérateurs. Chacune de ces deux ressources a sa capacité : ce que les postes peuvent monter en un trimestre, et ce que l'équipe peut monter dans ses heures de travail.`,
        "La capacité de l'entreprise est la plus petite des deux : un poste sans opérateur ne monte rien, un opérateur sans poste non plus.",
        "Le tableau donne les ressources de NOVA au 1er trimestre de l'année N, et ce que ses clients lui ont demandé.",
      ],
      repere: () => "Capacité de l'équipe = opérateurs × heures d'un opérateur ÷ temps d'une unité.",
    },
    {
      id: "les-capacites",
      type: "montants",
      titre: "Les deux capacités",
      notions: ["capacity"],
      tableau: tableauDuTrimestre,
      question: (c) => `Calculez la capacité des postes en un trimestre, celle de l'équipe, puis la capacité de l'entreprise, en ${c.unites}.`,
      champs: (c) => {
        const x = f(c);
        const t = activiteDuTrimestre(c);
        return [
          { libelle: "Capacité des postes", attendu: t.capaciteOutil, calcul: `${qte(x.ligne.postes)} × ${qte(capaciteDUnPoste(x))} = ${qte(t.capaciteOutil)}`, tolerance: 0 },
          {
            libelle: "Capacité de l'équipe",
            attendu: t.capaciteEquipe,
            calcul: `${qte(x.plan.operateurs)} × ${qte(heuresParTrimestre(x))} ÷ ${qte(x.operateurs.heuresParEnceinte)} = ${qte(t.capaciteEquipe)}`,
            tolerance: 0,
          },
          { libelle: "Capacité de l'entreprise", attendu: t.capacite, calcul: `la plus petite de ${qte(t.capaciteOutil)} et ${qte(t.capaciteEquipe)} : ${qte(t.capacite)}`, tolerance: 0 },
        ];
      },
      explication: (c) => {
        const t = activiteDuTrimestre(c);
        return [`L'équipe pourrait monter ${qte(t.capaciteEquipe)} ${c.unites}, mais les postes n'en montent que ${qte(t.capaciteOutil)} : ce sont eux qui fixent la capacité de ${c.entreprise}.`];
      },
    },
    {
      id: "l-occupation",
      type: "montants",
      titre: "Le taux d'occupation",
      notions: ["capacity"],
      tableau: tableauDuTrimestre,
      question: (c) =>
        `Au 1er trimestre de N, ${c.entreprise} a monté et vendu ce que ses clients lui ont demandé. Calculez le taux d'occupation de la ligne (production ÷ capacité des postes × 100, au dixième), puis ce qui restait de capacité libre.`,
      champs: (c) => {
        const t = activiteDuTrimestre(c);
        return [
          { libelle: "Taux d'occupation de la ligne (%)", attendu: Math.round(t.occupation * 10) / 10, calcul: `${qte(t.production)} ÷ ${qte(t.capaciteOutil)} × 100 = ${pct(t.occupation)}`, tolerance: 0.1 },
          { libelle: "Capacité libre", attendu: t.libre, calcul: `${qte(t.capacite)} − ${qte(t.production)} = ${qte(t.libre)}`, tolerance: 0 },
        ];
      },
      explication: (c) => {
        const t = activiteDuTrimestre(c);
        return [`La ligne n'a tourné qu'à ${pct(t.occupation)} : ${qte(t.libre)} ${c.unites} de plus auraient pu être montées avec les mêmes postes et la même équipe.`];
      },
    },
    {
      id: "ce-qui-limite",
      type: "choix",
      titre: "Ce qui a limité l'activité",
      notions: ["capacity", "demand_market_share"],
      question: () => "Au 1er trimestre de N, qu'est-ce qui a limité les ventes ?",
      options: (c) => {
        const t = activiteDuTrimestre(c);
        return [
          {
            texte: "Les clients",
            juste: t.limite === "clients",
            retour: t.limite === "clients" ? `Oui : ils ont demandé ${qte(t.demande)} ${c.unites}, et la ligne pouvait en monter ${qte(t.capacite)}. Pour vendre plus, il fallait d'abord plus de clients.` : "Non : la demande dépassait la capacité.",
          },
          { texte: "Les postes de la ligne", juste: t.limite === "outil", retour: t.limite === "outil" ? "Oui." : `Non : les postes pouvaient monter ${qte(t.capaciteOutil)} ${c.unites}, et la demande n'était que de ${qte(t.demande)}.` },
          { texte: "L'équipe des opérateurs", juste: t.limite === "equipe", retour: t.limite === "equipe" ? "Oui." : `Non : l'équipe pouvait monter ${qte(t.capaciteEquipe)} ${c.unites}, plus que les postes.` },
        ];
      },
    },
    {
      id: "le-delai",
      type: "montants",
      titre: "Le délai d'un renfort",
      notions: ["capacity", "payroll"],
      question: (c) => {
        const e = embaucheDuPremierJanvier(f(c));
        return `Un renfort ne se décide pas la veille : entre l'annonce d'un poste et l'arrivée d'un opérateur, il faut ${qte(e.delai)} mois de recrutement. Pour un opérateur recruté à partir du 1er janvier, calculez les mois où il monte au 1er trimestre, ce qu'il ajoute à l'équipe au 1er trimestre, puis au 2e. Un opérateur monte ${qte(enceintesParOperateur(f(c)) / 3)} ${c.unites} par mois.`;
      },
      champs: (c) => {
        const e = embaucheDuPremierJanvier(f(c));
        return [
          { libelle: "Mois de travail au 1er trimestre", attendu: e.moisAuPremier, calcul: `3 − ${qte(e.delai)} = ${qte(e.moisAuPremier)}`, tolerance: 0 },
          { libelle: "Capacité ajoutée au 1er trimestre", attendu: e.enPlusAuPremier, calcul: `${qte(e.moisAuPremier)} × ${qte(e.enPlusAuDeuxieme / 3)} = ${qte(e.enPlusAuPremier)}`, tolerance: 0 },
          { libelle: "Capacité ajoutée au 2e trimestre", attendu: e.enPlusAuDeuxieme, calcul: `3 × ${qte(e.enPlusAuDeuxieme / 3)} = ${qte(e.enPlusAuDeuxieme)}`, tolerance: 0 },
        ];
      },
      explication: (c) => [
        `Un renfort se décide un trimestre à l'avance : décidé en janvier, il ne compte vraiment qu'au 2e trimestre. Et ici, il ne ferait rien monter de plus : ce sont les postes qui fixent la capacité de ${c.entreprise}.`,
      ],
    },
    {
      id: "la-commande-en-plus",
      type: "curseur",
      titre: "La commande en plus",
      notions: ["capacity"],
      question: (c) => {
        const t = activiteDuTrimestre(c);
        return `Un client propose une commande en plus, à livrer au 1er trimestre de N. Faites varier sa taille : une droite donne la capacité de l'entreprise (${qte(t.capacite)} ${c.unites}), l'autre ce qu'il faudrait monter (${qte(t.demande)} pour les clients, plus la commande). Placez le curseur sur la plus grande commande que la ligne peut monter, puis validez.`;
      },
      grandeur: (c) => ({ libelle: "Commande en plus", unite: c.unites }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: activiteDuTrimestre(c).libre, ...COMMANDE_DU_CURSEUR }),
      zones: ["La ligne peut la monter", "La ligne ne peut pas la monter"],
      rates: () => ({
        dessous: "Cette commande tient dans la ligne, mais une plus grande aussi : cherchez la plus grande.",
        dessus: "Cette commande dépasse ce que la ligne peut monter dans le trimestre.",
      }),
      montrer: "Montrer la commande",
      lecture: (c, q) => {
        const t = activiteDuTrimestre(c);
        return [
          { libelle: "À monter dans le trimestre", montant: t.demande + q, fort: true },
          { libelle: "Capacité de l'entreprise", montant: t.capacite },
          { libelle: "Capacité qui reste", montant: t.capacite - t.demande - q },
        ];
      },
      droites: (c) => {
        const t = activiteDuTrimestre(c);
        return { produit: () => t.capacite, cout: (q) => t.demande + q, libelles: ["Capacité de l'entreprise", "À monter dans le trimestre"] };
      },
      explication: (c) => {
        const t = activiteDuTrimestre(c);
        return [`La ligne pouvait monter ${qte(t.libre)} ${c.unites} de plus : ${qte(t.demande)} + ${qte(t.libre)} = ${qte(t.capacite)}. Au-delà, il aurait fallu un poste de plus, et le décider bien avant.`];
      },
    },
    {
      id: "le-laboratoire-du-renfort",
      type: "simulation",
      titre: "Le laboratoire du renfort",
      notions: ["capacity"],
      question: (c) => {
        const t = trimestreAvecDesRessources(f(c), f(c).ligne.postes, f(c).plan.operateurs, TRIMESTRE_DU_LABORATOIRE);
        return `Au 4e trimestre de N + 1, les clients demanderont ${qte(t.demande)} ${c.unites}. Faites varier les postes de la ligne (${qte(capaciteDUnPoste(f(c)))} ${c.unites} chacun) et les opérateurs (${qte(enceintesParOperateur(f(c)))} chacun), en partant de la ligne d'aujourd'hui. Relevez le défi.`;
      },
      leviers: (c) => [
        { code: "postes", libelle: "Postes de montage", unite: "postes", ...POSTES_DU_LABORATOIRE, depart: f(c).ligne.postes },
        { code: "operateurs", libelle: "Opérateurs", unite: "opérateurs", ...OPERATEURS_DU_LABORATOIRE, depart: f(c).plan.operateurs },
      ],
      lecture: (c, p) => {
        const t = trimestreAvecDesRessources(f(c), p.postes!, p.operateurs!, TRIMESTRE_DU_LABORATOIRE);
        return [
          { libelle: "Capacité des postes", montant: t.outil, unite: c.unites },
          { libelle: "Capacité de l'équipe", montant: t.equipe, unite: c.unites },
          { libelle: "Capacité de l'entreprise", montant: t.capacite, unite: c.unites, fort: true },
          { libelle: "Demande refusée", montant: t.refusees, unite: c.unites },
        ];
      },
      defi: (c) => {
        const r = renfortDuLaboratoire(c);
        return {
          consigne: "Servez toute la demande de Noël en ajoutant le moins de ressources possible.",
          atteint: (p) => trimestreAvecDesRessources(f(c), p.postes!, p.operateurs!, TRIMESTRE_DU_LABORATOIRE).refusees === 0 && p.postes! + p.operateurs! === r.moins,
          indice: (p) => {
            const t = trimestreAvecDesRessources(f(c), p.postes!, p.operateurs!, TRIMESTRE_DU_LABORATOIRE);
            return t.refusees > 0
              ? `Il reste ${qte(t.refusees)} ${c.unites} refusées : quelle ressource bride, les postes (${qte(t.outil)}) ou l'équipe (${qte(t.equipe)}) ?`
              : `Toute la demande est servie, mais avec ${qte(p.postes!)} postes et ${qte(p.operateurs!)} opérateurs : une ressource ne sert-elle à rien ?`;
          },
          solution: { postes: r.solution.postes, operateurs: r.solution.operateurs },
        };
      },
      explication: (c, p) => {
        const t = trimestreAvecDesRessources(f(c), p.postes!, p.operateurs!, TRIMESTRE_DU_LABORATOIRE);
        return [
          `Défi relevé : ${qte(t.postes)} postes et ${qte(t.operateurs)} opérateurs montent ${qte(t.capacite)} ${c.unites}, assez pour Noël. Un poste seul ne suffit pas : il lui faut un opérateur ; un opérateur seul non plus : il lui faut un poste.`,
          `Le poste et l'opérateur se décident tôt : le recrutement prend des mois, et ${eur(f(c).personnel.coutDUnRecrutement)}.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["capacity"],
      texte: (c) => {
        const t = activiteDuTrimestre(c);
        return [
          `Au 1er trimestre de N, ${c.entreprise} pouvait monter ${qte(t.capacite)} ${c.unites}, et ses clients en ont demandé ${qte(t.demande)} : la ligne a tourné à ${pct(t.occupation)}, et ce sont les clients qui ont limité l'activité.`,
          "Organiser l'activité, c'est savoir ce que chaque ressource peut faire, laquelle limite, et décider assez tôt ce qu'il faut ajouter : un renfort arrive toujours avec un délai.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : calculez votre capacité avant de prévoir votre production.",
        ];
      },
      repere: () => "Taux d'occupation = production ÷ capacité × 100.",
    },
  ],
};
