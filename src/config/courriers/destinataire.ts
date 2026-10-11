import { porteUnNomParDefaut, teamDisplayName } from "@/config/nom-equipe";
import type { TypeDePli } from "@/config/courriers/types";

/**
 * À QUI LE COURRIER EST ADRESSÉ.
 *
 * Le propriétaire : « C'est mieux quand le nom de l'entreprise figure à
 * l'en-tête du courrier et sur l'enveloppe. » La fenêtre de l'enveloppe disait
 * « L'entreprise », la lettre portait une pastille « Votre entreprise » : un
 * pli adressé à personne. Une lettre d'affaires nomme son destinataire, et
 * l'élève qui dirige NOVA reçoit le courrier de NOVA.
 *
 * QUEL NOM. En solo, celui de l'entreprise du scénario (le registre :
 * `playerTeamName`, « NOVA », « LA TABLE D'AUGUSTIN »). En classe, celui que
 * l'équipe s'est donné quand elle en a choisi un : c'est sous ce nom qu'elle
 * dirige l'entreprise et qu'elle figure au classement. Une équipe encore
 * numérotée (« Équipe 3 ») reçoit le courrier au nom de l'entreprise : on
 * n'écrit pas à un numéro.
 *
 * RIEN D'INVENTÉ. Aucun scénario ne dit dans quelle ville est l'entreprise
 * (« en ville moyenne », « en périphérie » ne sont pas des adresses) : la ligne
 * de la ville n'est écrite que si on la donne. Le service visé est la
 * direction générale, celle que l'élève occupe ; la note de service, qui ne
 * sort pas des murs, est adressée à la direction sans formule.
 */
export interface DestinataireDuCourrier {
  /** Le nom de l'entreprise, tel qu'il s'écrit sur l'enveloppe et en tête de la lettre. */
  nom: string;
  /** La ville, quand la partie en donne une. Jamais devinée. */
  ville: string | null;
}

export function destinataireDuCourrier(args: {
  kind: "solo" | "class";
  /** L'entreprise du scénario (registre). */
  entreprise: string;
  /** Le nom de l'équipe du joueur, tel qu'il est enregistré. */
  equipe?: string | null;
  ville?: string | null;
}): DestinataireDuCourrier {
  const equipe = args.equipe ? teamDisplayName(args.equipe).trim() : "";
  const nom =
    args.kind === "class" && equipe !== "" && !porteUnNomParDefaut(equipe) ? equipe : args.entreprise;
  return { nom, ville: args.ville?.trim() ? args.ville.trim() : null };
}

/**
 * La ligne d'attention, selon le pli et la place. La lettre a la place de la
 * formule entière ; la fenêtre d'une enveloppe, d'une ligne plus courte. La
 * note de service circule dans les murs : « Direction générale », sans « À
 * l'attention de ».
 */
export function attentionDuPli(pli: TypeDePli | undefined, place: "lettre" | "enveloppe"): string {
  if (pli === "interne") return "Direction générale";
  return place === "lettre"
    ? "À l'attention de la direction générale"
    : "À l'attention de la direction";
}
