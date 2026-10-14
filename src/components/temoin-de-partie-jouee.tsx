"use client";

import { useEffect } from "react";
import { marquerUnePartieJouee } from "@/lib/partie-jouee";

/**
 * Posé par l'arène dès qu'un tour est résolu (lot P4) : il ne rend rien, il
 * note sur l'appareil qu'une partie a été jouée. L'invitation à installer
 * l'application attend ce témoin (voir `install-prompt.tsx`).
 */
export function TemoinDePartieJouee() {
  useEffect(() => {
    marquerUnePartieJouee();
  }, []);
  return null;
}
