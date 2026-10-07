/**
 * LES CHAMBRES VENDUES DEUX FOIS — le contenu de l'épisode.
 *
 * Lucile Fabbri est revenue manager du Groupe Escale, au siège d'Annecy :
 * elle fixe les prix et la surréservation des huit hôtels. De septembre à
 * novembre, salons et congrès remplissent les hôtels certains soirs, et les
 * clients qui ne viennent pas laissent des chambres qu'on ne revendra jamais.
 * Les directeurs, eux, détestent déloger un client. Six décisions, chacune
 * précédée de ce qu'une revenue manager reçoit vraiment.
 *
 * Les chiffres que les sources donnent sont tirés des constantes du modèle :
 * ce que le joueur lit est ce que la simulation calcule.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import {
  AVIS,
  CLIENT,
  CONGRES,
  COUT_DELOGEMENT_FIDELE,
  COUT_DELOGEMENT_PASSAGE,
  CV,
  CV_NUITEE,
  DEFECTION,
  DEFECTION_CONGRES,
  DEFECTION_NOVEMBRE,
  DELOGEMENT,
  ENCAISSE,
  EXCES,
  GARANTIES,
  HOTELS,
  MODULE_HOSTEO,
  NOVEMBRE,
  SARVELEC,
  SOIRS,
  SOIR_DE_REFERENCE,
  TAUX_REFERENCE,
  auPlus,
  coutAttendu,
  coutDeDelogement,
  margeDUneNuitee,
  mixDuSoir,
  tauxDuSoir,
  tauxMoyen,
  type HotelId,
} from "@/engine/episodes/surreservation";
import { euros, kE, nombre } from "./format";
import type { Etape } from "./types";

/** Un pourcentage sans décimale inutile : « 16 % », « 10,6 % ». */
export const pc = (v: number) => `${nombre(v * 100, 1)} %`;

const ISALINE = { de: "Isaline Perraud", role: "Directrice générale du Groupe Escale" } as const;
const PASCALINE = { de: "Pascaline Domenge", role: "Directrice, L'Escale Annecy-Centre" } as const;
const ANA = { de: "Ana Sousa", role: "Directrice, L'Escale Chambéry-Gare" } as const;
const ROMUALD = { de: "Romuald Aubertin", role: "Directeur, L'Escale Annemasse" } as const;
const ROMY = { de: "Romy Castellane", role: "Directrice, L'Escale Lac" } as const;
const ILSE = { de: "Ilse Montmasson", role: "Contrôleuse de gestion du groupe" } as const;
const SATURNIN = { de: "Saturnin Ilunga", role: "Réceptionniste de nuit, Chambéry-Gare" } as const;
const PALOMA = {
  de: "Paloma Iriarte",
  role: "Responsable commerciale affaires et groupes",
} as const;
const OTTILIE = { de: "Ottilie Dunand", role: "Responsable des déplacements, Sarvélec" } as const;
const JOSQUIN = { de: "Josquin Covarel", role: "Bureau d'hébergement du congrès" } as const;
const TABLEAU = {
  de: "Tableau de bord du revenue management",
  role: "Point hebdomadaire",
} as const;

const H = HOTELS;
/** Le taux de défection d'un hôtel un soir complet ordinaire, selon l'historique. */
export const tauxHotel = (h: HotelId) => tauxMoyen(H[h].mix, DEFECTION);
/** Les chambres que les défections libèrent en moyenne, sans surréservation. */
export const videsMoyennes = (h: HotelId) => tauxHotel(h) * H[h].chambres;
/** La marge perdue d'une chambre vide, un soir complet ordinaire. */
export const margeHotel = (h: HotelId) => margeDUneNuitee(H[h], "normal");

/** Le soir du salon de la semaine 3 à Chambéry-Gare : la répartition des défections sur 72 réservations. */
export const TABLE_REFERENCE = [3, 4, 5, 6, 7, 8, 9].map((k) => ({
  k,
  p: auPlus(k, H[SOIR_DE_REFERENCE.hotel].chambres, TAUX_REFERENCE),
}));
/** Le seuil de la règle : marge ÷ (marge + coût d'un délogement de passage). */
export const SEUIL_REFERENCE =
  margeHotel("chambery") / (margeHotel("chambery") + COUT_DELOGEMENT_PASSAGE);

/** Les chambres vides et la marge que les défections laisseraient sans surréservation, sur tout l'automne. */
export const VIDES_AUTOMNE = SOIRS.reduce(
  (t, s) => t + H[s.hotel].chambres * tauxMoyen(mixDuSoir(H[s.hotel], s), tauxDuSoir(s)),
  0,
);
export const MARGE_VIDE_AUTOMNE = SOIRS.reduce(
  (t, s) =>
    t +
    H[s.hotel].chambres *
      tauxMoyen(mixDuSoir(H[s.hotel], s), tauxDuSoir(s)) *
      margeDUneNuitee(H[s.hotel], s.type),
  0,
);
/** Le coût moyen d'un délogement au dernier arrivé, à Chambéry-Gare. */
export const COUT_DERNIER_ARRIVE = coutAttendu(coutDeDelogement(0, H.chambery, "normal"));
/** Le délogement d'un client de passage quand toute la ville est pleine. */
export const COUT_VILLE_PLEINE = coutAttendu(coutDeDelogement(1, H.annecy, "plein"));
const CONFRERE = DELOGEMENT.confrere + DELOGEMENT.taxi + DELOGEMENT.geste;
const CONFRERE_PLEIN = DELOGEMENT.confrerePlein + DELOGEMENT.taxiPlein + DELOGEMENT.gestePlein;
const FIDELE_PERTE = CLIENT.perteFidele * CLIENT.valeurFidele;
const PASSAGE_PERTE = CLIENT.pertePassage * CLIENT.valeurPassage;
/** Le taux de défection d'un soir de salon de novembre à Chambéry-Gare, selon la garantie. */
export const tauxNovembre = (garantie: number) =>
  tauxMoyen(H.chambery.mixNovembre!, DEFECTION_NOVEMBRE, GARANTIES[garantie]);
export const tauxOctobre = (garantie: number) =>
  tauxMoyen(H.chambery.mix, DEFECTION, GARANTIES[garantie]);
/** Les défections d'un soir du congrès, selon la garantie. */
export const tauxCongres = (h: "annecy" | "lac", garantie: number) =>
  tauxMoyen(H[h].mixPlein!, DEFECTION_CONGRES, GARANTIES[garantie]);

export const DIAGNOSTICS = [
  {
    id: "arbitrage",
    t: "Une chambre vide et un client délogé ont chacun un coût : le bon niveau de surréservation se calcule en les comparant, hôtel par hôtel, selon les défections de chaque segment",
  },
  {
    id: "defections",
    t: "Les défections des clients d'affaires sans garantie vident des chambres chaque soir de salon : c'est là que le groupe perd sa marge",
  },
  {
    id: "image",
    t: "Déloger un client abîme la réputation du groupe : le vrai risque, c'est la surréservation elle-même",
  },
  {
    id: "prix",
    t: "Les soirs de congrès sont vendus trop bon marché : c'est le prix moyen qu'il faut relever",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Une politique avant le premier salon",
    jusqua: 2,
    messages: () => [
      {
        ...ISALINE,
        heure: "08:10",
        alerte: true,
        texte:
          "Lucile, l'automne commence : de septembre à novembre, les salons de Chambéry et de Genève, les mariages d'Évian, la saison des cures à Aix, le congrès national d'Annecy en octobre. Jusqu'ici, chaque directeur fait comme il l'entend, et la plupart ne surréservent pas. Je veux une politique de surréservation pour tout le groupe avant le premier soir complet.",
      },
      {
        ...PASCALINE,
        heure: "08:45",
        texte:
          "Je le redis : chez moi, on ne déloge pas. Un client qui a réservé a sa chambre. Quelques chambres vides, c'est le prix de notre réputation.",
      },
      {
        ...ROMUALD,
        heure: "09:20",
        texte:
          "Les soirs de salon à Genève, des réservations d'entreprise ne viennent pas, sans prévenir et sans payer. Je finis avec sept ou huit chambres vides, après avoir refusé du monde à 17 heures.",
      },
      {
        ...ILSE,
        heure: "09:50",
        texte: `Un ordre de grandeur : sur un calendrier comme celui de cet automne, sans surréservation, les défections laisseraient environ ${nombre(Math.round(VIDES_AUTOMNE / 10) * 10, 0)} chambres vides les soirs complets, soit à peu près ${kE(MARGE_VIDE_AUTOMNE)} de marge.`,
      },
    ],
    budget: 5,
    sources: [
      {
        id: "defections",
        titre: "Extraire de Hostéo les défections des soirs complets, segment par segment",
        cout: 1,
        nature: "decisive",
        resultat: `Sur les deux derniers automnes, en septembre et en octobre, la part des réservations qui ne se présentent pas ou annulent trop tard pour être revendues : tarif non remboursable ${pc(DEFECTION.nr)} (la nuit est payée quand même), réservations garanties par carte ${pc(DEFECTION.carte)} (la nuit est facturée, et recouvrée dans ${pc(ENCAISSE.carte)} des cas), tarifs d'entreprise sans garantie ${pc(DEFECTION.affaires)}, groupes ${pc(DEFECTION.groupe)}, curistes ${pc(DEFECTION.cure)}. Selon le mélange de clients, cela fait ${pc(tauxHotel("annemasse"))} à Annemasse, ${pc(tauxHotel("chambery"))} à Chambéry-Gare, ${pc(tauxHotel("annecy"))} à Annecy-Centre, ${pc(tauxHotel("albertville"))} à Albertville, ${pc(tauxHotel("lac"))} au Lac, ${pc(tauxHotel("evian"))} à Évian et ${pc(tauxHotel("aix"))} à Aix-les-Bains. Un soir de salon à Chambéry-Gare, sur ${H.chambery.chambres} réservations, la probabilité d'avoir au plus ${TABLE_REFERENCE.map((x, i) => `${x.k}${i === 0 ? " défections" : ""} : ${pc(Math.round(x.p * 100) / 100)}`).join(" ; au plus ")}.`,
      },
      {
        id: "couts",
        titre: "Chiffrer avec Ilse ce que coûtent une chambre vide et un délogement",
        cout: 1,
        nature: "decisive",
        resultat: `Une chambre vide un soir de salon à Chambéry-Gare, c'est ${H.chambery.prix.normal} € de prix moyen moins ${CV} € de coût variable (linge ${CV_NUITEE.linge} €, produits d'accueil ${CV_NUITEE.accueil} €, énergie ${CV_NUITEE.energie} €, ménage ${CV_NUITEE.menage} €) : ${margeHotel("chambery")} € de marge perdue ; ${margeHotel("annecy")} € à Annecy-Centre, ${margeHotel("lac")} € au Lac, ${margeHotel("evian")} € à Évian. Un délogement chez un confrère : la nuit ${DELOGEMENT.confrere} €, le taxi ${DELOGEMENT.taxi} €, un geste au retour ${DELOGEMENT.geste} €, soit ${CONFRERE} €. Il faut y ajouter ce que le client emporte : un client de passage délogé ne revient pas dans ${pc(CLIENT.pertePassage)} des cas, avec ${CLIENT.valeurPassage} € de marge à venir, soit ${PASSAGE_PERTE} € ; un client d'affaires fidèle part une fois sur cinq avec le compte de son entreprise, ${euros(CLIENT.valeurFidele)} de marge par an, soit ${FIDELE_PERTE} €. Un délogement coûte donc ${COUT_DELOGEMENT_PASSAGE} € pour un client de passage, ${euros(COUT_DELOGEMENT_FIDELE)} pour un fidèle. Aujourd'hui, la réception déloge le dernier arrivé.`,
      },
      {
        id: "historique",
        titre: "Revoir les soirs complets de l'an dernier, hôtel par hôtel",
        cout: 0.5,
        nature: "utile",
        resultat: `Sans surréservation, les défections libèrent en moyenne ${nombre(videsMoyennes("annemasse"))} chambres par soir de salon à Annemasse et ${nombre(videsMoyennes("chambery"))} à Chambéry-Gare. Ailleurs, beaucoup moins : ${nombre(videsMoyennes("lac"))} au Lac les week-ends de septembre, vendus surtout en non remboursable ; ${nombre(videsMoyennes("evian"))} à Évian les soirs de mariage, où les invités viennent en groupe ; ${nombre(videsMoyennes("aix"))} à Aix-les-Bains en pleine saison des cures, quand les curistes, là pour trois semaines, occupent la plupart des chambres.`,
      },
      {
        id: "ormea",
        titre: "Regarder ce que fait Orméa Hotels",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Orméa Hotels surréserve de 8 % dans tous ses hôtels de centre-ville, et le dit volontiers dans la presse professionnelle. Ses hôtels vendent surtout des tarifs flexibles en ligne ; ses taux de défection ne sont pas publiés.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Léontine Mugnier",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Léontine Mugnier, qui a tenu le revenue management d'Orméa Hotels à Lyon : « Ne surréserve pas de la moyenne des défections : une chambre vide et un client délogé n'ont pas le même prix. Ajoute une réservation tant que la probabilité qu'elle trouve une chambre libérée, multipliée par la marge, l'emporte sur la probabilité qu'elle fasse déloger quelqu'un, multipliée par ce que coûte le délogement. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Quelle politique de surréservation fixez-vous pour l'automne ?",
    options: [
      {
        t: "Ne pas surréserver : un client qui a réservé a sa chambre",
        d: "Les directeurs sont rassurés. Les chambres libérées par les défections restent vides.",
      },
      {
        t: "Surréserver de 5 % dans tous les hôtels, les soirs complets",
        d: `Une règle que toutes les réceptions comprennent : ${Math.round(0.05 * H.chambery.chambres)} chambres à Chambéry-Gare, ${Math.round(0.05 * H.lac.chambres)} au Lac, ${Math.round(0.05 * H.aix.chambres)} à Aix-les-Bains.`,
      },
      {
        t: "Calculer, hôtel par hôtel, le niveau où une réservation de plus risque davantage de coûter un délogement que de remplir une chambre vide",
        d: "Un tableau par hôtel, tenu par le revenue management et recalculé quand la garantie, les clients ou la règle de délogement changent.",
      },
      {
        t: "Surréserver, hôtel par hôtel, du nombre moyen de défections",
        d: `Ce qui se libère en moyenne : ${Math.round(videsMoyennes("chambery"))} chambres à Chambéry-Gare, ${Math.round(videsMoyennes("annemasse"))} à Annemasse, ${Math.round(videsMoyennes("evian"))} à Évian.`,
      },
    ],
    reactions: [
      [
        { ...PASCALINE, texte: "Merci. Mes réceptionnistes respirent." },
        {
          ...ROMUALD,
          texte: "Donc mes chambres vides des soirs de salon le resteront. C'est noté.",
        },
      ],
      [
        {
          ...ANA,
          texte: "Quatre chambres chez moi : simple à appliquer, je préviens l'équipe.",
        },
        {
          ...ROMY,
          texte:
            "Quatre au Lac, un week-end où presque tout le monde a payé d'avance ? On verra bien.",
        },
      ],
      [
        {
          ...ISALINE,
          texte:
            "Envoie-moi le tableau. Si les chiffres tiennent, je le défendrai devant les directeurs.",
        },
        { ...ROMUALD, texte: "Sept chambres à Annemasse les soirs de salon : enfin." },
      ],
      [
        {
          ...ANA,
          texte:
            "Sept chambres chez moi les soirs de salon. Mes veilleurs de nuit vont devoir apprendre à déloger.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Qui déloger ?",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...SATURNIN,
        heure: "23:40",
        alerte: true,
        texte:
          (ctx.deloges as number) > 0
            ? `Depuis le début du mois, ${ctx.deloges} client${(ctx.deloges as number) > 1 ? "s" : ""} délogé${(ctx.deloges as number) > 1 ? "s" : ""} dans le groupe, les derniers arrivés, comme on a toujours fait. Souvent des habitués qui sortent d'un dîner d'affaires. Mardi, le salon commence chez nous : quand il faudra déloger, qui je déloge ?`
            : ctx.surreserve
              ? "Mardi, le salon commence chez nous, et nous surréservons maintenant. Si quelqu'un doit dormir ailleurs, qui je déloge ? Jusqu'ici, c'est le dernier arrivé : souvent un habitué qui sort d'un dîner d'affaires."
              : "Mardi, le salon commence chez nous. Même sans surréservation, il arrive qu'on manque d'une chambre : un client prolonge, une chambre est hors service. Qui je déloge ? Jusqu'ici, c'est le dernier arrivé.",
      },
      {
        ...PASCALINE,
        heure: "09:00",
        texte: "Si on doit déloger quelqu'un, je ne veux pas que ce soit un de mes habitués.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Semaines 1 et 2 : ${ctx.vides} chambres vides par défection, ${ctx.deloges} client${(ctx.deloges as number) > 1 ? "s" : ""} délogé${(ctx.deloges as number) > 1 ? "s" : ""}. Taux d'occupation des soirs complets : ${ctx.to}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "arrivees",
        titre: "Regarder qui arrive après 21 heures les soirs complets",
        cout: 0.5,
        nature: "decisive",
        resultat: `À Chambéry-Gare et à Annemasse, ${pc(H.chambery.fideles)} des derniers arrivés sont des clients d'affaires fidèles ; ${pc(H.annecy.fideles)} à Annecy-Centre, ${pc(H.lac.fideles)} au Lac. Au dernier arrivé, un délogement coûte donc en moyenne ${COUT_DERNIER_ARRIVE} € à Chambéry-Gare. À 18 heures, Hostéo connaît chaque réservation du soir : les clients de passage (une nuit, loisirs ou affaires ponctuelles) occupent au moins le quart des chambres de chaque hôtel, bien plus que les délogements d'un soir. Choisi parmi eux et prévenu avant 19 heures, un client délogé coûte ${COUT_DELOGEMENT_PASSAGE} €, et part sans avoir fait la queue à la réception.`,
      },
      {
        id: "nosHotels",
        titre: "Chiffrer un délogement vers nos propres hôtels",
        cout: 0.5,
        nature: "utile",
        resultat: `Aix-les-Bains, Évian et Albertville ont presque toujours des chambres libres en semaine : la chambre ne coûte que ses ${CV} € de coût variable, mais le taxi fait ${DELOGEMENT.taxiNosHotels} €, et le client se retrouve à quarante minutes de son rendez-vous du lendemain. Envoyés si loin, les clients de passage ne reviennent pas dans ${pc(CLIENT.pertePassageLoin)} des cas, les fidèles partent dans ${pc(CLIENT.perteFideleLoin)} des cas.`,
      },
      {
        id: "volontaires",
        titre: "Demander aux réceptions si des clients accepteraient de partir",
        cout: 0.5,
        nature: "utile",
        resultat: `Avec un bon de ${DELOGEMENT.bonVolontaire} € sur un prochain séjour, les réceptions trouvent un volontaire ${nombre(DELOGEMENT.partVolontaires * 10, 0)} fois sur dix ; les autres fois, on revient au dernier arrivé.`,
      },
    ],
    question: "Quand il faut déloger, qui délogez-vous, et où ?",
    options: [
      {
        t: "Le dernier arrivé, chez le confrère qui a de la place, comme aujourd'hui",
        d: "La réception connaît la procédure. Rien à changer.",
      },
      {
        t: "Choisir à 18 heures des clients de passage, jamais un habitué, et les prévenir avant leur arrivée",
        d: `Une liste chaque soir complet, un appel, la chambre chez un confrère et le taxi payés : ${CONFRERE} € par client.`,
      },
      {
        t: "Déloger vers nos propres hôtels d'Aix-les-Bains, d'Évian et d'Albertville",
        d: `La chambre ne coûte que son coût variable ; le taxi est plus long : ${DELOGEMENT.taxiNosHotels} €.`,
      },
      {
        t: `Proposer un bon de ${DELOGEMENT.bonVolontaire} € aux clients qui acceptent de partir`,
        d: "Un volontaire six fois sur dix ; sinon, le dernier arrivé.",
      },
    ],
    reactions: [
      [{ ...SATURNIN, texte: "D'accord. Je continue comme avant." }],
      [
        {
          ...SATURNIN,
          texte:
            "À 18 heures, j'imprime la liste des clients de passage et j'appelle le confrère. Les habitués ne s'apercevront de rien.",
        },
        { ...PASCALINE, texte: "Si mes habitués sont protégés, je peux vivre avec." },
      ],
      [
        {
          ...SATURNIN,
          texte: "J'appellerai Aix ou Albertville. Quarante minutes de taxi à minuit, ça va râler.",
        },
      ],
      [
        {
          ...SATURNIN,
          texte:
            "Je proposerai le bon au comptoir. Ceux qui sont pressés de dormir diront oui, les autres non.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Faut-il garantir les réservations ?",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...ROMUALD,
        heure: "10:30",
        alerte: true,
        texte:
          "Mardi, à Annemasse, des réservations d'entreprise ne sont pas venues, sans prévenir et sans rien payer. Avec une carte de garantie, on les aurait facturées. Je demande qu'on exige une garantie les soirs complets.",
      },
      {
        ...PALOMA,
        heure: "11:15",
        texte: `Attention à Sarvélec : ${SARVELEC.nuitees} nuitées par an à Annemasse, notre premier compte là-bas. Leur agence de voyages paie sur facture, sans carte, et ils détestent qu'on leur impose des conditions.`,
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Semaine 4 : depuis septembre, ${ctx.vides} chambres vides par défection, ${ctx.deloges} client${(ctx.deloges as number) > 1 ? "s" : ""} délogé${(ctx.deloges as number) > 1 ? "s" : ""}. Taux d'occupation des soirs complets : ${ctx.to}.`,
      },
    ],
    sources: [
      {
        id: "garanties",
        titre: "Comparer ce que font les garanties chez les hôtels qui les exigent",
        cout: 0.5,
        nature: "decisive",
        resultat: `Avec une carte de garantie exigée de tous, comptes compris, les défections des tarifs d'entreprise passent de ${pc(DEFECTION.affaires)} à ${pc(DEFECTION.affaires * GARANTIES[1]!.defection.affaires)} ; la nuit est facturée, mais on n'en recouvre que ${pc(GARANTIES[1]!.encaisse.affaires)} : des entreprises contestent, et l'on renonce pour garder le compte. ${pc(1 - GARANTIES[1]!.demande.affaires)} des réservations d'entreprise partent ailleurs, faute de carte. Avec une carte pour les clients de passage et une garantie société (un engagement écrit de payer les no-shows) pour les comptes : ${pc(DEFECTION.affaires * GARANTIES[2]!.defection.affaires)} de défections, ${pc(GARANTIES[2]!.encaisse.affaires)} recouvrés, ${pc(1 - GARANTIES[2]!.demande.affaires)} de réservations perdues. Avec un acompte de 30 % pour tous : ${pc(DEFECTION.affaires * GARANTIES[3]!.defection.affaires)} de défections d'entreprise et ${pc(DEFECTION.carte * GARANTIES[3]!.defection.carte)} sur les réservations par carte, l'acompte gardé quand le client ne vient pas ; mais ${pc(1 - GARANTIES[3]!.demande.affaires)} des réservations d'entreprise et ${pc(1 - GARANTIES[3]!.demande.carte)} des autres partent ailleurs. Les soirs complets, la demande dépasse les chambres de ${pc(EXCES.normal)} à ${pc(EXCES.normal + EXCES.ecart)}.`,
      },
      {
        id: "sarvelec",
        titre: "Appeler Ottilie Dunand, responsable des déplacements de Sarvélec",
        cout: 0.5,
        nature: "decisive",
        resultat: `Ottilie : « Notre agence paie tout sur facture mensuelle : pas de carte, c'est la règle du groupe. Une garantie société, je peux la signer. Une carte, ou un acompte, je ne promets rien : nos sites de la vallée de l'Arve ont déjà changé d'hôtel pour moins que ça. » Paloma estime le risque à une chance sur ${Math.round(1 / GARANTIES[1]!.risqueSarvelec)} avec une carte, une sur ${Math.round(1 / GARANTIES[3]!.risqueSarvelec)} avec un acompte. Sarvélec, c'est ${SARVELEC.nuitees} nuitées par an à Annemasse, ${kE(SARVELEC.valeur)} de marge.`,
      },
      {
        id: "comptes",
        titre: "Demander aux commerciaux ce que disent les comptes d'entreprise",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les grands comptes signent une garantie société sans discuter : c'est une ligne de plus dans leur contrat. La carte passe chez les PME et les clients de passage, pas toujours chez les entreprises qui paient sur facture.",
      },
    ],
    question: "Que faites-vous des garanties de réservation, les soirs complets ?",
    options: [
      {
        t: "Ne rien changer : les tarifs d'entreprise restent annulables jusqu'à 18 heures le jour même",
        d: "Les comptes sont contents. Les no-shows ne paient rien.",
      },
      {
        t: "Exiger une carte de garantie pour toutes les réservations des soirs complets, comptes compris",
        d: "Les no-shows sont facturés. Des entreprises qui paient sur facture iront ailleurs.",
      },
      {
        t: "Exiger une carte des clients de passage, et une garantie société écrite des comptes d'entreprise",
        d: "Deux procédures à tenir. Les comptes s'engagent par écrit à payer leurs no-shows.",
      },
      {
        t: "Exiger un acompte de 30 % à la réservation, pour tous les clients des soirs complets",
        d: "Plus de no-show gratuit. L'acompte est rendu si l'on annule plus de sept jours avant.",
      },
    ],
    reactions: [
      [{ ...ROMUALD, texte: "Alors on continuera de compter les chambres vides le matin." }],
      null,
      [
        {
          ...OTTILIE,
          texte:
            "Une garantie société, c'est dans nos règles. Je vous la renvoie signée demain. Rien ne change pour nos voyageurs.",
        },
        { ...ROMUALD, texte: "Les cartes pour les clients de passage partent dès lundi." },
      ],
      null,
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Le congrès national d'Annecy",
    jusqua: 8,
    messages: () => [
      {
        ...JOSQUIN,
        heure: "09:30",
        alerte: true,
        texte: `Le congrès national de kinésithérapie ouvre mardi : 2 800 inscrits, ${CONGRES.soirs} nuits. Notre bureau a réservé plus de la moitié des chambres d'Annecy-Centre et du Lac ; il n'y a plus une chambre libre en ville.`,
      },
      {
        ...ROMY,
        heure: "10:10",
        texte:
          "Une demande pareille, on ne la reverra pas avant l'an prochain. Surréservons davantage : tout ce qui se libère sera repris.",
      },
      {
        ...PASCALINE,
        heure: "10:40",
        texte:
          "Et si l'on doit déloger cette semaine-là, on envoie les gens où ? Il n'y a plus rien à Annecy.",
      },
    ],
    sources: [
      {
        id: "villePleine",
        titre: "Chiffrer un délogement quand toute la ville est pleine",
        cout: 0.5,
        nature: "decisive",
        resultat: `Plus un confrère libre à Annecy : la dernière chambre est à Aix-les-Bains, ${DELOGEMENT.confrerePlein} € au prix de dernière minute, ${DELOGEMENT.taxiPlein} € de taxi, ${DELOGEMENT.gestePlein} € de geste, soit ${CONFRERE_PLEIN} €. Envoyé à quarante-cinq minutes, un client de passage ne revient pas dans ${pc(CLIENT.pertePassageLoin)} des cas, soit ${nombre(CLIENT.pertePassageLoin * CLIENT.valeurPassage, 0)} € : ${COUT_VILLE_PLEINE} € par délogement, contre ${COUT_DELOGEMENT_PASSAGE} € un soir ordinaire. Les prix moyens montent aussi : ${H.annecy.prix.plein} € à Annecy-Centre, ${H.lac.prix.plein} € au Lac.`,
      },
      {
        id: "inscrits",
        titre: "Regarder qui dormira à l'hôtel pendant le congrès",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Les congressistes ont leur chambre comprise dans l'inscription : ${pc(DEFECTION_CONGRES.groupe)} de défections. Avec la garantie en vigueur, les défections de ces soirs-là tombent à ${pc(tauxCongres("annecy", ctx.garantie as number))} à Annecy-Centre et ${pc(tauxCongres("lac", ctx.garantie as number))} au Lac, contre ${pc(tauxMoyen(H.annecy.mix, DEFECTION, GARANTIES[ctx.garantie as number]))} et ${pc(tauxMoyen(H.lac.mix, DEFECTION, GARANTIES[ctx.garantie as number]))} un soir complet ordinaire.`,
      },
      {
        id: "bureau",
        titre: "Appeler le bureau d'hébergement du congrès",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Josquin Covarel : « La liste des congressistes vous arrive trois jours avant. Ils viennent pour les conférences du matin : aucun n'acceptera de dormir à Aix-les-Bains. »",
      },
    ],
    question: "Quelle surréservation pour les soirs du congrès ?",
    options: [
      {
        t: "Garder la surréservation habituelle de ces hôtels",
        d: "Le niveau des soirs complets ordinaires.",
      },
      {
        t: "Surréserver davantage : jamais la demande n'a été aussi forte",
        d: "Trois réservations de plus par soir et par hôtel.",
      },
      {
        t: "Recalculer pour ces quatre soirs, avec les défections des congressistes et le coût d'un délogement à Aix-les-Bains",
        d: "Un niveau à part pour le congrès, hôtel par hôtel.",
      },
      {
        t: "Ne pas surréserver du tout pendant le congrès",
        d: "Aucun délogement possible. Les défections laisseront quelques chambres vides.",
      },
    ],
    reactions: [
      [{ ...PASCALINE, texte: "Comme d'habitude, donc. Espérons que tout le monde vienne." }],
      [
        {
          ...ROMY,
          texte: "Parfait. Trois de plus chaque soir : avec une demande pareille, ça passera.",
        },
      ],
      [
        {
          ...PASCALINE,
          texte:
            "Un niveau à part pour le congrès, je comprends. J'ai réservé d'avance deux taxis pour Aix, au cas où.",
        },
      ],
      [{ ...PASCALINE, texte: "Enfin une semaine sans délogement. Je préviens mon équipe." }],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Novembre et ses salons",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...PALOMA,
        heure: "09:00",
        alerte: true,
        texte: `Novembre, ce sont les salons professionnels à Chambéry et à Annemasse : ${pc(H.chambery.mixNovembre!.affaires)} de clients d'affaires, et des entreprises qui désinscrivent leurs collaborateurs la veille au soir.`,
      },
      {
        ...ILSE,
        heure: "11:20",
        texte: `J'ai les chiffres de septembre et d'octobre : ${ctx.tauxConstate} des réservations des soirs complets ont fait défection, pour ${ctx.tauxAttendu} attendus d'après l'historique et la garantie en vigueur.`,
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Semaine 8 : depuis septembre, ${ctx.vides} chambres vides par défection, ${ctx.deloges} client${(ctx.deloges as number) > 1 ? "s" : ""} délogé${(ctx.deloges as number) > 1 ? "s" : ""}. Marge des soirs complets : ${ctx.marge}.`,
      },
    ],
    sources: [
      {
        id: "constat",
        titre: "Comparer les défections de cet automne et celles des salons de novembre",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Depuis septembre, ${ctx.tauxConstate} des réservations des soirs complets ont fait défection, pour ${ctx.tauxAttendu} attendus : un automne ${ctx.ecartAutomne}. Les salons de novembre de l'an dernier : ${pc(DEFECTION_NOVEMBRE.affaires)} de défections sur les tarifs d'entreprise sans garantie, ${pc(DEFECTION_NOVEMBRE.carte)} sur les réservations par carte, et ${pc(H.chambery.mixNovembre!.affaires)} de clients d'affaires à Chambéry-Gare et à Annemasse, contre ${pc(H.chambery.mix.affaires)} en octobre. Avec la garantie en vigueur, un soir de salon de novembre à Chambéry-Gare compte ${pc(tauxNovembre(ctx.garantie as number))} de défections, contre ${pc(tauxOctobre(ctx.garantie as number))} en octobre.`,
      },
      {
        id: "module",
        titre: "Écouter la démonstration du module de surréservation de Hostéo",
        cout: 0.5,
        nature: "utile",
        resultat: `Le module surréserve automatiquement du taux moyen de défection de l'année, ${pc(MODULE_HOSTEO.taux)}, dans tous les hôtels : ${Math.round(MODULE_HOSTEO.taux * H.chambery.chambres)} chambres à Chambéry-Gare, ${Math.round(MODULE_HOSTEO.taux * H.annemasse.chambres)} à Annemasse. ${euros(MODULE_HOSTEO.abonnement)} d'abonnement jusqu'à la fin de l'année.`,
      },
      {
        id: "veilleurs",
        titre: "Demander aux réceptionnistes de nuit comment se passent les soirs de salon",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Saturnin : « Les soirs de salon, les clients arrivent tard et repartent tôt. Ils ne prennent presque jamais le petit-déjeuner, et le bar ferme à minuit. »",
      },
    ],
    question: "Que faites-vous de la surréservation pour novembre ?",
    options: [
      {
        t: "Garder la politique telle qu'elle est",
        d: "Rien à recalculer.",
      },
      {
        t: "Mettre la politique à jour avec les défections constatées depuis septembre et le profil des salons de novembre",
        d: "Le même calcul, avec les chiffres de cet automne. Une règle uniforme, ou l'absence de surréservation, n'ont rien à mettre à jour.",
      },
      {
        t: "Ajouter deux chambres partout : en novembre, les entreprises annulent davantage",
        d: "Deux réservations de plus par soir complet, dans chaque hôtel.",
      },
      {
        t: "Confier la surréservation au module automatique de Hostéo",
        d: `${pc(MODULE_HOSTEO.taux)} partout, calculés par le logiciel. ${euros(MODULE_HOSTEO.abonnement)} d'abonnement d'ici la fin de l'année.`,
      },
    ],
    reactions: [
      [{ ...ILSE, texte: "Entendu. Je garde les tableaux de septembre." }],
      [
        {
          ...ILSE,
          texte:
            "Je reprends les tableaux avec les chiffres de cet automne et le profil des salons. Les nouveaux niveaux partent lundi aux réceptions.",
        },
      ],
      [{ ...ANA, texte: "Deux de plus chez moi. Simple, au moins." }],
      [
        {
          de: "Hostéo",
          role: "Service clients",
          texte: "Le module est activé sur vos sept hôtels ouverts. Bienvenue !",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Les directeurs veulent arrêter",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...ANA,
        heure: "08:30",
        alerte: true,
        texte:
          (ctx.deloges as number) > 0
            ? `Lucile, ${ctx.deloges} client${(ctx.deloges as number) > 1 ? "s" : ""} délogé${(ctx.deloges as number) > 1 ? "s" : ""} dans le groupe depuis septembre${(ctx.fideles as number) >= 1 ? `, dont ${ctx.fideles} habitué${(ctx.fideles as number) > 1 ? "s" : ""}` : ""}${(ctx.noires as number) > 0 ? `, et ${ctx.noires} soir${(ctx.noires as number) > 1 ? "s" : ""} à ${AVIS.seuil} délogements ou plus` : ""}. Les directeurs demandent qu'on arrête toute surréservation jusqu'à la fin de l'année. Je suis d'accord avec eux.`
            : "Lucile, les directeurs veulent qu'on écrive noir sur blanc qu'il n'y aura aucune surréservation jusqu'à la fin de l'année. Je suis d'accord avec eux : on ne prend pas le risque pour quelques chambres.",
      },
      {
        ...ISALINE,
        heure: "09:15",
        texte:
          "Je dois répondre aux directeurs lundi. Les trois dernières semaines de novembre sont celles des derniers salons. Que leur dis-je ?",
      },
    ],
    sources: [
      {
        id: "compte",
        titre: "Faire avec Ilse le compte de la surréservation depuis septembre",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          (ctx.remplies as number) > 0
            ? `Depuis septembre, la surréservation a rempli ${ctx.remplies} chambres que les défections auraient laissées vides : ${ctx.margeRemplies} de marge. Les délogements ont coûté ${ctx.couts}, nuits chez les confrères, taxis, gestes, clients perdus et avis compris. Ce qui reste à jouer, ce sont les salons de novembre : ${pc(tauxNovembre(ctx.garantie as number))} de défections à Chambéry-Gare avec la garantie en vigueur.`
            : `Depuis septembre, le groupe n'a pas surréservé : ${ctx.vides} chambres sont restées vides par défection, à ${margeHotel("chambery")} € de marge perdue chacune à Chambéry-Gare. Les salons de novembre comptent ${pc(tauxNovembre(ctx.garantie as number))} de défections à Chambéry-Gare avec la garantie en vigueur.`,
      },
      {
        id: "avis",
        titre: "Lire ce que disent les avis sur Bookalia et Voyagio",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          (ctx.noires as number) > 0
            ? `Les soirs à ${AVIS.seuil} délogements ou plus ont laissé des traces : une série d'avis à une étoile, et ${euros(AVIS.cout)} de mise en avant payée pour remonter dans le classement, à chaque fois. Ailleurs, les clients délogés écrivent peu : prévenus et bien traités, la plupart ne laissent pas d'avis.`
            : "Pas de série d'avis négatifs cet automne. Les clients délogés écrivent peu : prévenus et bien traités, la plupart ne laissent pas d'avis. Les avis qui tombent viennent des soirs où l'on déloge beaucoup de monde à la fois.",
      },
    ],
    question: "Que répondez-vous aux directeurs ?",
    options: [
      {
        t: "Suspendre toute surréservation jusqu'à la fin de l'année",
        d: "Plus aucun délogement. Les directeurs sont satisfaits.",
      },
      {
        t: "Maintenir la politique, et montrer aux directeurs le compte des chambres remplies et des délogements",
        d: "Une réunion lundi, les chiffres hôtel par hôtel.",
      },
      {
        t: "Plafonner la surréservation à deux chambres par hôtel et par soir",
        d: "Un compromis que les directeurs accepteront.",
      },
      {
        t: "Laisser chaque directeur fixer sa surréservation",
        d: "Ils connaissent leur hôtel. La plupart diviseront le niveau par deux.",
      },
    ],
    reactions: [
      [
        { ...ANA, texte: "Merci. Les réceptions seront soulagées." },
        { ...ROMUALD, texte: "En plein mois de salons. Bon." },
      ],
      [
        {
          ...ISALINE,
          texte:
            "Les chiffres hôtel par hôtel, c'est ce qui les convaincra. Je présiderai la réunion.",
        },
      ],
      [{ ...ANA, texte: "Deux chambres au plus : ça me va." }],
      [{ ...PASCALINE, texte: "Merci de nous faire confiance. Je serai prudente." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Comparer en espérance la chambre vide et le délogement", chemin: [2, 1, 1, 2, 1, 1] },
  { nom: "Les réflexes : 5 % partout, puis tout arrêter", chemin: [1, 0, 3, 1, 2, 0] },
  { nom: "Attentiste", chemin: [0, 0, 0, 0, 0, 1] },
] as const;

/**
 * Les options que l'erreur de l'épisode fait choisir : [décision, option].
 * Ne voir qu'un seul des deux coûts : celui du délogement (interdire la
 * surréservation, la suspendre quand les directeurs protestent), ou celui de
 * la chambre vide (surréserver de 5 % partout, surréserver davantage les
 * soirs où toute la ville est pleine).
 */
export const REFLEXES = [
  [0, 0],
  [0, 1],
  [3, 1],
  [5, 0],
] as const;

export const REPONSES = {
  carteOui:
    "Notre agence a fini par accepter de donner une carte pour les soirs de salon. Ce n'était pas simple, mais nous restons chez vous.",
  carteNon:
    "Notre agence ne donne pas de carte. Nous transférons nos réservations d'Annemasse chez Orméa Hotels, qui ne nous demande rien.",
  acompteOui:
    "Un acompte, pour une entreprise qui paie sur facture... Nous le verserons cette fois, mais je le note.",
  acompteNon:
    "Un acompte ? Nous ne versons pas d'acompte à un hôtel. Nos réservations d'Annemasse partent chez Orméa Hotels.",
  sarvelecParti: `Sarvélec a transféré ses réservations d'Annemasse chez Orméa Hotels : ${SARVELEC.nuitees} nuitées par an, ${kE(SARVELEC.valeur)} de marge.`,
} as const;

/** Le nom court d'un hôtel, pour les messages. */
export const NOM_COURT: Readonly<Record<HotelId, string>> = {
  annecy: "Annecy-Centre",
  lac: "L'Escale Lac",
  chambery: "Chambéry-Gare",
  annemasse: "Annemasse",
  evian: "Évian",
  aix: "Aix-les-Bains",
  albertville: "Albertville",
};

/** Le directeur de chaque hôtel, quand il en a un dans l'épisode. */
export const DIRECTEUR: Partial<Record<HotelId, { de: string; role: string }>> = {
  annecy: PASCALINE,
  lac: ROMY,
  chambery: ANA,
  annemasse: ROMUALD,
};

export { ISALINE, ROMUALD, OTTILIE, SATURNIN, ILSE };
export const DEBUT_NOVEMBRE = NOVEMBRE;
