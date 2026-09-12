"use client";

import { useState } from "react";

export function useGlossary() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  return {
    isOpen,
    setIsOpen,
    searchTerm,
    setSearchTerm,
  };
}
