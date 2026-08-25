/**
 * Valorisation des stocks au coût unitaire moyen pondéré (CUMP, doc 02 §5).
 * v0.1 : stocks valorisés en coût variable de production (documenté).
 */

export interface StockLot {
  quantity: number;
  unitCost: number;
}

/** Entrée en stock : nouveau CUMP = (valeur existante + valeur entrée) / quantités. */
export function addToStock(stock: StockLot, quantity: number, unitCost: number): StockLot {
  if (quantity <= 0) return stock;
  const totalQty = stock.quantity + quantity;
  const totalValue = stock.quantity * stock.unitCost + quantity * unitCost;
  return { quantity: totalQty, unitCost: totalQty > 0 ? totalValue / totalQty : 0 };
}

/** Sortie de stock au CUMP courant. Retourne le stock restant et le coût des sorties. */
export function removeFromStock(
  stock: StockLot,
  quantity: number,
): { stock: StockLot; cost: number } {
  const qty = Math.min(stock.quantity, Math.max(0, quantity));
  return {
    stock: { quantity: stock.quantity - qty, unitCost: stock.unitCost },
    cost: qty * stock.unitCost,
  };
}

export function stockValue(stock: StockLot): number {
  return stock.quantity * stock.unitCost;
}
