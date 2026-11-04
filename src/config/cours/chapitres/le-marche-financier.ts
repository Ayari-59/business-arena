import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import {
  COURS_AFFICHE,
  CROISSANCE_APRES_L_ANNONCE,
  EMETTEUR,
  HAUSSE_DES_TAUX,
  LEVIERS_DE_L_OBLIGATION,
  NOTATION_DE_L_EMETTEUR,
  OBLIGATION_UN_AN_PLUS_TARD,
  OBLIGATION_VERTE,
  PLACEMENT_SANS_RISQUE,
  UN_AN_PLUS_TARD,
  coupon,
  coursDeLActionDuCas,
  coursDeLObligation,
  rendementDeLObligation,
  risqueDeLAction,
  tauxQuiFaitPasserSous,
} from "../monde/marche-financier";
import { PRIME_DE_RISQUE_DU_MARCHE, TAUX_SANS_RISQUE } from "../monde/projets-et-financement";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DE_LA_VALEUR } from "./la-valeur-et-le-temps";

/**
 * CHAPITRE : LE MARCHÉ FINANCIER, COURS, TAUX ET RISQUE (comptabilité générale, palier 4 ; DCG UE6
 * 3.4, et 4.3 pour le risque d'une action).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : NOVA n'est pas cotée ; son fournisseur de composants,
 * Électro-Composants Lyon, l'est (hypothèse du cours). Il émet une obligation verte ; ses actions
 * s'échangent en bourse. Les cours, les taux et le risque se calculent dans monde/marche-financier.ts,
 * sur le taux sans risque et la prime de risque de la fiche des projets de NOVA.
 *
 * L'objet : le marché financier, un financement direct. Son organisation (primaire et secondaire,
 * réglementé et de gré à gré), ses titres (dont les titres verts), ses indices et ses notations. Puis
 * la relation entre le taux actuariel du marché, le taux nominal et le cours d'une obligation ; le
 * cours d'une action par ses dividendes, et ce que les taux et l'information lui font. Enfin
 * l'espérance et l'écart-type de la rentabilité d'une action, le risque de marché et le risque
 * diversifiable (sans calcul du risque d'un portefeuille, comme le programme le limite).
 *
 * LES TEMPS DU CHAPITRE (l'esprit du cours : le cas simulé pas à pas, l'expérience avant la formule) :
 *   · guidé : intro, primaire-ou-secondaire, le-titre-vert, notation-et-indices, le-cours-a-l-emission
 *     (la formule est dans la question) ;
 *   · l'expérience avant la formule : predire-le-cours puis le-cours-quand-les-taux-bougent et
 *     le-laboratoire-de-l-obligation (le taux du marché, la durée restante ; un graphique du cours
 *     selon le taux) ; le-rendement-au-curseur avant le-rendement-actuariel ;
 *   · autonome : le-cours-de-l-action, esperance-et-variance, l-ecart-type ;
 *   · expert : l-information (ce qu'une annonce fait au cours), diversifier (le risque qui se
 *     diversifie et celui qui reste) ; puis la synthèse.
 *
 * MATIÈRE : le plan de cours du propriétaire pour la finance d'entreprise (« le marché financier :
 * marché primaire, secondaire, les organes de gestion, le marché obligataire, le marché des
 * actions ») et ses fiches d'analyse du risque (espérance et écart-type), adaptés au fournisseur de
 * NOVA.
 */

/** Les bornes du curseur du taux, en pour mille : de 4 % à 7 %. */
export const TAUX_DU_CURSEUR_DE_L_OBLIGATION = { min: 40, max: 70 } as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number, chiffres = 2) => `${(t * 100 + 0).toLocaleString("fr-FR", { maximumFractionDigits: chiffres })} %`;
/** Un nombre de points de pourcentage, déjà en pour cent. */
const pts = (x: number, chiffres = 2) => `${(x + 0).toLocaleString("fr-FR", { maximumFractionDigits: chiffres }).replace(/^-/, "−")} %`;
const nb = (x: number, chiffres = 6) => (x + 0).toLocaleString("fr-FR", { maximumFractionDigits: chiffres }).replace(/^-/, "−");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const donnee = (valeur: number | null, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, ...autres });
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });
/** Un nombre négatif entre parenthèses, pour qu'un « − » ne suive pas un « × ». */
const enCalcul = (x: number) => (x < 0 ? `(${pts(x)})` : pts(x));

const calcules = new Map<string, ReturnType<typeof calculerLeChapitre>>();

/** Tout ce que le chapitre demande, calculé une fois (la fiche est figée). */
export function marcheDuChapitre(c: Pick<Cas, "code">) {
  const deja = calcules.get(c.code);
  if (deja) return deja;
  const x = calculerLeChapitre();
  calcules.set(c.code, x);
  return x;
}

function calculerLeChapitre() {
  const o = OBLIGATION_VERTE;
  const plusTard = OBLIGATION_UN_AN_PLUS_TARD;
  const coursA = (taux: number) => coursDeLObligation(plusTard, taux);
  const rendement = rendementDeLObligation(plusTard, COURS_AFFICHE);
  const bas = Math.floor(rendement * 1000) / 1000;
  const haut = bas + 0.001;
  const interpole = bas + ((haut - bas) * (coursA(bas) - COURS_AFFICHE)) / (coursA(bas) - coursA(haut));
  return {
    o,
    plusTard,
    coupon: coupon(o),
    aLEmission: coursDeLObligation(o, o.tauxNominal),
    enHausse: coursA(UN_AN_PLUS_TARD.tauxEnHausse),
    enBaisse: coursA(UN_AN_PLUS_TARD.tauxEnBaisse),
    coursA,
    rendement,
    bas,
    haut,
    interpole,
    seuil: tauxQuiFaitPasserSous()!,
    action: coursDeLActionDuCas(),
    risque: risqueDeLAction(),
  };
}

/** Les compartiments du marché et ce qui s'y échange. */
export function tableauDuMarche(): TableauDeDonnees {
  return {
    titre: "Le marché financier, en quelques mots",
    colonnes: ["Ce que c'est"],
    lignes: [
      { libelle: "Marché primaire", valeurs: ["le marché du neuf : l'émetteur vend des titres nouveaux et reçoit l'argent"] },
      { libelle: "Marché secondaire", valeurs: ["le marché de l'occasion : les investisseurs s'échangent des titres déjà émis"] },
      { libelle: "Marché réglementé", valeurs: ["des règles d'admission, d'information et de cotation fixées par la loi, sous le contrôle de l'AMF"] },
      { libelle: "Gré à gré", valeurs: ["un échange négocié directement entre deux parties, hors des règles d'un marché organisé"] },
      { libelle: "Action", valeurs: ["une part du capital : un dividende, un droit de vote, aucun remboursement"] },
      { libelle: "Obligation", valeurs: ["une part d'un emprunt : un coupon fixé d'avance, un remboursement à l'échéance"] },
    ],
  };
}

/** L'espérance et la variance de la rentabilité de l'action, état par état, à compléter. */
export function grilleDuRisque(c: Pick<Cas, "code">): TableauACompleter {
  const x = marcheDuChapitre(c);
  const r = x.risque;
  const n = r.lignes.length;
  return {
    titre: `La rentabilité de l'action d'${EMETTEUR} dans un an`,
    colonnes: ["Probabilité", "Rentabilité", "Probabilité × rentabilité", "Probabilité × écart²"],
    lignes: [
      ...r.lignes.map((l, i) => ({
        libelle: l.libelle,
        cellules: [
          donnee(l.probabilite, { texte: nb(l.probabilite) }),
          donnee(l.r, { unite: "%", horsTotal: true }),
          i === 0 ? donnee(l.pondere, { unite: "%" }) : aSaisir(l.pondere, `${nb(l.probabilite)} × ${enCalcul(l.r)} = ${pts(l.pondere)}`, { unite: "%", indice: "la probabilité de l'état × sa rentabilité" }),
          i === 0
            ? donnee(l.carrePondere, { unite: "%²" })
            : aSaisir(l.carrePondere, `${nb(l.probabilite)} × (${pts(l.r)} − ${pts(r.esperance)})² = ${nb(l.probabilite)} × ${nb(l.ecart * l.ecart)} = ${nb(l.carrePondere)}`, { unite: "%²", indice: "la probabilité × le carré de l'écart à l'espérance" }),
        ],
      })),
      {
        libelle: "Total",
        fort: true,
        totalDe: { plus: Array.from({ length: n }, (_, i) => i) },
        cellules: [
          donnee(1, { texte: "1" }),
          donnee(null),
          aSaisir(r.esperance, `la somme de la colonne : l'espérance, ${pts(r.esperance)}`, { unite: "%" }),
          aSaisir(r.variance, `la somme de la colonne : la variance, ${nb(r.variance)}`, { unite: "%²" }),
        ],
      },
    ],
  };
}

export const LE_MARCHE_FINANCIER: Chapitre = {
  code: "le-marche-financier",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["DCG UE6 · Finance d'entreprise"],
  titre: "Le marché financier : cours, taux et risque",
  accroche:
    "Le fournisseur de NOVA est coté : il émet une obligation verte, ses actions s'échangent chaque jour. Quand les taux montent, son obligation baisse ; quand il perd un client, son action aussi. Lire un cours, en tirer un taux, mesurer un risque.",
  objectifs: [
    "Distinguer le marché primaire et le marché secondaire, le marché réglementé et le gré à gré, et les titres qui s'y échangent, dont les titres verts",
    "Calculer le cours d'une obligation au taux actuariel du marché, et le taux de rendement actuariel d'une obligation achetée à son cours",
    "Calculer le cours d'une action par l'actualisation de ses dividendes, et expliquer ses variations par les taux et l'information",
    "Calculer l'espérance et l'écart-type de la rentabilité d'une action, et distinguer le risque de marché du risque diversifiable",
  ],
  libre: false,
  prerequis: ["la-valeur-et-le-temps"],
  ensuite: ["arbitrer-les-couts-de-financement"],
  entreprises: {
    codes: ENTREPRISES_DE_LA_VALEUR,
    pourquoi: "le marché se lit ici par le fournisseur coté de NOVA dans la simulation du cours ; la méthode vaut pour tout titre.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un financement direct",
      notions: ["enterprise_value"],
      tableau: tableauDuMarche,
      texte: () => [
        "Une banque prête l'argent de ses déposants : elle s'interpose. Sur le marché financier, l'entreprise vend directement ses titres aux investisseurs : c'est un financement direct.",
        `NOVA est trop petite pour y aller. Son fournisseur, ${EMETTEUR}, y est coté. Ses titres disent à NOVA ce qu'exigent les prêteurs et les actionnaires d'une entreprise de son secteur.`,
        "Le marché a deux faces. Sur le marché primaire, l'entreprise lève des fonds. Sur le marché secondaire, les investisseurs revendent leurs titres : c'est ce qui les rend liquides, et ce qui leur donne un cours.",
      ],
      repere: () => "Primaire : l'émetteur lève des fonds. Secondaire : les titres changent de mains, l'émetteur ne reçoit rien. Action : du capital, un dividende. Obligation : une dette, un coupon et un remboursement.",
    },
    {
      id: "primaire-ou-secondaire",
      objectifs: [0],
      type: "choix",
      titre: "Primaire ou secondaire",
      notions: ["enterprise_value"],
      question: () =>
        `Le 1er janvier N+1, ${EMETTEUR} émet ses obligations vertes auprès d'investisseurs. Un an plus tard, un assureur en revend à une banque, sur Euronext Paris. Laquelle de ces opérations apporte de l'argent à l'émetteur ?`,
      options: () => [
        { texte: "L'émission, sur le marché primaire", juste: true, retour: "Oui. Seule l'émission finance l'entreprise. La revente se fait entre investisseurs : l'émetteur n'en reçoit rien, mais elle donne un prix à ses titres et rassure ceux qui veulent pouvoir sortir." },
        { texte: "La revente, puisqu'elle a lieu sur un marché réglementé", juste: false, retour: "La revente se fait sur le marché secondaire : l'argent va du banquier à l'assureur. Le marché réglementé est une organisation, pas un financement." },
        { texte: "Les deux : l'émetteur touche une part de chaque échange", juste: false, retour: "L'émetteur ne touche rien quand ses titres changent de mains : il a reçu l'argent une fois, à l'émission." },
      ],
    },
    {
      id: "le-titre-vert",
      objectifs: [0],
      type: "choix",
      titre: "Un titre vert",
      notions: ["csr_index"],
      question: () => `Qu'est-ce qui fait de l'obligation d'${EMETTEUR} une obligation verte ?`,
      options: () => [
        { texte: "L'usage de ses fonds, suivi et publié", juste: true, retour: "Oui. Une obligation verte finance des projets favorables à l'environnement, ici une usine moins émettrice. L'émetteur s'engage à suivre l'usage des fonds et à en rendre compte ; un label ou une revue externe le vérifie." },
        { texte: "Un coupon plus bas, que l'investisseur accepte par conviction", juste: false, retour: "Son coupon peut être un peu plus bas, mais ce n'est pas ce qui la définit : c'est l'affectation des fonds, suivie et publiée." },
        { texte: "L'activité de l'émetteur, qui doit être tout entière écologique", juste: false, retour: "Un émetteur de toute activité peut émettre une obligation verte, si les fonds vont à des projets verts. C'est le titre qui est vert, pas forcément l'entreprise." },
      ],
    },
    {
      id: "notation-et-indices",
      objectifs: [0],
      type: "choix",
      titre: "La notation et les indices",
      notions: ["enterprise_value"],
      question: () => `Une agence de notation a noté ${EMETTEUR} ${NOTATION_DE_L_EMETTEUR}. Que dit cette note à un investisseur ?`,
      options: () => [
        { texte: "Le risque que l'émetteur ne rembourse pas", juste: true, retour: `Oui. La note mesure le risque de crédit, depuis AAA, le plus sûr, jusqu'à D, le défaut. ${NOTATION_DE_L_EMETTEUR} est le bas de la catégorie « investissement » : un risque modéré, payé par un taux un peu plus haut que celui de l'État. Un indice, lui, comme le CAC 40, suit les cours d'un panier d'actions.` },
        { texte: "Le rendement que l'action rapportera l'an prochain", juste: false, retour: "Une note ne prédit pas un rendement : elle mesure la capacité de l'émetteur à payer ses dettes." },
        { texte: "La place de l'émetteur dans l'indice de son marché", juste: false, retour: "Un indice suit les cours d'un panier de titres ; il ne note personne. La note vient d'une agence, et porte sur le risque de crédit." },
      ],
    },
    {
      id: "le-cours-a-l-emission",
      objectifs: [1],
      type: "montants",
      titre: "Le coupon et le pair",
      notions: ["discounting"],
      question: (c) => {
        const x = marcheDuChapitre(c);
        return `L'obligation a ${eur(x.o.nominal)} de nominal et un taux nominal de ${pct(x.o.tauxNominal)} ; elle est remboursée au pair dans ${x.o.dureeRestante} ans. Calculez son coupon annuel, puis son cours quand le marché exige ${pct(x.o.tauxNominal)} : coupon × (1 − (1 + r)^−n) ÷ r + nominal × (1 + r)^−n.`;
      },
      champs: (c) => {
        const x = marcheDuChapitre(c);
        return [
          { libelle: "Coupon annuel", attendu: x.coupon, calcul: `${eur(x.o.nominal)} × ${pct(x.o.tauxNominal)} = ${eur(x.coupon)}` },
          { libelle: "Cours au taux de marché de l'émission", attendu: x.aLEmission, calcul: `${eur(x.coupon)} × (1 − ${nb(1 + x.o.tauxNominal)}^−${x.o.dureeRestante}) ÷ ${nb(x.o.tauxNominal)} + ${eur(x.o.nominal)} × ${nb(1 + x.o.tauxNominal)}^−${x.o.dureeRestante} = ${eur(x.aLEmission)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const x = marcheDuChapitre(c);
        return [`Quand le marché exige exactement le taux nominal, l'obligation vaut son nominal, ${eur(x.o.nominal)} : elle est au pair. Le coupon, lui, ne bougera plus : il est écrit dans le contrat.`];
      },
    },
    {
      id: "predire-le-cours",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur le cours",
      notions: ["discounting"],
      question: (c) => {
        const x = marcheDuChapitre(c);
        return `Un an plus tard, les emprunteurs notés comme ${EMETTEUR} doivent offrir ${pct(UN_AN_PLUS_TARD.tauxEnHausse)} pour emprunter. L'obligation, elle, verse toujours ${eur(x.coupon)}. Son cours monte-t-il ou baisse-t-il ?`;
      },
      options: () => {
        const voir = "L'étape suivante le chiffre, puis le laboratoire fait jouer le taux.";
        return [
          { texte: "Il baisse", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Il monte, parce que les taux montent", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Il ne bouge pas : le coupon est fixe", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-cours-quand-les-taux-bougent",
      objectifs: [1],
      type: "montants",
      titre: "Le cours quand les taux bougent",
      notions: ["discounting"],
      question: (c) => {
        const x = marcheDuChapitre(c);
        return `Au 1er janvier N+2, il reste ${x.plusTard.dureeRestante} ans à l'obligation. Calculez son cours si le marché exige ${pct(UN_AN_PLUS_TARD.tauxEnHausse)}, puis s'il n'exige plus que ${pct(UN_AN_PLUS_TARD.tauxEnBaisse)}.`;
      },
      champs: (c) => {
        const x = marcheDuChapitre(c);
        const n = x.plusTard.dureeRestante;
        const calc = (t: number, v: number) => `${eur(x.coupon)} × (1 − ${nb(1 + t)}^−${n}) ÷ ${nb(t)} + ${eur(x.o.nominal)} × ${nb(1 + t)}^−${n} = ${eur(v)}`;
        return [
          { libelle: `Cours à ${pct(UN_AN_PLUS_TARD.tauxEnHausse)}`, attendu: x.enHausse, calcul: calc(UN_AN_PLUS_TARD.tauxEnHausse, x.enHausse), tolerance: 1 },
          { libelle: `Cours à ${pct(UN_AN_PLUS_TARD.tauxEnBaisse)}`, attendu: x.enBaisse, calcul: calc(UN_AN_PLUS_TARD.tauxEnBaisse, x.enBaisse), tolerance: 1 },
        ];
      },
      explication: (c) => {
        const x = marcheDuChapitre(c);
        return [
          `À ${pct(UN_AN_PLUS_TARD.tauxEnHausse)}, personne ne paierait ${eur(x.o.nominal)} un titre qui ne rapporte que ${eur(x.coupon)} : son cours tombe à ${eur(x.enHausse)}, jusqu'à ce que son rendement rejoigne celui du marché. À ${pct(UN_AN_PLUS_TARD.tauxEnBaisse)}, il monte à ${eur(x.enBaisse)}.`,
          "Le cours d'une obligation varie en sens inverse des taux du marché. C'est le risque de taux de celui qui doit revendre avant l'échéance.",
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-obligation",
      objectifs: [1],
      type: "simulation",
      titre: "Le laboratoire de l'obligation",
      notions: ["discounting"],
      question: () =>
        "Faites varier le taux du marché et la durée qui reste avant le remboursement. Le tableau suit le cours de l'obligation et son écart au pair ; le graphique trace le cours selon le taux. Relevez le défi.",
      leviers: (c) => {
        const x = marcheDuChapitre(c);
        const L = LEVIERS_DE_L_OBLIGATION;
        return [
          { code: "taux", libelle: "Taux actuariel du marché", unite: "%", ...L.taux, depart: x.o.tauxNominal * 100 },
          { code: "duree", libelle: "Durée restante", unite: "ans", ...L.duree, depart: x.plusTard.dureeRestante },
        ];
      },
      lecture: (c, p) => {
        const x = marcheDuChapitre(c);
        const cours = coursDeLObligation({ ...x.o, dureeRestante: p.duree! }, p.taux! / 100);
        return [
          { libelle: "Coupon annuel", montant: x.coupon },
          { libelle: "Cours de l'obligation", montant: cours, reference: x.o.nominal, fort: true },
          { libelle: "Écart au pair", montant: auCentime(cours - x.o.nominal), reference: 0, effet: true },
        ];
      },
      graphique: (c) => {
        const x = marcheDuChapitre(c);
        return {
          levier: "taux",
          courbes: [
            { libelle: "Cours de l'obligation", valeur: (p) => coursDeLObligation({ ...x.o, dureeRestante: p.duree! }, p.taux! / 100) },
            { libelle: "Nominal", valeur: () => x.o.nominal },
          ],
        };
      },
      defi: (c) => {
        const x = marcheDuChapitre(c);
        const pas = LEVIERS_DE_L_OBLIGATION.taux.pas;
        const n = x.plusTard.dureeRestante;
        const coursDe = (t: number) => coursDeLObligation({ ...x.o, dureeRestante: n }, t / 100);
        return {
          consigne: `Il reste ${n} ans. Trouvez le plus bas taux du marché, au pas de ${nb(pas)} point, auquel l'obligation cote sous ${eur(COURS_AFFICHE)}.`,
          atteint: (p) => p.duree === n && coursDe(p.taux!) < COURS_AFFICHE && coursDe(p.taux! - pas) >= COURS_AFFICHE,
          indice: (p) => {
            if (p.duree !== n) return `Le défi porte sur l'obligation à ${n} ans : remettez la durée à ${n}.`;
            if (coursDe(p.taux!) >= COURS_AFFICHE) return `À ce taux, elle cote encore ${eur(coursDe(p.taux!))} : montez le taux.`;
            return "Elle cote sous le seuil, mais un taux plus bas y suffit peut-être : descendez.";
          },
          solution: { taux: x.seuil, duree: n },
        };
      },
      explication: (c, p) => {
        const x = marcheDuChapitre(c);
        return [
          `Défi relevé : à ${pts(p.taux!)}, l'obligation à ${p.duree} ans cote ${eur(x.coursA(p.taux! / 100))}.`,
          `Faites jouer la durée : à ${pct(0.06)}, une obligation à 1 an perd peu, une obligation à 10 ans beaucoup plus. Plus l'échéance est loin, plus le cours est sensible aux taux.`,
        ];
      },
    },
    {
      id: "le-rendement-au-curseur",
      objectifs: [1],
      type: "curseur",
      titre: "Le rendement, au curseur",
      notions: ["irr_payback", "discounting"],
      question: (c) => {
        const x = marcheDuChapitre(c);
        return `Au 1er janvier N+2, l'obligation à ${x.plusTard.dureeRestante} ans se négocie ${eur(COURS_AFFICHE)}. Faites varier le taux d'actualisation, de ${TAUX_DU_CURSEUR_DE_L_OBLIGATION.min} ‰ à ${TAUX_DU_CURSEUR_DE_L_OBLIGATION.max} ‰. Placez le curseur sur le plus petit taux où le prix payé couvre la valeur actuelle des flux.`;
      },
      grandeur: () => ({ libelle: "Taux d'actualisation", unite: "‰" }),
      cible: (c) => {
        const x = marcheDuChapitre(c);
        return { attendu: Math.ceil(x.rendement * 1000), min: TAUX_DU_CURSEUR_DE_L_OBLIGATION.min, max: TAUX_DU_CURSEUR_DE_L_OBLIGATION.max };
      },
      zones: ["Le prix payé couvre les flux", "Les flux valent plus que le prix"],
      rates: () => ({
        dessous: "À ce taux, les coupons et le remboursement valent encore plus que le prix payé.",
        dessus: "À un taux plus bas, le prix couvre déjà les flux : cherchez le plus petit taux.",
      }),
      montrer: "Montrer le taux",
      lecture: (c, q) => {
        const x = marcheDuChapitre(c);
        return [
          { libelle: "Prix payé", montant: COURS_AFFICHE },
          { libelle: `Valeur actuelle des flux, à ${pct(q / 1000, 1)}`, montant: x.coursA(q / 1000), fort: true },
        ];
      },
      droites: (c) => {
        const x = marcheDuChapitre(c);
        return { produit: () => COURS_AFFICHE, cout: (q) => x.coursA(q / 1000), libelles: ["Prix payé", "Valeur actuelle des flux"] };
      },
      explication: (c) => {
        const x = marcheDuChapitre(c);
        return [`À ${pct(x.bas, 1)}, les flux valent encore ${eur(x.coursA(x.bas))} ; à ${pct(x.haut, 1)}, ${eur(x.coursA(x.haut))}. Le taux de rendement actuariel de l'acheteur est entre les deux, bien au-dessus du taux nominal.`];
      },
    },
    {
      id: "le-rendement-actuariel",
      objectifs: [1],
      type: "montants",
      titre: "Le taux de rendement actuariel",
      notions: ["irr_payback"],
      question: (c) => {
        const x = marcheDuChapitre(c);
        return `Calculez le cours de l'obligation à ${pct(x.bas, 1)} et à ${pct(x.haut, 1)}, puis, par interpolation linéaire, le taux de rendement actuariel d'un achat à ${eur(COURS_AFFICHE)}, en pour cent au centième.`;
      },
      champs: (c) => {
        const x = marcheDuChapitre(c);
        const a = x.coursA(x.bas);
        const b = x.coursA(x.haut);
        return [
          { libelle: `Cours à ${pct(x.bas, 1)}`, attendu: a, calcul: `la valeur actuelle des ${x.plusTard.dureeRestante} coupons et du nominal à ${pct(x.bas, 1)} = ${eur(a)}`, tolerance: 1 },
          { libelle: `Cours à ${pct(x.haut, 1)}`, attendu: b, calcul: `la valeur actuelle des ${x.plusTard.dureeRestante} coupons et du nominal à ${pct(x.haut, 1)} = ${eur(b)}`, tolerance: 1 },
          { libelle: "Taux de rendement actuariel, en %", attendu: auCentime(x.interpole * 100), calcul: `${pct(x.bas, 1)} + 0,1 point × (${eur(a)} − ${eur(COURS_AFFICHE)}) ÷ (${eur(a)} − ${eur(b)}) = ${pct(x.interpole)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = marcheDuChapitre(c);
        return [
          `Acheté ${eur(COURS_AFFICHE)} et gardé jusqu'au remboursement, le titre rapporte ${pct(x.rendement)} par an : ses coupons, plus les ${eur(x.o.nominal - COURS_AFFICHE)} gagnés au remboursement. Le taux nominal, ${pct(x.o.tauxNominal)}, ne sert qu'à calculer le coupon.`,
          "Trois taux à ne pas confondre : le taux nominal fixe le coupon ; le taux du marché fixe le cours ; le taux de rendement actuariel dit ce que rapporte un achat à ce cours.",
        ];
      },
    },
    {
      id: "le-cours-de-l-action",
      objectifs: [2],
      type: "montants",
      titre: "Le cours de l'action",
      notions: ["enterprise_value", "total_shareholder_return"],
      question: (c) => {
        const x = marcheDuChapitre(c);
        const a = x.action;
        return `À vous, sans formule cette fois. ${EMETTEUR} versera ${eur(a.dividende)} par action dans un an, puis un dividende en hausse de ${pct(a.croissance)} par an. Ses actionnaires exigent ${pct(a.exigee)}. Calculez le cours de l'action, puis ce cours si l'exigence montait d'un point avec les taux, puis si la croissance tombait à ${pct(CROISSANCE_APRES_L_ANNONCE)}.`;
      },
      champs: (c) => {
        const a = marcheDuChapitre(c).action;
        return [
          { libelle: "Cours de l'action", attendu: a.cours, calcul: `${eur(a.dividende)} ÷ (${pct(a.exigee)} − ${pct(a.croissance)}) = ${eur(a.cours)}` },
          { libelle: "Cours si l'exigence monte d'un point", attendu: a.apresLaHausse, calcul: `${eur(a.dividende)} ÷ (${pct(a.exigee + HAUSSE_DES_TAUX)} − ${pct(a.croissance)}) = ${eur(a.apresLaHausse)}`, tolerance: 0.01 },
          { libelle: "Cours si la croissance tombe", attendu: a.apresLAnnonce, calcul: `${eur(a.dividende)} ÷ (${pct(a.exigee)} − ${pct(CROISSANCE_APRES_L_ANNONCE)}) = ${eur(a.apresLAnnonce)}` },
        ];
      },
      explication: (c) => {
        const a = marcheDuChapitre(c).action;
        return [
          `L'action vaut la valeur actuelle de ses dividendes futurs : ${eur(a.cours)}. Son exigence, ${pct(a.exigee)}, est celle du MEDAF : ${pct(TAUX_SANS_RISQUE)} sans risque, plus ${nb(a.beta)} × ${pct(PRIME_DE_RISQUE_DU_MARCHE)} de prime.`,
          `Un point de taux de plus, et l'action perd ${pct(1 - a.apresLaHausse / a.cours, 1)} de sa valeur. Une croissance plus faible, et elle tombe à ${eur(a.apresLAnnonce)}. Les taux et les perspectives font les cours.`,
        ];
      },
    },
    {
      id: "l-information",
      objectifs: [2],
      type: "choix",
      titre: "Ce que fait une information",
      notions: ["enterprise_value"],
      question: () => {
        return `Un matin, ${EMETTEUR} annonce la perte de son plus gros client. Avant même l'ouverture, les analystes ramènent la croissance attendue du dividende à ${pct(CROISSANCE_APRES_L_ANNONCE)}. Que fait le cours, et quand ?`;
      },
      options: (c) => {
        const a = marcheDuChapitre(c).action;
        return [
          { texte: `Il tombe vers ${eur(a.apresLAnnonce)} dès l'annonce`, juste: true, retour: `Oui. Sur un marché efficient, le cours intègre une information dès qu'elle est publique : personne ne paie plus ${eur(a.cours)} une action qui n'en vaut plus que ${eur(a.apresLAnnonce)}. C'est pourquoi un émetteur coté doit publier vite et à tous ce qui peut changer son cours.` },
          { texte: "Il ne bouge pas avant les comptes de l'année, qui seuls font foi", juste: false, retour: "Le cours n'attend pas les comptes : il se forme sur ce que les investisseurs attendent des dividendes futurs, et change dès que l'attente change." },
          { texte: "Il ne bouge pas : le dividende de l'an prochain est maintenu", juste: false, retour: "Le cours ne dépend pas d'un seul dividende, mais de tous ceux qui suivent : une croissance plus faible les réduit tous." },
        ];
      },
    },
    {
      id: "esperance-et-variance",
      objectifs: [3],
      type: "a-completer",
      titre: "L'espérance et la variance",
      notions: ["total_shareholder_return"],
      question: () =>
        "Dans un an, l'économie peut être en récession, ordinaire ou en expansion, et l'action rapporter, dividende et plus-value compris, la rentabilité de chaque ligne. Complétez le tableau : l'espérance est la somme des probabilités × rentabilités ; la variance, la somme des probabilités × écarts au carré. La première ligne est faite.",
      grille: grilleDuRisque,
      explication: (c) => {
        const r = marcheDuChapitre(c).risque;
        return [
          `L'espérance, ${pts(r.esperance)}, est la rentabilité moyenne qu'on peut attendre de l'action ; c'est aussi ce qu'exigent ses actionnaires. La variance, ${nb(r.variance)}, mesure la dispersion autour d'elle, en pour cent au carré : on lui préfère sa racine, l'écart-type.`,
        ];
      },
    },
    {
      id: "l-ecart-type",
      objectifs: [3],
      type: "montants",
      titre: "L'écart-type",
      notions: ["total_shareholder_return"],
      question: (c) => {
        const r = marcheDuChapitre(c).risque;
        return `Calculez l'écart-type de la rentabilité, racine de la variance (${nb(r.variance)}), en pour cent au centième, puis la fourchette où la rentabilité tombe le plus souvent : l'espérance moins un écart-type, et plus un écart-type.`;
      },
      champs: (c) => {
        const r = marcheDuChapitre(c).risque;
        const s = auCentime(r.ecartType);
        return [
          { libelle: "Écart-type, en %", attendu: s, calcul: `√${nb(r.variance)} = ${pts(s)}`, tolerance: 0.01 },
          { libelle: "Espérance moins un écart-type, en %", attendu: auCentime(r.esperance - s), calcul: `${pts(r.esperance)} − ${pts(s)} = ${pts(auCentime(r.esperance - s))}`, tolerance: 0.01 },
          { libelle: "Espérance plus un écart-type, en %", attendu: auCentime(r.esperance + s), calcul: `${pts(r.esperance)} + ${pts(s)} = ${pts(auCentime(r.esperance + s))}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const r = marcheDuChapitre(c).risque;
        return [
          `L'action promet ${pts(r.esperance)} en moyenne, avec un écart-type de ${pts(auCentime(r.ecartType))} : une année sur quatre, elle perd ${pts(-r.pire)}. Le compte à terme de NOVA rapporte ${pct(PLACEMENT_SANS_RISQUE)}, avec un écart-type nul.`,
          "La prime de l'action sur le placement sûr paie ce risque : plus l'écart-type est grand, plus l'investisseur exige.",
        ];
      },
    },
    {
      id: "diversifier",
      objectifs: [3],
      type: "choix",
      titre: "Le risque qui se diversifie",
      notions: ["total_shareholder_return"],
      question: () =>
        `Une associée de NOVA détient des actions d'${EMETTEUR}. Elle en vend la moitié pour acheter des actions de 20 entreprises d'autres secteurs. Quel risque réduit-elle ainsi ?`,
      options: () => [
        { texte: "Le risque propre à chaque entreprise", juste: true, retour: "Oui. La perte d'un client, une grève, un procès touchent une entreprise ; dans un portefeuille de 20, ces coups se compensent : c'est le risque diversifiable, ou spécifique. Une récession, une hausse des taux touchent toutes les actions : c'est le risque de marché, qu'aucune diversification n'efface." },
        { texte: "Le risque de marché, puisqu'elle sort d'un seul secteur", juste: false, retour: "Le risque de marché, une récession, une hausse générale des taux, touche toutes les actions à la fois : changer de secteur ne l'efface pas." },
        { texte: "Tous les risques : 20 entreprises ne peuvent pas baisser ensemble", juste: false, retour: "Elles peuvent baisser ensemble, et le font dans une récession : c'est le risque de marché. La diversification n'enlève que le risque propre à chaque entreprise." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["discounting", "irr_payback", "total_shareholder_return"],
      texte: (c) => {
        const x = marcheDuChapitre(c);
        return [
          "Vous avez situé le marché financier : un financement direct, primaire quand l'émetteur lève des fonds, secondaire quand les titres changent de mains ; ses obligations vertes, ses notes, ses indices.",
          `Vous avez calculé le cours d'une obligation selon le taux du marché, ${eur(x.enHausse)} à ${pct(UN_AN_PLUS_TARD.tauxEnHausse)}, et le rendement d'un achat à ${eur(COURS_AFFICHE)}, ${pct(x.rendement)}. Celui d'une action par ses dividendes, ${eur(x.action.cours)}.`,
          `Vous avez mesuré le risque de l'action : ${pts(x.risque.esperance)} d'espérance, ${pts(auCentime(x.risque.ecartType))} d'écart-type, et distingué le risque que la diversification efface de celui qui reste. Au niveau de l'examen, vous savez lire un cours.`,
          "Dans l'arène, les chiffres de votre entreprise seront différents : la démarche, elle, est la même.",
        ];
      },
      repere: () =>
        "Cours d'une obligation = Σ coupons et nominal actualisés au taux du marché : il baisse quand les taux montent. Cours d'une action = D1 ÷ (k − g). Espérance = Σ p × r ; écart-type = √(Σ p × (r − E)²). La diversification efface le risque spécifique, pas le risque de marché.",
    },
  ],
};
