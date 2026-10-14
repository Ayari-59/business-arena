import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { examens } from "@/db/schema";
import { ETIQUETTE, NOTE_MAXIMALE } from "./ags/constantes";
import { libelleDeLaColonne } from "./ags/regles";
import { getTeacherGames } from "@/services/game.service";
import { cohortesDeLEnseignant } from "@/services/cohortes.service";
import { examensDeLEnseignant } from "@/services/examen.service";
import { clesDeLOutil } from "./cles";
import { adressesDeLOutil, CLAIM, MESSAGE, NOM_DE_L_OUTIL, PARAMETRE_CIBLE, VERSION_LTI } from "./constantes";
import { compteEnseignant, PlafondAtteint } from "./comptes";
import { echapper, origineDe, pageLti } from "./html";
import type { Lancement } from "./lancement";
import { cibleDeLEnseignant, ecrireCible, lireCible } from "./liens";
import { plateformeParId, type Plateforme } from "./plateformes";
import { signerJwt } from "./jwt";
import { consommerTicket, creerTicket } from "./tickets";
import { journaliserRefus } from "./journal";

/**
 * LA SÉLECTION DE CONTENU (Deep Linking 2.0), « Sélectionner le contenu » dans Moodle.
 *
 * L'enseignant ajoute une activité et, depuis la plateforme, choisit tout de suite ce
 * qu'elle ouvre : une de ses parties de classe, une de ses cohortes, un de ses examens,
 * ou « au premier lancement ». L'outil renvoie un jeton signé de SA clé (`LtiDeepLinkingResponse`) qui
 * porte le lien de ressource ; la cible voyage dans un paramètre personnalisé, que le
 * lancement revérifie (liens.ts).
 *
 * Moodle ouvre cet écran dans une iframe : pas de cookie. L'enseignant est donc reconnu
 * par le ticket à usage unique tiré au lancement, et l'écran est servi par la route,
 * intégrable par l'origine de la plateforme seule.
 */

const DUREE_SELECTION_S = 30 * 60;

export function originesDeLaPlateforme(p: Plateforme, ...autres: (string | null | undefined)[]): string[] {
  return [
    ...new Set(
      [p.issuer, p.urlAuthentification, ...autres].map((u) => origineDe(u)).filter((o): o is string => !!o),
    ),
  ];
}

/** L'écran de choix, en réponse au lancement de sélection. */
export async function ecranDeSelection(l: Lancement): Promise<Response> {
  const p = l.plateforme;
  const origines = originesDeLaPlateforme(p, l.selection?.retour);
  if (l.role !== "enseignant") {
    await journaliserRefus({ etape: "selection", motif: "sélection demandée par un non-enseignant", issuer: p.issuer, plateformeId: p.id });
    return pageLti({
      titre: "Réservé à l'enseignant",
      statut: 403,
      integrablePar: origines,
      corps: "<p>Le choix du contenu d'une activité revient à l'enseignant du cours.</p>",
    });
  }
  if (!l.selection!.types.includes("ltiResourceLink") && l.selection!.types.length > 0) {
    return pageLti({
      titre: "Contenu non pris en charge",
      statut: 400,
      integrablePar: origines,
      corps: "<p>La plateforme demande un type de contenu que Business Arena ne fournit pas. Ajoutez l'outil comme activité externe.</p>",
    });
  }
  let compte;
  try {
    compte = await compteEnseignant(l);
  } catch (e) {
    if (!(e instanceof PlafondAtteint)) throw e;
    return pageLti({
      titre: "Licence complète",
      statut: 403,
      integrablePar: origines,
      corps: `<p>${echapper(e.message)}</p>`,
    });
  }
  const ticket = await creerTicket({
    type: "selection",
    plateformeId: p.id,
    dureeS: DUREE_SELECTION_S,
    donnees: {
      userId: compte.userId,
      retour: l.selection!.retour,
      donnees: l.selection!.donnees,
      deploymentId: l.deploymentId,
    },
  });
  const [parties, cohortes, lesExamens] = await Promise.all([
    getTeacherGames(compte.userId),
    cohortesDeLEnseignant(compte.userId),
    examensDeLEnseignant(compte.userId),
  ]);
  const option = (valeur: string, titre: string, detail: string, coche = false) =>
    `<label class="choix"><input type="radio" name="cible" value="${echapper(valeur)}"${coche ? " checked" : ""}><span><strong>${echapper(titre)}</strong><br><span class="note">${echapper(detail)}</span></span></label>`;
  const corps = `
<p>Choisissez ce que cette activité ouvrira à vos élèves. Ils y arriveront sans compte ni code.</p>
<form method="post" action="/api/lti/selection">
<input type="hidden" name="ticket" value="${echapper(ticket)}">
<div class="carte">
${option("", "Choisir au premier lancement", "Vous choisirez ou créerez la partie en ouvrant l'activité.", true)}
</div>
<h2>Une de vos parties de classe</h2>
<div class="carte">
${
  parties
    .filter((g) => g.status !== "finished")
    .map((g) => option(`partie:${g.gameId}`, g.label ?? g.scenarioShortName, `${g.scenarioTitle} · code ${g.joinCode ?? ""}`))
    .join("\n") || `<p class="note">Aucune partie en cours pour l'instant.</p>`
}
</div>
<h2>Une de vos cohortes d'épisodes</h2>
<div class="carte">
${
  cohortes
    .filter((c) => !c.closeLe)
    .map((c) => option(`cohorte:${c.id}`, c.nom, `Cohorte · code ${c.code}`))
    .join("\n") || `<p class="note">Aucune cohorte ouverte pour l'instant.</p>`
}
</div>
<h2>Un de vos examens individuels</h2>
<div class="carte">
${
  lesExamens
    .filter((e) => !e.closLe)
    .map((e) => option(`examen:${e.id}`, e.nom, `Examen · code ${e.code}`))
    .join("\n") || `<p class="note">Aucun examen ouvert pour l'instant.</p>`
}
</div>
<button class="bouton" type="submit">Ajouter l'activité</button>
</form>`;
  return pageLti({
    titre: "Ce que l'activité ouvre",
    surtitre: "Business Arena · sélection du contenu",
    corps,
    integrablePar: origines,
  });
}

export class SelectionRefusee extends Error {
  constructor(readonly motif: string) {
    super(motif);
    this.name = "SelectionRefusee";
  }
}

/** Le jeton signé de réponse, et le formulaire qui le poste à la plateforme. */
export async function reponseDeSelection(args: {
  ticket: string | null;
  cible: string | null;
  origine: string;
  now?: Date;
}): Promise<Response> {
  const now = args.now ?? new Date();
  const pris = await consommerTicket(args.ticket, "selection", now);
  if (!pris) throw new SelectionRefusee("ticket de sélection inconnu, expiré ou déjà utilisé");
  const p = await plateformeParId(pris.plateformeId);
  if (!p || !p.actif) throw new SelectionRefusee("plateforme désactivée");
  const d = pris.donnees as { userId: string; retour: string; donnees: string | null; deploymentId: string };
  const origines = originesDeLaPlateforme(p, d.retour);

  const cible = args.cible ? lireCible(args.cible) : null;
  if (args.cible && !cible) throw new SelectionRefusee("cible illisible");
  if (cible && !(await cibleDeLEnseignant({ cible, enseignantId: d.userId, organizationId: p.organizationId }))) {
    throw new SelectionRefusee("cible qui n'est pas à cet enseignant");
  }
  const item: Record<string, unknown> = {
    type: "ltiResourceLink",
    title: NOM_DE_L_OUTIL,
    url: adressesDeLOutil(args.origine).lancement,
  };
  if (cible) item.custom = { [PARAMETRE_CIBLE]: ecrireCible(cible) };
  // UN EXAMEN : la plateforme crée sa colonne de notes avec l'activité (lti/ags) ; ses
  // lancements la désigneront, et la note publiée y arrivera. Rien pour une partie de
  // classe ou une cohorte : l'outil n'y pose jamais de note.
  if (cible?.type === "examen") {
    const [e] = await db.select({ nom: examens.nom }).from(examens).where(eq(examens.id, cible.id));
    if (e) {
      item.lineItem = {
        scoreMaximum: NOTE_MAXIMALE,
        label: libelleDeLaColonne(e.nom),
        resourceId: `examen:${cible.id}`,
        tag: ETIQUETTE,
      };
    }
  }

  const cles = clesDeLOutil();
  const iat = Math.floor(now.getTime() / 1000);
  const charge: Record<string, unknown> = {
    iss: p.clientId,
    aud: p.issuer,
    iat,
    exp: iat + 300,
    nonce: randomBytes(16).toString("base64url"),
    [CLAIM.typeDeMessage]: MESSAGE.reponseSelection,
    [CLAIM.version]: VERSION_LTI,
    [CLAIM.deployment]: d.deploymentId,
    [CLAIM.contenus]: [item],
  };
  if (d.donnees) charge[CLAIM.donneesDl] = d.donnees;
  const jwt = signerJwt(charge, cles.privee, cles.kid);

  return pageLti({
    titre: "Retour à votre cours",
    integrablePar: origines,
    postVers: [origineDe(d.retour)],
    corps: `<form id="retour" method="post" action="${echapper(d.retour)}"><input type="hidden" name="JWT" value="${echapper(jwt)}"><p>L'activité est prête. Si la page ne revient pas d'elle-même à votre cours :</p><button class="bouton" type="submit">Revenir au cours</button></form>`,
    script: "document.getElementById('retour').submit();",
  });
}
