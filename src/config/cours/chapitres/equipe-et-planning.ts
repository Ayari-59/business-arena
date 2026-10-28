import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { equipeDuMois, heuresDuMois, indicateursDuMois, planningFaceAuBesoin, seuilDuPointDeVente } from "../monde/boutique";
import { BOUTIQUES_DU_COURS, OUVERTURE, type FicheDeLaBoutique, type JourDOuverture } from "../monde/maille-et-co";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : L'ÉQUIPE ET SON PLANNING (BTS MCO, palier 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : la boutique
 * MAILLE & CO a une fiche figée (monde/maille-et-co.ts : l'équipe, ses contrats, l'affluence d'une
 * semaine type de janvier, le planning d'aujourd'hui) et un modèle (monde/boutique.ts : `equipeDuMois`,
 * `heuresNecessaires`, `planningFaceAuBesoin`). Une évolution du moteur ne change rien ici.
 *
 * L'objet : ce que coûte une heure de l'équipe et ce qu'elle fait vendre, puis le planning. Le besoin
 * d'heures se lit créneau par créneau sur l'affluence (un vendeur pour 8 entrées, au moins 2 présents,
 * plus les tâches hors vente) ; le planning d'aujourd'hui donne 165 heures pour 160 nécessaires, et
 * pourtant des créneaux manquent : le total suffit, il est mal placé. Enfin ce qu'une embauche doit
 * rapporter, et pourquoi elle n'est pas la première réponse à un samedi en sous-effectif.
 *
 * Le piège central : un planning se juge créneau par créneau, pas sur son total. Et une heure de
 * contrat en plus est une charge fixe : elle se paie par la marge des ventes qu'elle permet, pas par
 * le chiffre d'affaires.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, cout-horaire, productivite, le-besoin-du-samedi (la formule est au repère ou dans
 *     la question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-la-part puis
 *     le-chiffre-qui-paie-l-equipe (un curseur sur le chiffre d'affaires, 15 % des ventes face à la
 *     paie) avant la-part-visee ; predire-le-planning puis le-laboratoire-du-planning (heures
 *     déplacées, heures ajoutées, affluence ; un graphique du besoin en escalier) avant
 *     le-planning-face-au-besoin ;
 *   · autonome : la-part-visee, le-planning-face-au-besoin (ni formule ni chiffres à prendre donnés ;
 *     le calcul de la correction montre le chemin) ;
 *   · expert : le-budget-d-heures (un croisement : les heures que 15 % du chiffre d'affaires paient,
 *     face au besoin), la-braderie (une variante chiffrée : 20 % d'entrées en plus), l-embauche (deux
 *     calculs enchaînés : le taux de marge, puis le chiffre d'affaires qui paie un salarié) et
 *     faut-il-embaucher (un jugement, dont les mauvaises réponses sont des erreurs réelles) ; puis la
 *     synthèse.
 *
 * Ce qui a disparu : l'occupation de l'équipe par les « heures par article » de l'arène (0,12 h) et
 * la question du goulot qui en découlait ; le modèle du cours lit l'affluence heure par heure, et le
 * chapitre bâtit enfin le planning que son titre annonce.
 */

/** LA PART DU PERSONNEL VISÉE PAR LA DIRECTION (hypothèse du cours) : 15 % du chiffre d'affaires, sous le seuil d'alerte de 18 % du tableau de bord. */
export const PART_DU_PERSONNEL_VISEE = 0.15;

/** Les bornes du curseur du chiffre d'affaires du mois, en euros, de part et d'autre de janvier. */
export const CHIFFRE_DU_CURSEUR = { min: 80_000, max: 110_000 } as const;

/**
 * LA BRADERIE DE LA VILLE (hypothèse du cours) : une semaine où chaque créneau reçoit 20 % d'entrées
 * de plus que la semaine type de janvier. La variante se calcule sur la fiche, dont seule l'affluence
 * change ; le planning reste celui d'aujourd'hui.
 */
export const AFFLUENCE_DE_LA_BRADERIE = 1.2;

/** Les leviers du laboratoire du planning : heures déplacées et ajoutées par semaine, affluence en % de janvier. */
export const LEVIERS_DU_PLANNING = {
  deplacees: { min: 0, max: 20, pas: 1 },
  ajoutees: { min: 0, max: 30, pas: 1 },
  affluence: { min: 80, max: 130, pas: 5 },
} as const;

export const ENTREPRISES_DU_POINT_DE_VENTE: readonly string[] = ["boutique"];

const POURQUOI =
  "ce chapitre se joue à la boutique du cours, MAILLE & CO : son planning suit l'affluence d'un magasin créneau par créneau, et c'est le même point de vente d'un chapitre à l'autre du parcours.";

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${qte(t)} %`;
const h = (x: number) => `${qte(x)} h`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const plafond = (x: number) => Math.ceil(x - 1e-9);

/** La fiche de la boutique du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => BOUTIQUES_DU_COURS[c.code]!;

/** Les créneaux d'une journée : « 10 h », « 11 h »… */
export const CRENEAUX = Array.from({ length: OUVERTURE.fin - OUVERTURE.debut }, (_, i) => `${OUVERTURE.debut + i} h`);

/** Le coût, la productivité, le besoin d'heures et le planning de l'équipe : tout ce que le chapitre et son cas demandent. */
export function equipeEtPlanning(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const e = equipeDuMois(f);
  const ind = indicateursDuMois(f);
  const s = seuilDuPointDeVente(f);
  const p = planningFaceAuBesoin(f);
  const b = p.besoin;
  const ca = e.chiffreDAffaires;
  // Le taux horaire chargé, au centime : c'est lui que l'élève reprend dans chaque calcul.
  const tauxHoraire = auCentime(e.cout / e.heuresDuMois);
  const tauxMcv = s.tauxDeMarge;
  const tauxMcvAffiche = auDixieme(tauxMcv * 100);
  const panier = ind.panierMoyen;
  const r = f.reglesDuPlanning;
  const samedi = b.jours.find((j) => j.jour === "samedi")!;
  const pointe = samedi.entrees.indexOf(Math.max(...samedi.entrees));
  const creux = samedi.entrees.indexOf(Math.min(...samedi.entrees));
  const vendeursPour = (entrees: number) => Math.max(r.presenceMinimale, plafond(entrees / r.entreesParVendeur));
  // La part visée : le chiffre d'affaires qui la tient, et ce qu'il demande en passages en caisse.
  const caVise = plafond(e.cout / PART_DU_PERSONNEL_VISEE);
  // Le budget d'heures : ce que 15 % du chiffre d'affaires de janvier paient, au taux horaire chargé.
  const masseAdmissible = auCentime(ca * PART_DU_PERSONNEL_VISEE);
  const heuresPayablesDuMois = auCentime(masseAdmissible / tauxHoraire);
  const heuresPayablesParSemaine = auDixieme(heuresPayablesDuMois / f.semainesParMois);
  // La braderie : le même planning face à 20 % d'entrées en plus.
  const pb = planningFaceAuBesoin(f, f.planning, { affluence: AFFLUENCE_DE_LA_BRADERIE });
  const besoinDuSamediBraderie = pb.besoin.jours.find((j) => j.jour === "samedi")!;
  const samediBraderie = { ...pb.jours.find((j) => j.jour === "samedi")!, entrees: besoinDuSamediBraderie.entrees, heures: besoinDuSamediBraderie.heures };
  const autresJoursBraderie = pb.jours.filter((j) => j.jour !== "samedi");
  const heuresDesAutresJoursBraderie = pb.besoin.jours.filter((j) => j.jour !== "samedi").reduce((t, j) => t + j.heures, 0);
  const aAjouterBraderie = Math.max(0, pb.heuresManquantes - pb.heuresEnTrop);
  const heuresAjouteesDuMois = heuresDuMois(f, aAjouterBraderie);
  // L'embauche : un salarié au coût moyen de l'équipe.
  const coutMoyen = auCentime(e.cout / e.effectif);
  const caPourUneEmbauche = plafond(coutMoyen / tauxMcv);
  return {
    f,
    e,
    ca,
    tauxHoraire,
    caParHeure: auCentime(ca / e.heuresDuMois),
    caParSalarie: Math.round(ca / e.effectif),
    partDuPersonnel: auDixieme(e.partDuPersonnel * 100),
    tauxMcv,
    tauxMcvAffiche,
    coutsVariables: s.coutsVariables,
    panier,
    tickets: ind.tickets,
    entreesDuMois: ind.entrees,
    regles: r,
    vendeursPour,
    besoin: b,
    samedi,
    pointe,
    creux,
    heuresDesAutresJours: b.heuresDeVente - samedi.heures,
    planning: p,
    heuresDeContrat: e.heuresParSemaine,
    caVise,
    hausseVisee: auDixieme((caVise / ca - 1) * 100),
    passagesVises: plafond(caVise / panier),
    masseAdmissible,
    heuresPayablesDuMois,
    heuresPayablesParSemaine,
    heuresNonFinancees: auDixieme(b.parSemaine - heuresPayablesParSemaine),
    braderie: {
      planning: pb,
      samedi: samediBraderie,
      autresJours: {
        heures: heuresDesAutresJoursBraderie,
        manquantes: autresJoursBraderie.reduce((t, j) => t + j.manquantes, 0),
        enTrop: autresJoursBraderie.reduce((t, j) => t + j.enTrop, 0),
      },
      aAjouter: aAjouterBraderie,
      heuresAjouteesDuMois,
      cout: auCentime(heuresAjouteesDuMois * tauxHoraire),
    },
    coutMoyen,
    caPourUneEmbauche,
    passagesPourUneEmbauche: plafond(caPourUneEmbauche / panier),
  };
}

export type EquipeEtPlanning = ReturnType<typeof equipeEtPlanning>;

/**
 * LE PLANNING REBÂTI, pour le laboratoire et le cas. HYPOTHÈSE DU COURS : une heure de contrat peut se
 * placer sur n'importe quel créneau de la semaine (dans la réalité, les contrats, les repos et la loi
 * encadrent ces déplacements). Les heures déplacées se prennent sur les créneaux en sureffectif (au
 * plus ce qu'il y en a) et comblent d'abord les créneaux en manque ; au-delà, elles restent en trop
 * ailleurs. Les heures ajoutées (des heures de contrat en plus) comblent ce qui manque encore, puis
 * s'ajoutent aux heures en trop. L'affluence est en % de la semaine type de janvier.
 */
export function planningRebati(x: EquipeEtPlanning, p: { deplacees: number; ajoutees: number; affluence: number }) {
  const f = x.f;
  const b = planningFaceAuBesoin(f, f.planning, { affluence: p.affluence / 100 });
  const deplacees = Math.min(p.deplacees, b.heuresEnTrop);
  const comblees = Math.min(deplacees, b.heuresManquantes);
  const manquantesApres = b.heuresManquantes - comblees;
  const ajouteesUtiles = Math.min(p.ajoutees, manquantesApres);
  const manquantes = manquantesApres - ajouteesUtiles;
  const enTrop = b.heuresEnTrop - comblees + (p.ajoutees - ajouteesUtiles);
  const coutAjoute = auCentime(heuresDuMois(f, p.ajoutees) * x.tauxHoraire);
  const paie = auCentime(x.e.cout + coutAjoute);
  return {
    necessaires: b.besoin.heuresDeVente,
    planifiees: b.heuresPlanifiees + p.ajoutees,
    manquantesAuDepart: b.heuresManquantes,
    enTropAuDepart: b.heuresEnTrop,
    manquantes,
    enTrop,
    contrat: x.heuresDeContrat + p.ajoutees,
    coutAjoute,
    paie,
    coutDesHeuresEnTrop: auCentime(heuresDuMois(f, enTrop) * x.tauxHoraire),
    partDuPersonnel: auDixieme((paie / x.ca) * 100),
  };
}

const NOMS_DES_JOURS: Record<JourDOuverture, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
};

/** L'équipe de la boutique : le document de départ. */
export function tableauDeLEquipe(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = equipeEtPlanning(c);
  return {
    titre: `L'équipe de ${x.f.entreprise}, en janvier`,
    colonnes: ["Contrat", "Heures par semaine", "Salaire brut du mois"],
    lignes: x.f.equipe.map((s) => ({ libelle: s.poste, valeurs: [s.contrat, h(s.heuresParSemaine), eur(s.brutMensuel)] })),
  };
}

/** Le planning d'aujourd'hui face au besoin, créneau par créneau, jour par jour. */
function tableauDuPlanning(x: EquipeEtPlanning): TableauDeDonnees {
  return {
    titre: `${x.f.entreprise} · vendeurs présents et vendeurs nécessaires, créneau par créneau`,
    colonnes: CRENEAUX,
    lignes: x.planning.jours.flatMap((j) => [
      { libelle: `${NOMS_DES_JOURS[j.jour]} : planning`, valeurs: j.presents.map((v) => qte(v)) },
      { libelle: `${NOMS_DES_JOURS[j.jour]} : besoin`, valeurs: j.vendeurs.map((v) => qte(v)) },
    ]),
  };
}

export const EQUIPE_ET_PLANNING: Chapitre = {
  code: "equipe-et-planning",
  parcours: "mco",
  palier: 4,
  blocs: [
    "BTS MCO Bloc 4 · Manager l'équipe commerciale",
    "Bac pro AGORA Bloc 3 · Administrer le personnel",
    "2de pro GATL 2 · Organiser et planifier l'activité",
    "BUT TC · Manager une équipe commerciale sur un espace de vente",
    "BTS MHR Bloc 3 · Management de la production de services en hôtellerie restauration",
  ],
  titre: "L'équipe et son planning",
  accroche:
    "Ce que coûte une heure de l'équipe et ce qu'elle fait vendre. Puis le besoin d'heures lu sur l'affluence, créneau par créneau : un planning qui a assez d'heures peut manquer de monde le samedi. Enfin ce qu'une embauche doit rapporter, et quand elle n'est pas la réponse.",
  objectifs: [
    "Calculer le coût horaire chargé de l'équipe, sa productivité et la part du personnel dans le chiffre d'affaires",
    "Calculer les heures que l'affluence demande, créneau par créneau",
    "Confronter un planning au besoin : les heures qui manquent, celles qui sont en trop",
    "Chiffrer le budget d'heures qu'une part du personnel visée permet",
    "Calculer le chiffre d'affaires qu'une embauche doit faire réaliser, et juger s'il faut embaucher",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_POINT_DE_VENTE, pourquoi: POURQUOI },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une équipe, des heures, une paie",
      notions: ["productivity", "payroll", "fixed_costs"],
      tableau: tableauDeLEquipe,
      texte: (c) => {
        const x = equipeEtPlanning(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}, sur le mois de janvier. La boutique ouvre du lundi au samedi, de ${OUVERTURE.debut} h à ${OUVERTURE.fin} h. Son équipe compte ${qte(x.e.effectif)} salariés, pour ${h(x.heuresDeContrat)} de contrat par semaine.`,
          `Ce que la simulation suppose. Un mois compte 52 ÷ 12 semaines : les heures du mois sont les heures de la semaine × 52 ÷ 12. Les cotisations patronales font ${pct(x.f.tauxPatronal * 100)} du brut. Un vendeur accueille et conseille au plus ${qte(x.regles.entreesParVendeur)} entrées par heure, et il en faut toujours au moins ${qte(x.regles.presenceMinimale)} en boutique ; les tâches hors vente (livraisons, mise en rayon, caisse) prennent ${h(x.regles.tachesHorsVente)} par semaine. Un créneau en sous-effectif ne fait pas perdre de vente dans le modèle : c'est l'accueil qui se dégrade, et le manager qui le sait.`,
          "Le manager regarde trois choses : ce que coûte une heure de son équipe, ce qu'elle fait vendre, et si elle est là quand les clients entrent.",
        ];
      },
      repere: () => "Heures du mois = heures de la semaine × 52 ÷ 12. Coût horaire chargé = coût du personnel (brut + cotisations patronales) ÷ heures payées du mois.",
    },
    {
      id: "cout-horaire",
      type: "montants",
      titre: "Le coût d'une heure",
      notions: ["payroll", "productivity"],
      question: (c) => {
        const x = equipeEtPlanning(c);
        return `Les contrats font ${h(x.heuresDeContrat)} par semaine et les salaires bruts ${eur(x.e.brut)} par mois. Calculez les heures payées du mois (${h(x.heuresDeContrat)} × 52 ÷ 12, contrat par contrat, au centième), le coût du personnel (le brut plus ${pct(x.f.tauxPatronal * 100)} de cotisations patronales), puis le coût horaire chargé, au centime.`;
      },
      champs: (c) => {
        const x = equipeEtPlanning(c);
        return [
          {
            libelle: "Heures payées du mois",
            attendu: x.e.heuresDuMois,
            tolerance: 0.1,
            calcul: `${x.e.salaries.map((s) => h(s.heuresDuMois)).join(" + ")} = ${h(x.e.heuresDuMois)}`,
          },
          { libelle: "Coût du personnel du mois", attendu: x.e.cout, calcul: `${eur(x.e.brut)} × ${qte(1 + x.f.tauxPatronal)} = ${eur(x.e.cout)}` },
          { libelle: "Coût horaire chargé", attendu: x.tauxHoraire, tolerance: 0.02, calcul: `${eur(x.e.cout)} ÷ ${h(x.e.heuresDuMois)} = ${eur(x.tauxHoraire)}` },
        ];
      },
      explication: (c) => {
        const x = equipeEtPlanning(c);
        return [
          `Une heure de l'équipe de ${x.f.entreprise} coûte ${eur(x.tauxHoraire)}, qu'elle serve un client ou qu'elle attende. Le personnel est une charge fixe : la paie ne bouge pas avec les ventes du mois.`,
        ];
      },
    },
    {
      id: "productivite",
      type: "montants",
      titre: "Ce que l'équipe fait vendre",
      notions: ["productivity", "revenue"],
      question: (c) => {
        const x = equipeEtPlanning(c);
        return `Janvier fait ${eur(x.ca)} de chiffre d'affaires hors taxes. Calculez le chiffre d'affaires par heure payée (${h(x.e.heuresDuMois)}, au centime), par salarié (à l'euro), puis la part du personnel dans le chiffre d'affaires (${eur(x.e.cout)} de paie), en pourcentage, au dixième.`;
      },
      champs: (c) => {
        const x = equipeEtPlanning(c);
        return [
          { libelle: "Chiffre d'affaires par heure payée", attendu: x.caParHeure, tolerance: 0.02, calcul: `${eur(x.ca)} ÷ ${h(x.e.heuresDuMois)} = ${eur(x.caParHeure)}` },
          { libelle: "Chiffre d'affaires par salarié", attendu: x.caParSalarie, tolerance: 1, calcul: `${eur(x.ca)} ÷ ${qte(x.e.effectif)} = ${eur(x.caParSalarie)}` },
          { libelle: "Part du personnel (%)", attendu: x.partDuPersonnel, tolerance: 0.1, calcul: `${eur(x.e.cout)} ÷ ${eur(x.ca)} × 100 = ${pct(x.partDuPersonnel)}` },
        ];
      },
      explication: (c) => {
        const x = equipeEtPlanning(c);
        return [
          `Chaque heure payée fait vendre ${eur(x.caParHeure)} et en coûte ${eur(x.tauxHoraire)}. Le personnel pèse ${pct(x.partDuPersonnel)} du chiffre d'affaires, sous le seuil d'alerte de ${pct(x.f.seuilsDAlerte.partDuPersonnel.seuil * 100)} du tableau de bord ; la direction en vise ${pct(PART_DU_PERSONNEL_VISEE * 100)}.`,
        ];
      },
    },
    {
      id: "predire-la-part",
      type: "choix",
      titre: "Pariez sur la part du personnel",
      notions: ["fixed_costs", "payroll"],
      question: (c) => {
        const x = equipeEtPlanning(c);
        return `Avant de calculer, pariez. Si le chiffre d'affaires du mois montait de 10 %, avec la même équipe et les mêmes contrats, la part du personnel (${pct(x.partDuPersonnel)} aujourd'hui) serait…`;
      },
      options: (c) => {
        const x = equipeEtPlanning(c);
        const apres = x.e.cout / (x.ca * 1.1);
        const voir = "Faites varier le chiffre d'affaires à l'étape suivante : le curseur montre ce que devient la part, et où elle passe sous la cible.";
        return [
          { texte: "Plus basse : la paie ne suit pas les ventes", juste: apres < x.e.partDuPersonnel, retour: `Bon pari. ${voir}` },
          { texte: "La même : la paie et les ventes montent ensemble", juste: apres === x.e.partDuPersonnel, retour: `Pari à vérifier. ${voir}` },
          { texte: "Plus haute : plus de ventes demandent plus de vendeurs", juste: apres > x.e.partDuPersonnel, retour: `Pari à vérifier : l'équipe ne change pas ici. ${voir}` },
        ];
      },
    },
    {
      id: "le-chiffre-qui-paie-l-equipe",
      type: "curseur",
      titre: "Le chiffre d'affaires qui paie l'équipe",
      notions: ["fixed_costs", "payroll"],
      question: (c) => {
        const x = equipeEtPlanning(c);
        return `Faites varier le chiffre d'affaires du mois de ${eur(CHIFFRE_DU_CURSEUR.min)} à ${eur(CHIFFRE_DU_CURSEUR.max)}, à paie constante. Une droite donne ${pct(PART_DU_PERSONNEL_VISEE * 100)} du chiffre d'affaires, l'enveloppe que la direction accorde au personnel ; l'autre la paie, ${eur(x.e.cout)}. Placez le curseur sur le plus petit chiffre d'affaires où l'enveloppe couvre la paie, puis validez.`;
      },
      grandeur: () => ({ libelle: "Chiffre d'affaires du mois", unite: "€" }),
      cible: (c) => ({ attendu: equipeEtPlanning(c).caVise, min: CHIFFRE_DU_CURSEUR.min, max: CHIFFRE_DU_CURSEUR.max }),
      zones: ["Part sous la cible", "Part au-dessus de la cible"],
      rates: () => ({
        dessous: `À ce chiffre d'affaires, la paie pèse encore plus de ${pct(PART_DU_PERSONNEL_VISEE * 100)} des ventes.`,
        dessus: "Plus bas, l'enveloppe couvre encore la paie : cherchez le plus petit chiffre d'affaires.",
      }),
      montrer: "Montrer le croisement",
      lecture: (c, q) => {
        const x = equipeEtPlanning(c);
        const enveloppe = auCentime(q * PART_DU_PERSONNEL_VISEE);
        return [
          { libelle: "Paie du mois", montant: x.e.cout },
          { libelle: `Enveloppe du personnel, ${pct(PART_DU_PERSONNEL_VISEE * 100)} des ventes`, montant: enveloppe },
          { libelle: "Chiffre d'affaires en plus de janvier", montant: auCentime(q - x.ca) },
          { libelle: "Enveloppe moins paie", montant: auCentime(enveloppe - x.e.cout), fort: true },
        ];
      },
      droites: (c) => {
        const x = equipeEtPlanning(c);
        return { produit: (q) => q * PART_DU_PERSONNEL_VISEE, cout: () => x.e.cout, libelles: [`${pct(PART_DU_PERSONNEL_VISEE * 100)} du chiffre d'affaires`, "Paie du mois"] };
      },
      explication: (c) => {
        const x = equipeEtPlanning(c);
        return [
          `La paie est une droite plate : elle ne bouge pas avec les ventes. L'enveloppe la rattrape à ${eur(x.caVise)} : en dessous, le personnel pèse plus de ${pct(PART_DU_PERSONNEL_VISEE * 100)} ; au-dessus, moins. La part du personnel baisse quand les ventes montent, sans qu'aucun salaire ne baisse.`,
          `À janvier (${eur(x.ca)}), il manque ${eur(x.caVise - x.ca)} de ventes. C'est ce que l'étape suivante fait chiffrer, en pourcentage et en passages en caisse.`,
        ];
      },
    },
    {
      id: "la-part-visee",
      type: "montants",
      titre: "Le chiffre d'affaires de la part visée",
      notions: ["fixed_costs", "payroll", "average_basket"],
      question: (c) => {
        const x = equipeEtPlanning(c);
        return `Sans formule cette fois. Quel chiffre d'affaires du mois ferait peser la paie ${pct(PART_DU_PERSONNEL_VISEE * 100)} exactement (à l'euro, arrondi au-dessus) ? De combien dépasse-t-il janvier, en pourcentage, au dixième ? Combien de passages en caisse faut-il pour le faire, au panier moyen de janvier (à l'unité, arrondi au-dessus) ? Les passages en caisse de janvier sont ${qte(x.tickets)}.`;
      },
      champs: (c) => {
        const x = equipeEtPlanning(c);
        return [
          { libelle: "Chiffre d'affaires de la part visée", attendu: x.caVise, tolerance: 1, calcul: `${eur(x.e.cout)} ÷ ${pct(PART_DU_PERSONNEL_VISEE * 100)} = ${eur(x.caVise)}` },
          { libelle: "Hausse sur janvier (%)", attendu: x.hausseVisee, tolerance: 0.1, calcul: `(${eur(x.caVise)} ÷ ${eur(x.ca)} − 1) × 100 = ${pct(x.hausseVisee)}` },
          {
            libelle: "Passages en caisse nécessaires",
            attendu: x.passagesVises,
            tolerance: 1,
            calcul: `Le panier moyen de janvier vaut ${eur(x.ca)} ÷ ${qte(x.tickets)} = ${eur(auCentime(x.panier))} ; ${eur(x.caVise)} ÷ ${eur(auCentime(x.panier))} = ${qte(x.passagesVises)} passages`,
          },
        ];
      },
      explication: (c) => {
        const x = equipeEtPlanning(c);
        return [
          `Pour que l'équipe d'aujourd'hui pèse ${pct(PART_DU_PERSONNEL_VISEE * 100)}, il faudrait ${pct(x.hausseVisee)} de ventes en plus, soit ${qte(x.passagesVises - x.tickets)} passages en caisse de plus que les ${qte(x.tickets)} de janvier. La part du personnel se pilote par les deux bouts : la paie, et les ventes qu'elle permet.`,
        ];
      },
    },
    {
      id: "le-besoin-du-samedi",
      type: "montants",
      titre: "Les heures que l'affluence demande",
      notions: ["capacity", "productivity"],
      tableau: (c) => {
        const x = equipeEtPlanning(c);
        return {
          titre: `${x.f.entreprise} · les entrées d'une semaine type de janvier, créneau par créneau`,
          colonnes: CRENEAUX,
          lignes: x.besoin.jours.map((j) => ({ libelle: NOMS_DES_JOURS[j.jour], valeurs: j.entrees.map((v) => qte(v)) })),
        };
      },
      question: (c) => {
        const x = equipeEtPlanning(c);
        return `Sur chaque créneau, les vendeurs nécessaires sont le plus grand de ${qte(x.regles.presenceMinimale)} et des entrées ÷ ${qte(x.regles.entreesParVendeur)}, arrondies à l'unité supérieure. Calculez les vendeurs nécessaires le samedi à ${CRENEAUX[x.pointe]} et à ${CRENEAUX[x.creux]}, puis les heures de vente du samedi (la somme de ses ${qte(CRENEAUX.length)} créneaux). Du lundi au vendredi, l'affluence demande ${h(x.heuresDesAutresJours)} de vente : calculez enfin le besoin de la semaine, tâches hors vente comprises (${h(x.regles.tachesHorsVente)}).`;
      },
      champs: (c) => {
        const x = equipeEtPlanning(c);
        const e = x.samedi.entrees;
        return [
          {
            libelle: `Vendeurs nécessaires le samedi à ${CRENEAUX[x.pointe]}`,
            attendu: x.samedi.vendeurs[x.pointe]!,
            calcul: `${qte(e[x.pointe]!)} ÷ ${qte(x.regles.entreesParVendeur)} = ${qte(auCentime(e[x.pointe]! / x.regles.entreesParVendeur))}, arrondi à ${qte(x.samedi.vendeurs[x.pointe]!)}`,
          },
          {
            libelle: `Vendeurs nécessaires le samedi à ${CRENEAUX[x.creux]}`,
            attendu: x.samedi.vendeurs[x.creux]!,
            calcul: `${qte(e[x.creux]!)} ÷ ${qte(x.regles.entreesParVendeur)} = ${qte(auCentime(e[x.creux]! / x.regles.entreesParVendeur))}, arrondi à ${qte(plafond(e[x.creux]! / x.regles.entreesParVendeur))} ; au moins ${qte(x.regles.presenceMinimale)} : ${qte(x.samedi.vendeurs[x.creux]!)}`,
          },
          { libelle: "Heures de vente du samedi", attendu: x.samedi.heures, calcul: `${x.samedi.vendeurs.map((v) => qte(v)).join(" + ")} = ${h(x.samedi.heures)}` },
          {
            libelle: "Besoin de la semaine, tâches comprises",
            attendu: x.besoin.parSemaine,
            calcul: `${h(x.heuresDesAutresJours)} + ${h(x.samedi.heures)} + ${h(x.regles.tachesHorsVente)} = ${h(x.besoin.parSemaine)}`,
          },
        ];
      },
      explication: (c) => {
        const x = equipeEtPlanning(c);
        return [
          `Le samedi demande à lui seul ${h(x.samedi.heures)} de vente sur ${h(x.besoin.heuresDeVente)} dans la semaine. Le besoin de la semaine est de ${h(x.besoin.parSemaine)} : les contrats en donnent ${h(x.heuresDeContrat)}. Au total, l'équipe suffit. Reste à savoir si ses heures sont là où sont les clients.`,
        ];
      },
    },
    {
      id: "predire-le-planning",
      type: "choix",
      titre: "Pariez sur le planning",
      notions: ["capacity"],
      question: (c) => {
        const x = equipeEtPlanning(c);
        return `Avant de regarder le planning, pariez. Il donne ${h(x.planning.heuresDuPlanning)} par semaine pour un besoin de ${h(x.besoin.parSemaine)}. Créneau par créneau, face au besoin, on trouvera…`;
      },
      options: (c) => {
        const x = equipeEtPlanning(c);
        const p = x.planning;
        const voir = "Ouvrez le laboratoire du planning à l'étape suivante : le tableau compte les heures qui manquent et celles qui sont en trop.";
        return [
          { texte: "Des créneaux en manque, malgré les heures d'avance", juste: p.heuresManquantes > 0, retour: `Bon pari. ${voir}` },
          { texte: "Aucun créneau en manque : le total couvre le besoin", juste: p.heuresManquantes === 0, retour: `Pari à vérifier. ${voir}` },
          { texte: "Des créneaux en trop seulement, pour l'avance du total", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-du-planning",
      type: "simulation",
      titre: "Le laboratoire du planning",
      notions: ["capacity", "payroll", "fixed_costs"],
      question: (c) => {
        const x = equipeEtPlanning(c);
        return `Le planning d'aujourd'hui donne ${h(x.planning.heuresPlanifiees)} de vente par semaine. Déplacez des heures des créneaux en trop vers les créneaux en manque, ajoutez des heures de contrat, faites varier l'affluence : le tableau suit le besoin, les heures en manque et en trop, et la paie. La simulation suppose qu'une heure de contrat peut se placer sur n'importe quel créneau.`;
      },
      leviers: () => [
        { code: "deplacees", libelle: "Heures déplacées par semaine", unite: "h", ...LEVIERS_DU_PLANNING.deplacees, depart: 0 },
        { code: "ajoutees", libelle: "Heures de contrat ajoutées par semaine", unite: "h", ...LEVIERS_DU_PLANNING.ajoutees, depart: 0 },
        { code: "affluence", libelle: "Affluence, en % de janvier", unite: "%", ...LEVIERS_DU_PLANNING.affluence, depart: 100 },
      ],
      lecture: (c, p) => {
        const x = equipeEtPlanning(c);
        const l = planningRebati(x, { deplacees: p.deplacees!, ajoutees: p.ajoutees!, affluence: p.affluence! });
        const d = planningRebati(x, { deplacees: 0, ajoutees: 0, affluence: 100 });
        return [
          { libelle: "Heures de vente nécessaires", montant: l.necessaires, reference: d.necessaires, unite: "h" },
          { libelle: "Heures de vente planifiées", montant: l.planifiees, reference: d.planifiees, unite: "h" },
          { libelle: "Heures en manque", montant: l.manquantes, reference: d.manquantes, unite: "h", fort: true },
          { libelle: "Heures en trop", montant: l.enTrop, reference: d.enTrop, unite: "h" },
          { libelle: "Heures de contrat par semaine", montant: l.contrat, reference: d.contrat, unite: "h" },
          { libelle: "Paie du mois", montant: l.paie, reference: d.paie },
          { libelle: "Part du personnel", montant: l.partDuPersonnel, reference: d.partDuPersonnel, unite: "%" },
          { libelle: "Coût des heures ajoutées", montant: -l.coutAjoute + 0, reference: -d.coutAjoute + 0, effet: true },
          { libelle: "Paie des heures en trop", montant: -l.coutDesHeuresEnTrop + 0, reference: -d.coutDesHeuresEnTrop + 0, effet: true },
        ];
      },
      // Le besoin selon l'affluence n'est pas une droite : un escalier, créneau par créneau.
      graphique: (c) => {
        const x = equipeEtPlanning(c);
        const lire = (p: Readonly<Record<string, number>>) => planningRebati(x, { deplacees: p.deplacees!, ajoutees: p.ajoutees!, affluence: p.affluence! });
        return {
          levier: "affluence",
          unite: "h",
          courbes: [
            { libelle: "Heures de vente nécessaires", valeur: (p) => lire(p).necessaires },
            { libelle: "Heures de vente planifiées", valeur: (p) => lire(p).planifiees },
            { libelle: "Heures en manque", valeur: (p) => lire(p).manquantes },
          ],
        };
      },
      defi: (c) => {
        const x = equipeEtPlanning(c);
        const lire = (p: Readonly<Record<string, number>>) => planningRebati(x, { deplacees: p.deplacees!, ajoutees: p.ajoutees!, affluence: p.affluence! });
        return {
          consigne: "À l'affluence de janvier, couvrez chaque créneau sans ajouter une heure de contrat.",
          atteint: (p) => p.affluence === 100 && p.ajoutees === 0 && lire(p).manquantes === 0,
          indice: (p) => {
            const l = lire(p);
            if (p.affluence !== 100) return "Le défi se joue à l'affluence de janvier : remettez-la à 100 %.";
            if (p.ajoutees! > 0) return `Vous payez ${h(p.ajoutees!)} de contrat en plus par semaine, ${eur(l.coutAjoute)} par mois : le défi demande de couvrir le besoin avec les heures d'aujourd'hui.`;
            return `Il manque encore ${h(l.manquantes)} : déplacez des heures prises sur les créneaux en trop, il y en a ${h(l.enTrop)}.`;
          },
          solution: { deplacees: x.planning.heuresManquantes, ajoutees: 0, affluence: 100 },
        };
      },
      explication: (c, p) => {
        const x = equipeEtPlanning(c);
        const l = planningRebati(x, { deplacees: p.deplacees!, ajoutees: p.ajoutees!, affluence: p.affluence! });
        const haut = planningRebati(x, { deplacees: 0, ajoutees: 0, affluence: 115 });
        const bas = planningRebati(x, { deplacees: 0, ajoutees: 0, affluence: 110 });
        return [
          `En déplaçant ${h(x.planning.heuresManquantes)} du début de semaine vers le mercredi soir, le vendredi et le samedi, chaque créneau est couvert sans un euro de paie en plus. Il reste ${h(l.enTrop)} en trop, payées ${eur(l.coutDesHeuresEnTrop)} par mois : l'avance du total, qu'aucun créneau ne demande.`,
          `Ajouter des heures couvrait aussi les créneaux, mais chaque heure de contrat par semaine coûte ${eur(auCentime(heuresDuMois(x.f, 1) * x.tauxHoraire))} par mois. Et le besoin monte en escalier avec l'affluence : ${h(bas.necessaires)} de vente à 110 % de janvier, ${h(haut.necessaires)} à 115 %, parce que beaucoup de créneaux franchissent ensemble un multiple de ${qte(x.regles.entreesParVendeur)} entrées.`,
        ];
      },
    },
    {
      id: "le-planning-face-au-besoin",
      type: "montants",
      titre: "Le planning face au besoin",
      notions: ["capacity"],
      tableau: (c) => tableauDuPlanning(equipeEtPlanning(c)),
      question: () =>
        "Sans formule cette fois. Comptez, créneau par créneau, les heures de vente qui manquent au planning d'aujourd'hui et celles qui sont en trop, puis les heures à déplacer pour couvrir chaque créneau et celles qui restent en trop une fois le planning rebâti.",
      champs: (c) => {
        const x = equipeEtPlanning(c);
        const p = x.planning;
        const parJour = (g: (j: (typeof p.jours)[number]) => number) =>
          p.jours
            .filter((j) => g(j) > 0)
            .map((j) => `${qte(g(j))} le ${j.jour}`)
            .join(", ");
        return [
          { libelle: "Heures en manque dans la semaine", attendu: p.heuresManquantes, calcul: `${parJour((j) => j.manquantes)} : ${h(p.heuresManquantes)}` },
          { libelle: "Heures en trop dans la semaine", attendu: p.heuresEnTrop, calcul: `${parJour((j) => j.enTrop)} : ${h(p.heuresEnTrop)}` },
          { libelle: "Heures à déplacer", attendu: Math.min(p.heuresManquantes, p.heuresEnTrop), calcul: `Autant qu'il en manque, prises sur les créneaux en trop : ${h(Math.min(p.heuresManquantes, p.heuresEnTrop))}` },
          {
            libelle: "Heures en trop après le planning rebâti",
            attendu: p.heuresEnTrop - Math.min(p.heuresManquantes, p.heuresEnTrop),
            calcul: `${h(p.heuresEnTrop)} − ${h(p.heuresManquantes)} = ${h(p.heuresEnTrop - p.heuresManquantes)}, soit ${h(p.heuresDuPlanning)} de contrat − ${h(x.besoin.parSemaine)} de besoin`,
          },
        ];
      },
      explication: (c) => {
        const x = equipeEtPlanning(c);
        const p = x.planning;
        const sam = p.jours.find((j) => j.jour === "samedi")!;
        return [
          `Le planning d'aujourd'hui a ${h(p.heuresEnTrop)} en trop et ${h(p.heuresManquantes)} en manque, dont ${h(sam.manquantes)} le samedi. Le total cachait les deux : ${h(p.heuresEnTrop)} − ${h(p.heuresManquantes)} = ${h(p.heuresEnTrop - p.heuresManquantes)}, l'avance des contrats sur le besoin.`,
          "Un planning se bâtit sur l'affluence, créneau par créneau : d'abord le besoin, puis les présences, puis les écarts. C'est le même raisonnement qu'un budget face au réalisé.",
        ];
      },
    },
    {
      id: "le-budget-d-heures",
      type: "montants",
      titre: "Le budget d'heures",
      notions: ["payroll", "capacity", "fixed_costs"],
      question: () =>
        `La direction veut que le personnel pèse ${pct(PART_DU_PERSONNEL_VISEE * 100)} du chiffre d'affaires de janvier. Quelle masse salariale cela permet-il ? Combien d'heures paie-t-elle par mois au coût horaire chargé de l'équipe, puis par semaine (au dixième) ? Combien d'heures du besoin de la semaine restent sans financement ?`,
      champs: (c) => {
        const x = equipeEtPlanning(c);
        return [
          { libelle: "Masse salariale admissible", attendu: x.masseAdmissible, calcul: `${eur(x.ca)} × ${pct(PART_DU_PERSONNEL_VISEE * 100)} = ${eur(x.masseAdmissible)}` },
          { libelle: "Heures payables du mois", attendu: x.heuresPayablesDuMois, tolerance: 0.5, calcul: `${eur(x.masseAdmissible)} ÷ ${eur(x.tauxHoraire)} = ${h(x.heuresPayablesDuMois)}` },
          { libelle: "Heures payables par semaine", attendu: x.heuresPayablesParSemaine, tolerance: 0.2, calcul: `${h(x.heuresPayablesDuMois)} × 12 ÷ 52 = ${h(x.heuresPayablesParSemaine)}` },
          { libelle: "Heures du besoin sans financement", attendu: x.heuresNonFinancees, tolerance: 0.2, calcul: `${h(x.besoin.parSemaine)} − ${h(x.heuresPayablesParSemaine)} = ${h(x.heuresNonFinancees)}` },
        ];
      },
      explication: (c) => {
        const x = equipeEtPlanning(c);
        return [
          `À ${pct(PART_DU_PERSONNEL_VISEE * 100)} du chiffre d'affaires de janvier, la boutique paierait ${h(x.heuresPayablesParSemaine)} par semaine : moins que son besoin, ${h(x.besoin.parSemaine)}, lu sur l'affluence. Les deux objectifs se heurtent : tenir la part visée en coupant des heures laisserait des créneaux en manque.`,
          `Ce n'est pas la paie qui est trop lourde, c'est le chiffre d'affaires par entrée qui est trop bas pour cette cible : il faudrait ${eur(x.caVise)} de ventes (le curseur) pour payer l'équipe d'aujourd'hui à ${pct(PART_DU_PERSONNEL_VISEE * 100)}.`,
        ];
      },
    },
    {
      id: "la-braderie",
      type: "montants",
      titre: "Variante : la semaine de la braderie",
      notions: ["capacity", "payroll"],
      tableau: (c) => {
        const x = equipeEtPlanning(c);
        const s = x.braderie.samedi;
        return {
          titre: `${x.f.entreprise} · le samedi de la braderie, créneau par créneau`,
          colonnes: CRENEAUX,
          lignes: [
            { libelle: "Entrées attendues", valeurs: s.entrees.map((v) => qte(auCentime(v))) },
            { libelle: "Vendeurs du planning", valeurs: s.presents.map((v) => qte(v)) },
          ],
        };
      },
      question: (c) => {
        const x = equipeEtPlanning(c);
        const a = x.braderie.autresJours;
        return `La semaine de la braderie de la ville, chaque créneau reçoit ${pct(Math.round((AFFLUENCE_DE_LA_BRADERIE - 1) * 100))} d'entrées de plus que la semaine type. Du lundi au vendredi, le planning d'aujourd'hui y manque de ${h(a.manquantes)} et en a ${h(a.enTrop)} en trop. Calculez les heures de vente nécessaires le samedi, les heures en manque de la semaine, les heures de contrat à ajouter une fois toutes les heures en trop déplacées, puis leur coût du mois au coût horaire chargé de l'équipe.`;
      },
      champs: (c) => {
        const x = equipeEtPlanning(c);
        const b = x.braderie;
        const sam = b.samedi;
        return [
          {
            libelle: "Heures de vente nécessaires le samedi",
            attendu: sam.heures,
            calcul: `Le plus grand de ${qte(x.regles.presenceMinimale)} et des entrées ÷ ${qte(x.regles.entreesParVendeur)}, arrondies au-dessus : ${sam.vendeurs.map((v) => qte(v)).join(" + ")} = ${h(sam.heures)}`,
          },
          {
            libelle: "Heures en manque de la semaine",
            attendu: b.planning.heuresManquantes,
            calcul: `Le samedi, ${h(sam.manquantes)} (${sam.vendeurs.map((v, i) => qte(Math.max(0, v - sam.presents[i]!))).join(" + ")}) ; plus ${h(b.autresJours.manquantes)} du lundi au vendredi : ${h(b.planning.heuresManquantes)}`,
          },
          { libelle: "Heures de contrat à ajouter par semaine", attendu: b.aAjouter, calcul: `${h(b.planning.heuresManquantes)} − ${h(b.planning.heuresEnTrop)} déplacées = ${h(b.aAjouter)}` },
          {
            libelle: "Coût du mois des heures ajoutées",
            attendu: b.cout,
            tolerance: 0.5,
            calcul: `${h(b.aAjouter)} × 52 ÷ 12 = ${h(b.heuresAjouteesDuMois)} ; ${h(b.heuresAjouteesDuMois)} × ${eur(x.tauxHoraire)} = ${eur(b.cout)}`,
          },
        ];
      },
      explication: (c) => {
        const x = equipeEtPlanning(c);
        const b = x.braderie;
        return [
          `Avec ${pct(Math.round((AFFLUENCE_DE_LA_BRADERIE - 1) * 100))} d'entrées en plus, le besoin passe de ${h(x.besoin.parSemaine)} à ${h(b.planning.besoin.parSemaine)} par semaine : ${h(b.planning.besoin.parSemaine - x.besoin.parSemaine)} de plus, pas ${pct(Math.round((AFFLUENCE_DE_LA_BRADERIE - 1) * 100))} de plus. Les créneaux calmes restent à la présence minimale ; les pointes, elles, franchissent un vendeur de plus.`,
          `Cette fois, déplacer ne suffit plus : les ${h(b.planning.heuresEnTrop)} en trop ne couvrent pas les ${h(b.planning.heuresManquantes)} en manque. Il faut ${h(b.aAjouter)} de contrat en plus par semaine, des heures complémentaires ou un renfort de quelques semaines, pour ${eur(b.cout)} sur un mois comme celui-là.`,
        ];
      },
    },
    {
      id: "l-embauche",
      type: "montants",
      titre: "Ce qu'une embauche doit rapporter",
      notions: ["contribution_margin", "fixed_costs", "payroll"],
      question: (c) => {
        const x = equipeEtPlanning(c);
        return `Un salarié de plus coûterait le coût moyen d'un salarié de l'équipe. En janvier, les ventes de ${eur(x.ca)} ont coûté ${eur(x.coutsVariables)} de coûts variables (achats des articles vendus, emballages, frais de carte). Calculez ce coût moyen (au centime), le taux de marge sur coût variable de la boutique (au dixième), puis le chiffre d'affaires que l'embauche doit faire réaliser en plus chaque mois pour se payer (à l'euro, arrondi au-dessus).`;
      },
      champs: (c) => {
        const x = equipeEtPlanning(c);
        return [
          { libelle: "Coût mensuel moyen d'un salarié", attendu: x.coutMoyen, calcul: `${eur(x.e.cout)} ÷ ${qte(x.e.effectif)} = ${eur(x.coutMoyen)}` },
          {
            libelle: "Taux de marge sur coût variable (%)",
            attendu: x.tauxMcvAffiche,
            tolerance: 0.1,
            calcul: `(${eur(x.ca)} − ${eur(x.coutsVariables)}) ÷ ${eur(x.ca)} × 100 = ${pct(x.tauxMcvAffiche)}`,
          },
          { libelle: "Chiffre d'affaires à réaliser en plus", attendu: x.caPourUneEmbauche, tolerance: 2, calcul: `${eur(x.coutMoyen)} ÷ ${pct(x.tauxMcvAffiche)} = ${eur(x.caPourUneEmbauche)}` },
        ];
      },
      explication: (c) => {
        const x = equipeEtPlanning(c);
        return [
          `Pour se payer, une embauche doit faire vendre ${eur(x.caPourUneEmbauche)} de plus chaque mois, soit ${qte(x.passagesPourUneEmbauche)} passages en caisse au panier moyen de janvier. Ce sont les ventes qui paient un salaire, par leur marge : chaque euro vendu n'en laisse que ${pct(x.tauxMcvAffiche)}.`,
        ];
      },
    },
    {
      id: "faut-il-embaucher",
      type: "choix",
      titre: "Faut-il embaucher pour le samedi ?",
      notions: ["capacity", "contribution_margin"],
      question: (c) => {
        const x = equipeEtPlanning(c);
        const sam = x.planning.jours.find((j) => j.jour === "samedi")!;
        return `En janvier, le samedi manque de ${h(sam.manquantes)} de vente. Le responsable propose d'embaucher un vendeur. Que lui répondez-vous ?`;
      },
      options: (c) => {
        const x = equipeEtPlanning(c);
        const p = x.planning;
        const sam = p.jours.find((j) => j.jour === "samedi")!;
        const suffit = p.heuresEnTrop >= p.heuresManquantes;
        return [
          {
            texte: `Pas d'embauche : déplacer ${h(p.heuresManquantes)} du début de semaine couvre chaque créneau`,
            juste: suffit,
            retour: suffit
              ? `Oui. Les contrats donnent ${h(p.heuresDuPlanning)} pour ${h(x.besoin.parSemaine)} de besoin ; les ${h(p.heuresEnTrop)} en trop du lundi au jeudi couvrent les ${h(p.heuresManquantes)} en manque. Une embauche coûterait ${eur(x.coutMoyen)} par mois et devrait faire vendre ${eur(x.caPourUneEmbauche)} de plus.`
              : "Non : les heures en trop ne suffisent pas à couvrir celles qui manquent.",
          },
          {
            texte: `Embaucher : il manque ${h(sam.manquantes)} le samedi, le jour le plus chargé`,
            juste: !suffit,
            retour: suffit
              ? `Non : c'est lire le samedi seul. La semaine a ${h(p.heuresEnTrop)} en trop, payées et sans client à servir : les déplacer coûte moins qu'un salaire de ${eur(x.coutMoyen)}.`
              : "Oui : même toutes les heures en trop déplacées, des créneaux restent en manque.",
          },
          {
            texte: `Embaucher : le salarié se paie dès ${eur(x.coutMoyen)} de ventes en plus`,
            juste: false,
            retour: `Non : c'est prendre le chiffre d'affaires pour de la marge. ${eur(x.coutMoyen)} de ventes ne laissent que ${eur(auCentime(x.coutMoyen * x.tauxMcv))} de marge ; il en faudrait ${eur(x.caPourUneEmbauche)}.`,
          },
          {
            texte: `Retirer ${h(p.heuresDuPlanning - x.besoin.parSemaine)} de contrat : on paie plus que le besoin`,
            juste: false,
            retour: `Non : retirer des heures sans rien déplacer laisse les ${h(p.heuresManquantes)} en manque. L'avance de ${h(p.heuresDuPlanning - x.besoin.parSemaine)} est un total ; les créneaux du samedi, eux, restent vides.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["productivity", "payroll", "capacity"],
      tableau: (c) => {
        const x = equipeEtPlanning(c);
        const p = x.planning;
        return {
          titre: `${x.f.entreprise} · l'équipe et son planning, en janvier`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Coût horaire chargé", valeurs: [eur(x.tauxHoraire)] },
            { libelle: "Chiffre d'affaires par heure payée", valeurs: [eur(x.caParHeure)] },
            { libelle: "Part du personnel", valeurs: [pct(x.partDuPersonnel)] },
            { libelle: `Chiffre d'affaires d'une part de ${pct(PART_DU_PERSONNEL_VISEE * 100)}`, valeurs: [eur(x.caVise)] },
            { libelle: "Heures de contrat par semaine", valeurs: [h(p.heuresDuPlanning)] },
            { libelle: "Besoin de la semaine", valeurs: [h(x.besoin.parSemaine)] },
            { libelle: "Heures en manque, en trop", valeurs: [`${h(p.heuresManquantes)}, ${h(p.heuresEnTrop)}`] },
            { libelle: "Chiffre d'affaires qui paie une embauche", valeurs: [eur(x.caPourUneEmbauche)] },
          ],
        };
      },
      texte: (c) => {
        const x = equipeEtPlanning(c);
        const p = x.planning;
        return [
          `Une heure de l'équipe de ${x.f.entreprise} coûte ${eur(x.tauxHoraire)} et fait vendre ${eur(x.caParHeure)} ; le personnel pèse ${pct(x.partDuPersonnel)} du chiffre d'affaires. Cette part baisse quand les ventes montent, sans qu'aucun salaire ne bouge : à ${eur(x.caVise)}, elle tomberait à ${pct(PART_DU_PERSONNEL_VISEE * 100)}.`,
          `Le planning se juge créneau par créneau : ${h(p.heuresDuPlanning)} de contrat pour ${h(x.besoin.parSemaine)} de besoin, et pourtant ${h(p.heuresManquantes)} en manque, surtout le samedi. La première réponse est de déplacer les heures, pas d'embaucher ; une embauche se paie par la marge des ventes qu'elle permet, ${eur(x.caPourUneEmbauche)} par mois.`,
          `Les limites de la méthode : la règle d'un vendeur pour ${qte(x.regles.entreesParVendeur)} entrées est un ratio moyen, qui ignore les ventes longues et les clientes fidèles ; une heure de contrat ne se déplace pas toujours où l'on veut ; et la simulation ne fait perdre aucune vente à un créneau en manque, quand la réalité en perd.`,
          "Au niveau de l'examen, vous savez calculer le coût horaire chargé et la part du personnel, bâtir le besoin d'heures sur l'affluence et le confronter à un planning, chiffrer un budget d'heures et le coût d'un renfort, et juger si une embauche est la bonne réponse.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Vendeurs nécessaires sur un créneau = le plus grand de la présence minimale et des entrées ÷ entrées par vendeur, arrondies au-dessus. Part du personnel = coût du personnel ÷ chiffre d'affaires. Chiffre d'affaires qui paie une charge fixe = cette charge ÷ taux de marge sur coût variable.",
    },
  ],
};
