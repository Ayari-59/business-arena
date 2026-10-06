import { Bande } from "@/components/bande";
import Link from "next/link";
import { ATELIERS } from "@/config/ateliers";
import { RepliableSurTelephone } from "@/components/repliable-sur-telephone";

/**
 * TROIS RÔLES, ET CE QUE CHACUN FAIT ICI.
 *
 * Relevé pendant l'audit : le mot « établissement » n'apparaissait qu'une
 * fois, sur trois pages, et jamais sur l'accueil. Or le produit a bel et bien
 * trois niveaux — un élève qui joue, un enseignant qui fait jouer, un
 * établissement qui rassemble son équipe — et le visiteur devait les deviner.
 * L'accueil offrait deux boutons, « Commencer une partie » et « Je suis
 * enseignant » : le troisième niveau n'existait nulle part avant la section
 * « Côté établissements » du guide, repliée dans un accordéon.
 *
 * CE N'EST PAS UNE GRILLE DE TARIFS. Le produit a un palier gratuit et des
 * licences, mais ce qui est ouvert ou fermé se règle dans la configuration de
 * plateforme et vaut « tout ouvert » par défaut : écrire ici ce qui est
 * payant serait faux la plupart du temps. Chaque colonne dit donc ce que son
 * rôle FAIT, pas ce qu'il coûte.
 *
 * ET CE N'EST PAS NON PLUS « PAR OÙ COMMENCER », qui vit plus bas sur la même
 * page. L'un répond « où vais-je », l'autre « qui suis-je ici » : la bande des
 * chiffres les sépare, pour que deux listes de liens ne se suivent pas.
 *
 * Rien n'est annoncé qui n'existe : l'espace d'administration par
 * établissement, les codes d'invitation enseignants et les concours rattachés
 * à l'établissement sont dans le produit, et l'atelier de campus fait bien
 * jouer quatre filières ensemble.
 */
const ROLES = [
  {
    role: "L'élève",
    resume: "Il décide, et il en lit les conséquences.",
    faits: [
      "Un code et un pseudo suffisent : rien à installer, aucun compte à créer.",
      "Une situation à lire, un diagnostic à poser, des décisions à prendre.",
      "Son profil de compétences avance à chaque situation traitée.",
    ],
    lien: { href: "/jouer", libelle: "Jouer en solo" },
  },
  {
    role: "L'enseignant",
    resume: "Il crée la partie, et il la pilote.",
    faits: [
      "Une partie multi-équipes, des tours qu'il ouvre et qu'il clôt.",
      "La maîtrise de chaque notion, suivie équipe par équipe.",
      `${ATELIERS.length} ateliers clés en main, et ses propres scénarios s'il le veut.`,
    ],
    lien: { href: "/enseignants", libelle: "Pour les enseignants" },
  },
  {
    role: "L'établissement",
    resume: "Il rassemble son équipe pédagogique.",
    faits: [
      "Un espace d'administration : ses enseignants, ses parties, ses concours.",
      "Des codes d'invitation pour y rattacher les enseignants.",
      "Des concours entre ses classes, et un atelier qui fait jouer tout un campus.",
    ],
    lien: { href: "/guide#etablissements", libelle: "Côté établissements" },
  },
] as const;

export function QuiFaitQuoi({ contraste }: { contraste: boolean }) {
  return (
    <Bande
      id="accueil.roles"
      contraste={contraste}
      fond="bande-soutenue"
      interieur="mx-auto max-w-6xl px-6 py-14"
      labelledby="roles"
    >
      <h2
        id="roles"
        className="flex items-center gap-3 text-xs uppercase tracking-annonce text-slate-400"
      >
        <span aria-hidden className="h-px w-8 bg-amber-400/40" />
        Qui fait quoi
      </h2>
      <div className="mt-8 grid gap-x-10 gap-y-10 md:grid-cols-3">
        {ROLES.map((r) => (
          <div key={r.role} className="border-t border-white/10 pt-5">
            <h3 className="font-display text-xl font-semibold text-slate-100">{r.role}</h3>
            <p className="mt-1 text-base leading-relaxed text-slate-300">{r.resume}</p>
            {/* Sur téléphone, chaque rôle tient en deux lignes et ses trois faits
                s'ouvrent à la demande ; au-delà de `sm`, tout est affiché. */}
            <RepliableSurTelephone resume="En savoir plus" className="mt-2 sm:mt-0">
            <ul className="mt-2 sm:mt-4 space-y-2.5">
              {r.faits.map((f) => (
                <li key={f} className="flex gap-2.5 text-sm leading-relaxed text-slate-400">
                  <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                  {f}
                </li>
              ))}
            </ul>
            </RepliableSurTelephone>
            <Link
              href={r.lien.href}
              className="group mt-3 inline-flex text-sm font-semibold text-amber-400 transition-colors hover:text-amber-300 pointer-coarse:min-h-11 pointer-coarse:items-center sm:mt-5"
            >
              {r.lien.libelle}
              <span
                aria-hidden
                className="ml-1.5 inline-block transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>
        ))}
      </div>
    </Bande>
  );
}
