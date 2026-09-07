"use client";

import { useState } from "react";

/**
 * Boutons de partage d'une page publique. Le lien et le titre sont passés en
 * clair (pas de lecture de window.location au rendu serveur) ; l'URL est
 * toujours absolue, calculée depuis SITE_URL par la page.
 *
 * « Copier le lien » et le partage natif sont côté client uniquement : le
 * bouton natif n'apparaît que si le navigateur expose navigator.share (mobile
 * surtout). Les réseaux ouvrent leur fenêtre de partage dans un nouvel onglet.
 */
export function ShareButtons({
  url,
  title,
  accent,
}: {
  url: string;
  title: string;
  accent: string;
}) {
  const [copie, setCopie] = useState(false);

  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const reseaux = [
    { nom: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { nom: "X", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { nom: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { nom: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}` },
  ];

  async function copier() {
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé) : on ne casse rien.
    }
  }

  async function partager() {
    // Partage natif du système (feuille de partage sur mobile) s'il existe ;
    // sinon on retombe sur la copie du lien, pour que le bouton fasse toujours
    // quelque chose. Lu à l'appel, jamais au rendu : pas d'écart d'hydratation.
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
      } catch {
        // L'utilisateur a annulé, ou le partage a échoué : sans conséquence.
      }
      return;
    }
    await copier();
  }

  const styleBouton =
    "rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/10";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={copier} className={styleBouton} aria-live="polite">
        {copie ? "✓ Lien copié" : "Copier le lien"}
      </button>
      <button
        type="button"
        onClick={partager}
        className={styleBouton}
        style={{ borderColor: accent, color: accent }}
      >
        Partager…
      </button>
      {reseaux.map((r) => (
        <a
          key={r.nom}
          href={r.href}
          target="_blank"
          rel="noopener noreferrer"
          className={styleBouton}
        >
          {r.nom}
        </a>
      ))}
    </div>
  );
}
