import { soldUnits } from "../../../engine/simulation/runGame";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { scenarioByCode } from "../../scenarios/registry";
import { accord, accordPluriel, pronom } from "../accords";
import { type Cas } from "../cas";
import { anneeJouee } from "../annee-de-l-arene";
import { rejouerAvec } from "../gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../metiers";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : ORGANISER L'ACTIVITÉ, CAPACITÉ, ÉQUIPE ET DÉLAIS (Seconde, option management et
 * gestion, palier 1).
 *
 * Combien l'entreprise peut faire en un trimestre, et ce qui la limite. Deux capacités : celle de
 * ses équipements (ce que chacun fait par trimestre, additionné sur tout le parc) et celle de son
 * équipe (les heures de travail de tous les salariés, divisées par le temps que demande une
 * unité). La capacité de l'entreprise est la plus petite des deux. L'élève la calcule, lit le
 * premier trimestre de l'arène (la production, la demande, les ventes), calcule le taux
 * d'occupation et les ventes manquées, et dit ce qui a limité les ventes : les clients, la
 * production prévue, l'équipe ou les équipements. Puis il cherche ce qu'il faut ajouter pour faire
 * plus, et quand le décider : un équipement acheté ou un salarié embauché n'est là qu'au
 * trimestre suivant.
 *
 * Tout vient de l'arène : le parc et la capacité de chaque type d'équipement (`fleet`,
 * `equipment.types`), l'effectif, les heures d'un salarié et le temps d'une unité
 * (`headcount`, `hoursPerEmployee`, `hoursPerUnit`), le premier trimestre de l'année du cours
 * (`anneeJouee`), et l'année rejouée avec un équipement et une embauche décidés au premier
 * trimestre (`rejouerAvec`), qui montre le délai. « L'équipe et son planning » (BTS MCO) compte
 * les heures et le coût de l'équipe d'un point de vente ; ce chapitre-ci compare l'équipe à
 * l'outil, et dit lequel des deux fixe la capacité.
 */

/**
 * Les entreprises du chapitre : celles qui font un seul produit, et le servent dans le trimestre.
 * La boutique vend une gamme d'articles qui ne demandent pas le même temps de travail, et la
 * salle de sport garde ses adhérents d'un trimestre à l'autre : ce qu'elle sert n'y est pas ce
 * qu'elle vend dans le trimestre.
 */
export const ENTREPRISES_DE_L_ORGANISATION: readonly string[] = ENTREPRISES_DU_COURS.filter((code) => {
  const s = scenarioByCode(code).scenario;
  return !(s.products && s.products.length > 1) && !s.subscription;
});

/**
 * Chez Atlas Conseil, l'arène compte le temps de l'équipe en jours ouvrés : 60 jours par
 * consultant et par trimestre, et un jour-conseil prend un jour (scénario conseil). Ailleurs,
 * elle le compte en heures.
 */
const TEMPS_EN_JOURS: ReadonlySet<string> = new Set(["conseil"]);

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Une durée de travail, dans l'unité de temps de l'entreprise : « 540 h », « 60 jours ». */
const duree = (c: Cas, x: number) => (TEMPS_EN_JOURS.has(c.code) ? `${qte(x)} ${x >= 2 ? "jours" : "jour"}` : `${qte(x)} h`);
/** Ce que la capacité gagne : « gagne 200 enceintes », ou « ne gagne rien ». */
const gagne = (c: Cas, n: number) => (n === 0 ? "ne gagne rien" : `gagne ${qte(n)} ${c.unites}`);
/** Ce qu'un renfort ajoute : « que 200 enceintes », ou « rien ». */
const nAjoute = (c: Cas, n: number) => (n === 0 ? "n'ajouterait rien" : `n'ajouterait que ${qte(n)} ${c.unites}`);

/** Le nom de l'unité de temps, au pluriel : « heures », « jours ». */
const temps = (c: Cas) => (TEMPS_EN_JOURS.has(c.code) ? "jours" : "heures");

export type Limite = "clients" | "prevision" | "equipe" | "outil";

/** Les capacités, le premier trimestre de l'arène, et ce qui a limité ses ventes. */
export function activiteDuTrimestre(c: Cas) {
  const def = scenarioByCode(c.code);
  const s = def.scenario;
  const { partie, depart } = anneeJouee(c.code);
  const types = new Map((s.equipment?.types ?? []).map((t) => [t.code, t]));
  const parParType = new Map<string, { code: string; nom: string; nombre: number; capacite: number }>();
  for (const lot of depart.fleet ?? []) {
    const t = types.get(lot.typeCode)!;
    const deja = parParType.get(lot.typeCode) ?? { code: t.code, nom: t.name, nombre: 0, capacite: t.capacityPerUnit };
    parParType.set(lot.typeCode, { ...deja, nombre: deja.nombre + lot.count });
  }
  const parc = [...parParType.values()];
  const outil = parc.reduce((t, p) => t + p.nombre * p.capacite, 0);
  const effectif = depart.headcount;
  const heuresParSalarie = depart.hoursPerEmployee;
  const heuresParUnite = s.product.hoursPerUnit;
  const equipe = Math.floor((effectif * heuresParSalarie * depart.productivity) / heuresParUnite + 1e-9);
  const capacite = Math.min(outil, equipe);
  const r = partie.rounds[0]!.results["joueur"]!;
  const segments = Object.values(r.market.bySegment);
  const production = Math.round(r.production.produced);
  const ventes = Math.round(soldUnits(r));
  const demande = Math.round(segments.reduce((t, v) => t + v.demandForCompany, 0));
  const stock = s.perishable ? 0 : Math.round(depart.finishedGoods.quantity);
  const manquees = Math.max(0, demande - ventes);
  const limite: Limite = manquees === 0 ? "clients" : demande <= stock + capacite ? "prevision" : outil <= equipe ? "outil" : "equipe";

  // Le renfort : un équipement du premier type du parc, ou un salarié de plus.
  const ajoute = parc[0]!;
  const type = types.get(ajoute.code)!;
  const outilPlus = outil + type.capacityPerUnit;
  const equipePlus = Math.floor(((effectif + 1) * heuresParSalarie * depart.productivity) / heuresParUnite + 1e-9);
  const avecUnEquipement = Math.min(outilPlus, equipe);
  const avecUnSalarie = Math.min(outil, equipePlus);
  const hr = s.hr!;
  return {
    vocabulaire: def.vocabulary,
    perissable: Boolean(s.perishable),
    parc,
    outil,
    effectif,
    heuresParSalarie,
    heuresParUnite,
    equipe,
    capacite,
    production,
    ventes,
    demande,
    stock,
    manquees,
    occupation: auDixieme((production / capacite) * 100),
    limite,
    equipement: { code: type.code, nom: type.name, capacite: type.capacityPerUnit, prix: type.costPerUnit },
    outilPlus,
    equipePlus,
    avecUnEquipement,
    avecUnSalarie,
    gainEquipement: avecUnEquipement - capacite,
    gainSalarie: avecUnSalarie - capacite,
    recrutement: hr.hiringCost,
    salaireParTrimestre: hr.salaryPerEmployeePerRound,
  };
}

/**
 * L'année rejouée avec le renfort décidé au premier trimestre : un équipement du premier type du
 * parc acheté, un salarié embauché. Les capacités des deux premiers trimestres, telles que le
 * moteur les rend.
 */
export function renfortRejoue(c: Cas) {
  const a = activiteDuTrimestre(c);
  const annee = rejouerAvec(c.code, "organiser-l-activite:renfort-au-premier-trimestre", (tour, d) =>
    tour === 1 ? { ...d, investment: { ...(d.investment ?? {}), equipmentBuy: [{ typeCode: a.equipement.code, quantity: 1 }] }, hr: { ...(d.hr ?? {}), hire: 1 } } : undefined,
  );
  const lire = (k: number) => ({
    outil: Math.round(annee[k]!.production.machineCapacity),
    equipe: Math.floor(annee[k]!.production.laborCapacity + 1e-9),
  });
  return { premier: lire(0), deuxieme: lire(1) };
}

const LIBELLES_DES_LIMITES: Record<Limite, string> = {
  clients: "Les clients : l'entreprise a servi toute la demande",
  prevision: "La production prévue : trop basse, alors que la capacité suffisait",
  equipe: "L'équipe : elle fixe la capacité, et la demande la dépassait",
  outil: "Les équipements : ils fixent la capacité, et la demande la dépassait",
};

export const ORGANISER_L_ACTIVITE: Chapitre = {
  code: "organiser-l-activite",
  parcours: "seconde-mg",
  palier: 1,
  blocs: ["2de MG · Organiser et décider, des objectifs à la réalisation"],
  titre: "Organiser l'activité : capacité, équipe et délais",
  accroche:
    "Combien l'entreprise peut faire en un trimestre, avec ses équipements et son équipe ; ce qu'elle a vraiment fait ; et ce qui l'a limitée. Puis ce qu'il faut ajouter pour faire plus, et quand le décider.",
  objectifs: [
    "Calculer la capacité des équipements et celle de l'équipe",
    "Dire laquelle des deux fixe la capacité de l'entreprise",
    "Calculer un taux d'occupation et des ventes manquées",
    "Dire ce qui limite l'activité : les clients, la prévision, l'équipe ou l'outil",
    "Tenir compte du délai d'un équipement ou d'une embauche",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_ORGANISATION,
    pourquoi:
      "ce chapitre compte ce qu'une équipe et ses équipements font d'un seul produit en un trimestre : la boutique vend une gamme d'articles qui ne demandent pas le même temps de travail, et la salle de sport garde ses adhérents d'un trimestre à l'autre.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que l'entreprise peut faire",
      notions: ["capacity", "productivity"],
      texte: (c) => {
        const a = activiteDuTrimestre(c);
        return [
          `Chaque trimestre, ${c.entreprise} ne peut pas faire autant ${dE(c.unites)} qu'elle le voudrait. Deux choses fixent sa capacité, c'est-à-dire le plus qu'elle peut faire : ses équipements, et le travail de son équipe.`,
          `Chaque équipement fait un certain nombre ${dE(c.unites)} par trimestre (voir le tableau). L'équipe compte ${qte(a.effectif)} salariés, qui donnent chacun ${duree(c, a.heuresParSalarie)} de travail par trimestre ; ${accord(c, "un")} ${c.unite} demande ${duree(c, a.heuresParUnite)} de travail.`,
          "La capacité de l'entreprise est la plus petite des deux : un équipement sans personne pour le faire tourner ne fait rien, une équipe sans équipement non plus.",
        ];
      },
      tableau: (c) => {
        const a = activiteDuTrimestre(c);
        return {
          titre: `Les moyens ${dE(c.entreprise)} au premier trimestre`,
          colonnes: ["Nombre", "Ce que chacun fait par trimestre"],
          lignes: [
            ...a.parc.map((p) => ({ libelle: p.nom, valeurs: [qte(p.nombre), `${qte(p.capacite)} ${c.unites}`] })),
            { libelle: "Salariés", valeurs: [qte(a.effectif), `${duree(c, a.heuresParSalarie)} de travail`] },
          ],
        };
      },
      repere: () => "Capacité de l'entreprise = la plus petite des deux : celle des équipements, celle de l'équipe.",
    },
    {
      id: "capacites",
      type: "montants",
      titre: "Deux capacités, une seule compte",
      notions: ["capacity", "productivity"],
      question: (c) =>
        `Calculez la capacité des équipements (ce que tout le parc fait en un trimestre), puis celle de l'équipe (les ${temps(c)} de travail de tous les salariés ÷ les ${temps(c)} que demande ${accord(c, "un")} ${c.unite}, arrondi à l'unité inférieure), et enfin la capacité de l'entreprise, en ${c.unites} par trimestre.`,
      champs: (c) => {
        const a = activiteDuTrimestre(c);
        return [
          { libelle: "Capacité des équipements", attendu: a.outil, calcul: `${a.parc.map((p) => `${qte(p.nombre)} × ${qte(p.capacite)}`).join(" + ")} = ${qte(a.outil)}` },
          { libelle: "Capacité de l'équipe", attendu: a.equipe, calcul: `${qte(a.effectif)} × ${duree(c, a.heuresParSalarie)} ÷ ${duree(c, a.heuresParUnite)} = ${qte(a.equipe)}`, tolerance: 1 },
          { libelle: "Capacité de l'entreprise", attendu: a.capacite, calcul: `la plus petite des deux : ${qte(a.capacite)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const a = activiteDuTrimestre(c);
        return [
          a.outil <= a.equipe
            ? `Ce sont les équipements qui fixent la capacité : ${qte(a.capacite)} ${c.unites} par trimestre. L'équipe pourrait en faire ${qte(a.equipe - a.outil)} de plus, si elle avait de quoi.`
            : `C'est l'équipe qui fixe la capacité : ${qte(a.capacite)} ${c.unites} par trimestre. Les équipements pourraient en faire ${qte(a.outil - a.equipe)} de plus, avec assez de monde pour les faire tourner.`,
        ];
      },
    },
    {
      id: "premier-trimestre",
      type: "montants",
      titre: "Le premier trimestre",
      notions: ["capacity"],
      tableau: (c) => {
        const a = activiteDuTrimestre(c);
        return {
          titre: `Le premier trimestre ${dE(c.entreprise)} dans l'arène`,
          colonnes: [c.unites.charAt(0).toUpperCase() + c.unites.slice(1)],
          lignes: [
            { libelle: "Capacité de l'entreprise", valeurs: [qte(a.capacite)] },
            ...(a.stock > 0 ? [{ libelle: "Stock de départ", valeurs: [qte(a.stock)] }] : []),
            { libelle: "Production du trimestre", valeurs: [qte(a.production)] },
            { libelle: "Demande des clients", valeurs: [qte(a.demande)] },
            { libelle: "Ventes", valeurs: [qte(a.ventes)] },
          ],
        };
      },
      question: (c) =>
        `La production du trimestre, c'est ce que l'entreprise a prévu sur sa feuille de décision (« ${activiteDuTrimestre(c).vocabulaire.productionPlanLabel} »). Calculez le taux d'occupation (production ÷ capacité de l'entreprise × 100, au dixième), puis les ventes manquées (demande des clients − ventes), en ${c.unites}.`,
      champs: (c) => {
        const a = activiteDuTrimestre(c);
        return [
          { libelle: "Taux d'occupation (%)", attendu: a.occupation, calcul: `${qte(a.production)} ÷ ${qte(a.capacite)} × 100 = ${pct(a.occupation)}`, tolerance: 0.1 },
          { libelle: "Ventes manquées", attendu: a.manquees, calcul: `${qte(a.demande)} − ${qte(a.ventes)} = ${qte(a.manquees)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const a = activiteDuTrimestre(c);
        const reste = a.stock + a.production - a.ventes;
        const surLaProduction = a.perissable
          ? reste > 0
            ? `${qte(reste)} ${c.unites} ${accordPluriel(c, "préparé")} n'ont pas été ${accordPluriel(c, "vendu")} : ${pronom(c)}s ne se gardent pas, ${pronom(c)}s sont ${accordPluriel(c, "perdu")}.`
            : `Tout ce qui a été préparé a été vendu.`
          : a.ventes > a.production
            ? `L'entreprise a vendu plus qu'elle n'a produit, en puisant dans son stock de départ.`
            : reste > 0
              ? `Ce qui n'a pas été vendu, ${qte(reste)} ${c.unites}, reste en stock pour le trimestre suivant.`
              : "Tout ce qui a été produit a été vendu.";
        return [
          `L'entreprise a utilisé ${pct(a.occupation)} de sa capacité. ${surLaProduction}`,
          a.manquees > 0
            ? `${qte(a.manquees)} ${c.unites} ${accordPluriel(c, "demandé")} par des clients n'ont pas été ${accordPluriel(c, "servi")} : ce sont des ventes perdues.`
            : "Aucun client n'est reparti sans être servi.",
        ];
      },
    },
    {
      id: "ce-qui-limite",
      type: "choix",
      titre: "Ce qui a limité les ventes",
      notions: ["capacity"],
      question: (c) => {
        const a = activiteDuTrimestre(c);
        return `Au premier trimestre, ${c.entreprise} a vendu ${qte(a.ventes)} ${c.unites} pour une demande de ${qte(a.demande)}, avec une capacité de ${qte(a.capacite)}${a.stock > 0 ? ` et un stock de départ de ${qte(a.stock)}` : ""}. Qu'est-ce qui a limité ses ventes ?`;
      },
      options: (c) => {
        const a = activiteDuTrimestre(c);
        const disponible = a.stock + a.capacite;
        const retours: Record<Limite, string> = {
          clients:
            a.limite === "clients"
              ? `Oui : tous les clients ont été servis, et il restait de la capacité (${pct(a.occupation)} d'occupation). Pour vendre plus, il faut d'abord plus de clients : le prix, la qualité, la publicité.`
              : `Non : ${qte(a.manquees)} ${c.unites} ${accordPluriel(c, "demandé")} n'ont pas été ${accordPluriel(c, "servi")}.`,
          prevision:
            a.limite === "prevision"
              ? `Oui : à pleine capacité, l'entreprise disposait de ${qte(disponible)} ${c.unites}, assez pour la demande de ${qte(a.demande)}. Elle n'a produit que ${qte(a.production)} : c'est la prévision qui a manqué, pas les moyens.`
              : a.limite === "clients"
                ? "Non : la production prévue n'était pas trop basse, puisque tous les clients ont été servis."
                : `Non : même à pleine capacité, l'entreprise ne disposait que de ${qte(disponible)} ${c.unites}, pour une demande de ${qte(a.demande)}.`,
          equipe:
            a.limite === "equipe"
              ? `Oui : l'équipe ne peut faire que ${qte(a.equipe)} ${c.unites} par trimestre, moins que les équipements (${qte(a.outil)}), et la demande était de ${qte(a.demande)}. Même avec une production parfaitement prévue, des clients seraient repartis.`
              : a.outil <= a.equipe
                ? `Non : l'équipe pourrait faire ${qte(a.equipe)} ${c.unites}, plus que les équipements (${qte(a.outil)}). Ce n'est pas elle qui fixe la capacité.`
                : "Non : l'équipe fixe bien la capacité, mais elle suffisait à la demande.",
          outil:
            a.limite === "outil"
              ? `Oui : les équipements ne peuvent faire que ${qte(a.outil)} ${c.unites} par trimestre, moins que l'équipe (${qte(a.equipe)}), et la demande était de ${qte(a.demande)}. Même avec une production parfaitement prévue, des clients seraient repartis.`
              : a.outil > a.equipe
                ? `Non : les équipements pourraient faire ${qte(a.outil)} ${c.unites}, plus que l'équipe (${qte(a.equipe)}). Ce ne sont pas eux qui fixent la capacité.`
                : "Non : les équipements fixent bien la capacité, mais ils suffisaient à la demande.",
        };
        return (["clients", "prevision", "equipe", "outil"] as const).map((l) => ({ texte: LIBELLES_DES_LIMITES[l], juste: l === a.limite, retour: retours[l] }));
      },
    },
    {
      id: "renfort",
      type: "montants",
      titre: "Un équipement ou un salarié de plus",
      notions: ["capacity", "productivity"],
      question: (c) => {
        const a = activiteDuTrimestre(c);
        return `La direction veut pouvoir faire plus. Calculez la capacité de l'entreprise avec un équipement « ${a.equipement.nom} » de plus (${qte(a.equipement.capacite)} ${c.unites} par trimestre), puis avec un salarié de plus (${duree(c, a.heuresParSalarie)} de travail par trimestre), tout le reste identique.`;
      },
      champs: (c) => {
        const a = activiteDuTrimestre(c);
        return [
          {
            libelle: "Capacité avec un équipement de plus",
            attendu: a.avecUnEquipement,
            calcul: `équipements : ${qte(a.outil)} + ${qte(a.equipement.capacite)} = ${qte(a.outilPlus)} ; équipe : ${qte(a.equipe)} ; la plus petite : ${qte(a.avecUnEquipement)}`,
            tolerance: 1,
          },
          {
            libelle: "Capacité avec un salarié de plus",
            attendu: a.avecUnSalarie,
            calcul: `équipe : ${qte(a.effectif + 1)} × ${duree(c, a.heuresParSalarie)} ÷ ${duree(c, a.heuresParUnite)} = ${qte(a.equipePlus)} ; équipements : ${qte(a.outil)} ; la plus petite : ${qte(a.avecUnSalarie)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const a = activiteDuTrimestre(c);
        return [
          `Avec un équipement de plus, la capacité ${gagne(c, a.gainEquipement)} ; avec un salarié de plus, elle ${gagne(c, a.gainSalarie)}. Ajouter ce qui ne limite pas ne sert à rien : c'est l'autre qui bloque.`,
        ];
      },
    },
    {
      id: "quoi-ajouter",
      type: "choix",
      titre: "Ce qu'il faut ajouter",
      notions: ["capacity"],
      question: (c) => {
        const a = activiteDuTrimestre(c);
        return `Avec un équipement de plus, la capacité ${dE(c.entreprise)} ${gagne(c, a.gainEquipement)} ; avec un salarié de plus, elle ${gagne(c, a.gainSalarie)}. Que faut-il ajouter pour pouvoir faire plus ?`;
      },
      options: (c) => {
        const a = activiteDuTrimestre(c);
        const couts = `L'équipement coûte ${eur(a.equipement.prix)}, une fois ; le salarié, ${eur(a.recrutement)} de recrutement puis ${eur(a.salaireParTrimestre)} chaque trimestre.`;
        const plafond =
          a.gainEquipement > 0 && a.gainEquipement < a.equipement.capacite
            ? ` Au-delà de ${qte(a.avecUnEquipement)}, c'est l'équipe qui bloque : pour aller plus loin, il faudrait aussi un salarié.`
            : a.gainSalarie > 0 && a.equipePlus > a.outil
              ? ` Au-delà de ${qte(a.avecUnSalarie)}, ce sont les équipements qui bloquent : pour aller plus loin, il faudrait aussi un équipement.`
              : "";
        return [
          {
            texte: "Un équipement : ce sont les équipements qui fixent la capacité",
            juste: a.gainEquipement > a.gainSalarie,
            retour:
              a.gainEquipement > a.gainSalarie
                ? `Oui : ${qte(a.gainEquipement)} ${c.unites} de plus par trimestre, quand un salarié ${a.gainSalarie === 0 ? "n'ajouterait rien" : `n'en ajouterait que ${qte(a.gainSalarie)}`}.${plafond} ${couts}`
                : `Non : un équipement ${nAjoute(c, a.gainEquipement)}, car l'équipe ne pourrait pas le faire tourner. ${couts}`,
          },
          {
            texte: "Un salarié : c'est l'équipe qui fixe la capacité",
            juste: a.gainSalarie > a.gainEquipement,
            retour:
              a.gainSalarie > a.gainEquipement
                ? `Oui : ${qte(a.gainSalarie)} ${c.unites} de plus par trimestre, quand un équipement ${a.gainEquipement === 0 ? "n'ajouterait rien" : `n'en ajouterait que ${qte(a.gainEquipement)}`}.${plafond} ${couts}`
                : `Non : un salarié ${nAjoute(c, a.gainSalarie)}, faute d'équipement pour travailler. ${couts}`,
          },
          {
            texte: "N'importe lequel : chacun ajoute toute sa propre capacité",
            juste: false,
            retour: "Non : la capacité est la plus petite des deux. Ajouter à celle qui est déjà la plus grande ne change presque rien, et parfois rien du tout.",
          },
        ];
      },
    },
    {
      id: "delais",
      type: "choix",
      titre: "Décider à temps",
      notions: ["capacity"],
      question: (c) => {
        const a = activiteDuTrimestre(c);
        return `La direction décide, au premier trimestre, d'acheter un équipement « ${a.equipement.nom} » et d'embaucher un salarié. À partir de quand la capacité ${dE(c.entreprise)} augmente-t-elle ?`;
      },
      options: (c) => {
        const r = renfortRejoue(c);
        const arene = `Dans l'arène rejouée, la capacité des équipements reste à ${qte(r.premier.outil)} au premier trimestre et passe à ${qte(r.deuxieme.outil)} au deuxième ; celle de l'équipe passe de ${qte(r.premier.equipe)} à ${qte(r.deuxieme.equipe)}.`;
        return [
          {
            texte: "Dès le premier trimestre, le jour même de la décision",
            juste: false,
            retour: `Non : un équipement se livre et s'installe, un salarié se recrute. ${arene}`,
          },
          {
            texte: "Au deuxième trimestre : il faut le temps d'installer et de recruter",
            juste: true,
            retour: `Oui. ${arene} Pour servir les clients d'un trimestre chargé, il faut décider au moins un trimestre avant.`,
          },
          {
            texte: "À la fin de l'année, une fois l'équipement payé",
            juste: false,
            retour: `Non : l'équipement se paie à l'achat, et il travaille dès qu'il est installé. ${arene}`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["capacity"],
      texte: (c) => {
        const a = activiteDuTrimestre(c);
        const pourquoi: Record<Limite, string> = {
          clients: "Ce sont les clients qui ont manqué, pas les moyens.",
          prevision: "La capacité suffisait : c'est la production prévue qui a manqué.",
          equipe: "C'est l'équipe qui a limité les ventes.",
          outil: "Ce sont les équipements qui ont limité les ventes.",
        };
        return [
          `Au premier trimestre, ${c.entreprise} pouvait faire ${qte(a.capacite)} ${c.unites} et en a produit ${qte(a.production)} : ${pct(a.occupation)} de sa capacité. ${pourquoi[a.limite]}`,
          "Organiser l'activité, c'est faire correspondre trois choses : ce que les clients demandent, ce que les équipements et l'équipe peuvent faire, et ce que l'on prévoit de produire. C'est aussi décider à temps : un équipement ou un salarié de plus n'arrive qu'au trimestre suivant.",
        ];
      },
      repere: () => "Taux d'occupation = production ÷ capacité × 100. Ventes manquées = demande − ventes.",
    },
  ],
};
