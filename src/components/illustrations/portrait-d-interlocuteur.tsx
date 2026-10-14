import type { ComponentType } from "react";
import { Dessin } from "./trait";
import {
  PortraitAdministration,
  PortraitAssocies,
  PortraitBanque,
  PortraitClient,
  PortraitFournisseur,
  PortraitPresse,
  PortraitSalarie,
  PortraitTechnicien,
} from "./portraits";

/**
 * QUI VOUS ÉCRIT (lot 6B).
 *
 * Plus de deux cents expéditeurs signent le courrier de l'entreprise, des
 * banques aux mairies, des centrales d'achat aux notes de l'atelier. On ne
 * leur donne pas deux cents visages : huit FIGURES, celles que l'élève doit
 * apprendre à reconnaître, parce qu'on ne répond pas à son banquier comme à
 * son fournisseur ni à l'inspection comme à un client.
 */
export type Interlocuteur =
  | "banque"
  | "fournisseur"
  | "technicien"
  | "client"
  | "administration"
  | "associes"
  | "salarie"
  | "presse";

export const PORTRAITS: Record<
  Interlocuteur,
  { qui: string; attribut: string; Dessin: ComponentType }
> = {
  banque: {
    qui: "La banque, l'assureur, le comptable",
    attribut: "lunettes et dossier",
    Dessin: PortraitBanque,
  },
  fournisseur: {
    qui: "Un fournisseur, une plateforme, un prestataire",
    attribut: "une caisse dans les bras",
    Dessin: PortraitFournisseur,
  },
  technicien: {
    qui: "Le service technique, la maintenance",
    attribut: "casque et gilet",
    Dessin: PortraitTechnicien,
  },
  client: {
    qui: "Un client, un grand compte",
    attribut: "le badge de visiteur",
    Dessin: PortraitClient,
  },
  administration: {
    qui: "L'administration, la justice",
    attribut: "le tampon",
    Dessin: PortraitAdministration,
  },
  associes: {
    qui: "Les associés",
    attribut: "la tablette des résultats",
    Dessin: PortraitAssocies,
  },
  salarie: {
    qui: "Un salarié, l'équipe",
    attribut: "le tablier de la maison",
    Dessin: PortraitSalarie,
  },
  presse: {
    qui: "La presse, les fédérations, les observatoires",
    attribut: "le journal plié",
    Dessin: PortraitPresse,
  },
};

/**
 * LES RÈGLES, DANS L'ORDRE : la première qui reconnaît l'expéditeur l'emporte.
 * L'ordre compte. Une note interne de la direction technique est d'un salarié
 * avant d'être d'un technicien ; un office public de l'habitat qui commande
 * un chantier est un client avant d'être une administration.
 *
 * La garde `illustrations.test.ts` vérifie que CHAQUE expéditeur du registre
 * est reconnu par une règle : un courrier ajouté sans figure la fait rougir.
 */
export const REGLES_DES_EXPEDITEURS: readonly (readonly [RegExp, Interlocuteur])[] = [
  [/^Note interne · Les associés/, "associes"],
  [/^Note interne|^Lettre de démission|^Service clients ·/, "salarie"],
  [
    /^Office public de l'habitat|^Association des entreprises|^Association de clients|^Syndic |Architectes/,
    "client",
  ],
  [
    /après-vente|maintenance|Maintenance|Support|Service abonnés|Cellule de sécurité|Direction technique|Service d'urgence|Garage|Contrôle technique|Bureau de contrôle|Diagnostic|Rapport d'expertise/,
    "technicien",
  ],
  [
    /Banque|banque|bancaire|Crédit|Loueur financier|Assurances|Expertise comptable|Restructuration/,
    "banque",
  ],
  [
    /^Mairie|^Préfecture|^Direction départementale|^Direction régionale|^Direction générale|impôts|^Greffe|^Gendarmerie|^Agence régionale|^Agence nationale|^Agence de la transition|^Agence de développement|^Organisme|^Caisse|^Médecine du travail|^Métropole|^Région|^Commission|^Centrale des marchés publics|Avocats|Propriété industrielle|Administrateur judiciaire|Commissaire-priseur/,
    "administration",
  ],
  [
    /Rédaction|^Revue|^Chronique|Observatoire|^Fédération|^Syndicat|^Union professionnelle|^Association des commerçants|^Chambre|^Agence Berthaud|^Agence Trame|Note de marché|Note de tendance|^Plateforme d'avis/,
    "presse",
  ],
  [
    /Négoce|^Grossiste|Façonnier|^Électro-Composants|carburants|^Transporteur|^Transitaire|^Fournisseur|^Plateforme Livrapide|^Plateforme Réservatio|^Marketplace|^Régie publicitaire|^Éditeur|^Agence de voyages|^Société d'autoroutes|^Ébénisterie|Liquidation|Cessation d'activité/,
    "fournisseur",
  ],
  [
    /Direction des achats|Approvisionnements|approvisionnements|Direction|Présidence|Famille|^CSE|^Comité|Société savante|^Salon|^Mutuelle|^Office de tourisme|Service expéditions|Service exploitation|Commissariat/,
    "client",
  ],
];

/** La figure qui signe ce courrier, ou rien si aucune règle ne la reconnaît. */
export function interlocuteurDe(expediteur: string): Interlocuteur | null {
  for (const [motif, qui] of REGLES_DES_EXPEDITEURS) if (motif.test(expediteur)) return qui;
  return null;
}

export function PortraitDInterlocuteur({
  qui,
  titre,
  className,
}: {
  qui: Interlocuteur;
  /** À donner seulement si le nom de l'expéditeur n'est pas écrit à côté. */
  titre?: string;
  className?: string;
}) {
  const { Dessin: Portrait } = PORTRAITS[qui];
  return (
    <Dessin largeur={240} hauteur={240} titre={titre} className={className}>
      <Portrait />
    </Dessin>
  );
}
