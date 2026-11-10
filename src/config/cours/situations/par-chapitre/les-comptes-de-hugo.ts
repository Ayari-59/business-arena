import { eur, nombreAuCentieme } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_SECTEUR, secteurDuCabinet } from "../../chapitres/organiser-le-secteur";
import { FREQUENCE_DE_VISITE, VISITE_A_DISTANCE, chargeDeVisites, classesDuCommercial } from "../../monde/terrain-d-atlas";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « ORGANISER LE SECTEUR : VISITES, TEMPS ET TOURNÉES » : LES COMPTES DE HUGO
 * (BTS NDRC, palier 4).
 *
 * Le directeur commercial veut confier à Nadia, la commerciale des entreprises, les 5 comptes que Hugo a
 * gagnés en N : « la conquête conquiert, les entreprises suivent ». Ce sont 5 comptes de classe B, vus tous
 * les deux mois. L'élève refait seul le chemin du chapitre : la charge de Nadia avec ces comptes, ce qui
 * lui reste pour ses 60 prospects, même ses comptes C passés à distance, puis la charge de Hugo s'il les
 * garde. La réponse demande un jugement : Hugo garde ses comptes une année de plus.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours : ses visites et ses capacités sont celles
 * de `secteurDuCabinet` et de `chargeDeVisites`, sur la fiche du cabinet. Il ne lit du cas que son code.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les visites et les prospects sont des quantités, entières,
 * déclarées comme telles.
 */

const qte = nombreAuCentieme;

/** Les comptes repris, et ce qu'ils font à la charge de chacun. */
export function comptesDeHugo(c: Pick<Cas, "code">) {
  const x = secteurDuCabinet(c);
  const hugo = x.f.commerciaux.find((k) => k.code === "conquete")!;
  const repris = classesDuCommercial(x.f, "conquete");
  const comptes = repris.comptes;
  const visitesEnPlus = repris.A.length * FREQUENCE_DE_VISITE.A + repris.B.length * FREQUENCE_DE_VISITE.B + repris.C.length * FREQUENCE_DE_VISITE.C;
  const avec = chargeDeVisites(x.f, "entreprises", { visitesEnPlus });
  const avecDistance = chargeDeVisites(x.f, "entreprises", { visitesEnPlus, partDesCADistance: 1 });
  const chezHugo = chargeDeVisites(x.f, "conquete");
  return { x, hugo, comptes, classes: repris, visitesEnPlus, avec, avecDistance, chezHugo, manque: x.prospects - avecDistance.reste };
}

/** Les comptes gagnés par Hugo : le document du cas. */
function tableauDesComptes(c: Pick<Cas, "code">): TableauDeDonnees {
  const r = comptesDeHugo(c);
  return {
    titre: `Les comptes gagnés en N par ${r.hugo.prenom}`,
    colonnes: ["Classe", "Chiffre d'affaires", "Marge du compte"],
    lignes: r.comptes.map((k) => ({ libelle: k.nom, valeurs: [k.classe, eur(k.chiffreDAffaires), eur(k.marge)] })),
  };
}

export const LES_COMPTES_DE_HUGO: Situation = {
  code: "les-comptes-de-hugo",
  parcours: "ndrc",
  palier: 4,
  blocs: [],
  reprend: ["organiser-le-secteur"],
  commanditaire: "Le directeur commercial",
  titre: "Les comptes de Hugo",
  accroche:
    "Le directeur veut confier à Nadia les comptes que Hugo a gagnés. Compter ce qu'ils ajoutent à sa charge, ce qui lui reste pour ses prospects, ce qu'ils pèsent chez Hugo, puis répondre.",
  objectifs: [
    "Mesurer la charge de visites qu'ajoutent des comptes repris",
    "Calculer ce qui reste pour la prospection, avec ou sans visites à distance",
    "Comparer la charge de Nadia et celle de Hugo",
    "Rédiger une réponse chiffrée au directeur commercial",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_SECTEUR,
    pourquoi: "ce cas reprend le chapitre « Organiser le secteur : visites, temps et tournées », qui compte les visites des commerciaux d'ATLAS CONSEIL, le cabinet de la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du directeur commercial",
      tableau: tableauDesComptes,
      texte: (c) => {
        const r = comptesDeHugo(c);
        return [
          `« ${r.hugo.prenom} a gagné ${qte(r.comptes.length)} comptes en N. Son métier est la conquête : je veux qu'il les passe à ${r.x.nadia.prenom}, qui suit les entreprises. Elle a de la place, non ? »`,
          `Pas de cours cette fois : vous avez les comptes de ${r.hugo.prenom}, la règle de visite du cabinet (un compte B tous les 2 mois), la capacité de ${r.x.nadia.prenom} (${qte(r.x.j.capacite)} visites) et ses ${qte(r.x.prospects)} prospects à voir. La méthode est celle du chapitre.`,
        ];
      },
      repere: () => "À rendre : la charge de Nadia avec ces comptes, ce qui lui reste pour ses prospects, la charge de Hugo s'il les garde, et votre réponse.",
    },
    {
      id: "la-charge-de-nadia",
      type: "montants",
      titre: "La charge de Nadia avec ces comptes",
      notions: ["capacity", "customer_portfolio"],
      question: (c) => {
        const r = comptesDeHugo(c);
        return `Calculez les visites de suivi que demandent les comptes de ${r.hugo.prenom}, la charge de ${r.x.nadia.prenom} avec eux, puis les visites qui lui restent pour ses prospects (négatif s'il en manque).`;
      },
      champs: (c) => {
        const r = comptesDeHugo(c);
        return [
          { libelle: "Visites de suivi des comptes repris", nature: "quantite", attendu: r.visitesEnPlus, calcul: `${qte(r.comptes.length)} × ${qte(FREQUENCE_DE_VISITE.B)} = ${qte(r.visitesEnPlus)} visites` },
          { libelle: "Charge de Nadia avec ces comptes", nature: "quantite", attendu: r.avec.charge, calcul: `${qte(r.x.v.charge)} + ${qte(r.visitesEnPlus)} = ${qte(r.avec.charge)} visites` },
          { libelle: "Visites qui restent pour les prospects", nature: "quantite", attendu: r.avec.reste, calcul: `${qte(r.avec.capacite)} − ${qte(r.avec.charge)} = ${qte(r.avec.reste)} visites` },
        ];
      },
      explication: (c) => {
        const r = comptesDeHugo(c);
        return [`Avec ces comptes, ${r.x.nadia.prenom} dépasse sa capacité de ${qte(-r.avec.reste)} visites : elle n'a plus aucune place pour ses ${qte(r.x.prospects)} prospects.`];
      },
    },
    {
      id: "avec-les-c-a-distance",
      type: "montants",
      titre: "Même avec les comptes C à distance",
      notions: ["capacity", "productivity"],
      question: (c) => {
        const r = comptesDeHugo(c);
        return `${r.x.nadia.prenom} passe toutes les visites de ses comptes C à distance, au quart du temps. Calculez la charge qui lui reste, les visites pour ses prospects, puis les prospects qu'elle ne pourrait pas voir.`;
      },
      champs: (c) => {
        const r = comptesDeHugo(c);
        const libere = r.avec.charge - r.avecDistance.charge;
        return [
          { libelle: "Charge avec les comptes C à distance", nature: "quantite", attendu: r.avecDistance.charge, calcul: `${qte(r.avec.charge)} − ${qte(r.x.v.visitesC)} × ${qte((1 - VISITE_A_DISTANCE.partDuTemps) * 100)} % = ${qte(r.avec.charge)} − ${qte(libere)} = ${qte(r.avecDistance.charge)} visites` },
          { libelle: "Visites pour les prospects", nature: "quantite", attendu: r.avecDistance.reste, calcul: `${qte(r.avecDistance.capacite)} − ${qte(r.avecDistance.charge)} = ${qte(r.avecDistance.reste)} visites` },
          { libelle: "Prospects qu'elle ne verrait pas", nature: "quantite", attendu: r.manque, calcul: `${qte(r.x.prospects)} − ${qte(r.avecDistance.reste)} = ${qte(r.manque)} prospects` },
        ];
      },
      explication: (c) => {
        const r = comptesDeHugo(c);
        return [`La visite à distance rend ${qte(r.avec.charge - r.avecDistance.charge)} visites, mais les comptes repris en prennent ${qte(r.visitesEnPlus)} : il manque encore ${qte(r.manque)} prospects à l'objectif.`];
      },
    },
    {
      id: "la-charge-de-hugo",
      type: "montants",
      titre: "La charge de Hugo s'il les garde",
      notions: ["capacity", "productivity"],
      question: (c) => {
        const r = comptesDeHugo(c);
        return `${r.hugo.prenom} a le même calendrier, et ${qte(r.chezHugo.rendezVousDAffaires)} rendez-vous d'affaires en N. S'il garde ses comptes, calculez ses visites de suivi, sa charge, puis les visites qui lui restent.`;
      },
      champs: (c) => {
        const r = comptesDeHugo(c);
        const h = r.chezHugo;
        return [
          { libelle: "Visites de suivi de Hugo", nature: "quantite", attendu: h.suivi, calcul: `${qte(r.comptes.length)} × ${qte(FREQUENCE_DE_VISITE.B)} = ${qte(h.suivi)} visites` },
          { libelle: "Charge de Hugo", nature: "quantite", attendu: h.charge, calcul: `${qte(h.suivi)} + ${qte(h.rendezVousDAffaires)} = ${qte(h.charge)} visites` },
          { libelle: "Visites qui restent à Hugo", nature: "quantite", attendu: h.reste, calcul: `${qte(h.capacite)} − ${qte(h.charge)} = ${qte(h.reste)} visites` },
        ];
      },
      explication: (c) => {
        const r = comptesDeHugo(c);
        return [`Chez ${r.hugo.prenom}, les ${qte(r.visitesEnPlus)} visites de suivi tiennent largement : il lui reste ${qte(r.chezHugo.reste)} visites pour sa conquête.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur commercial",
      question: () => "Quelle phrase envoyez-vous au directeur commercial ?",
      options: (c) => {
        const r = comptesDeHugo(c);
        return [
          {
            texte: `Hugo les garde un an : ${r.x.nadia.prenom} perdrait ${qte(r.manque)} prospects`,
            juste: true,
            retour: `Oui : même avec ses comptes C à distance, ${r.x.nadia.prenom} n'aurait que ${qte(r.avecDistance.reste)} visites pour ${qte(r.x.prospects)} prospects. Chez ${r.hugo.prenom}, il resterait ${qte(r.chezHugo.reste)} visites. Le compte passera chez elle quand il aura grandi, et un commercial qui a gagné un compte le connaît mieux la première année.`,
          },
          {
            texte: `${r.x.nadia.prenom} les prend : il lui reste ${qte(r.x.v.reste)} visites libres aujourd'hui`,
            juste: false,
            retour: `Non : ${qte(r.x.v.reste)} visites, c'est avant les comptes repris, qui en demandent ${qte(r.visitesEnPlus)}. Elle dépasserait sa capacité de ${qte(-r.avec.reste)} visites.`,
          },
          {
            texte: `${r.x.nadia.prenom} les prend, en passant ses comptes C à distance`,
            juste: false,
            retour: `Non : elle n'aurait que ${qte(r.avecDistance.reste)} visites pour ses prospects, ${qte(r.manque)} de moins que l'objectif.`,
          },
          {
            texte: `${r.x.nadia.prenom} les prend, et voit ces comptes B ${qte(FREQUENCE_DE_VISITE.C)} fois par an`,
            juste: false,
            retour: `Non : des comptes neufs, à ${qte(r.comptes[0]!.attrition * 100)} % de risque de départ, ne se suivent pas comme des comptes C ; et il lui manquerait encore des visites pour ses prospects.`,
          },
        ];
      },
    },
  ],
};
