export const DRINKS = ['Coca', 'Coca Zero', 'Guaraná', 'Suco de laranja', 'Suco de uva'] as const;
export const DONENESS = ['Mal passado', 'Ao ponto', 'Bem passado'] as const;
export const REMOVALS = ['Maionese', 'Alface', 'Tomate', 'Queijo'] as const;

export type OptionProfile = 'drink' | 'burger' | 'combo';

export interface ItemSelection {
  drink: string | null;
  doneness: string | null;
  removed: string[];
}

export const emptySelection = (): ItemSelection => ({
  drink: null,
  doneness: null,
  removed: [],
});

export function optionProfileFor(item: { name: string; option_profile?: string | null }): OptionProfile | null {
  if (item.option_profile === 'drink' || item.option_profile === 'burger' || item.option_profile === 'combo') {
    return item.option_profile;
  }
  const name = item.name.trim().toLowerCase();
  if (name.includes('combo')) return 'combo';
  if (name.includes('burguer') || name.includes('burger') || name.includes('hambúrguer') || name.includes('hamburguer')) {
    return 'burger';
  }
  if (name.includes('refrigerante') || name.includes('refri')) return 'drink';
  return null;
}

function orderedRemovals(removed: string[]): string[] {
  return REMOVALS.filter((item) => removed.includes(item));
}

export function formatOptions(profile: OptionProfile, selection: ItemSelection): string | null {
  if (profile === 'drink') return selection.drink;

  if (!selection.doneness) return null;
  const removed = orderedRemovals(selection.removed);
  const burger = removed.length > 0 ? `${selection.doneness} · sem ${removed.join(', ')}` : selection.doneness;
  if (profile === 'burger') return burger;
  if (!selection.drink) return null;
  return `${burger}\n${selection.drink}`;
}

export function optionsReady(profile: OptionProfile | null, selection: ItemSelection): boolean {
  if (!profile) return true;
  return formatOptions(profile, selection) !== null;
}

export function missingOptionHint(profile: OptionProfile, selection: ItemSelection): string {
  if ((profile === 'burger' || profile === 'combo') && !selection.doneness) return 'Escolha o ponto';
  return 'Escolha o sabor';
}

export function cartLineKey(itemId: string, optionsLabel: string | null): string {
  return `${itemId}::${optionsLabel ?? ''}`;
}

export function saleOptionFields(
  profile: OptionProfile | null,
  selection: ItemSelection,
): { drink?: string; doneness?: string; removed?: string[] } {
  if (!profile || !formatOptions(profile, selection)) return {};
  if (profile === 'drink' && selection.drink) return { drink: selection.drink };
  const removed = orderedRemovals(selection.removed);
  if (profile === 'burger' && selection.doneness) {
    return removed.length > 0
      ? { doneness: selection.doneness, removed }
      : { doneness: selection.doneness };
  }
  if (profile === 'combo' && selection.doneness && selection.drink) {
    return removed.length > 0
      ? { drink: selection.drink, doneness: selection.doneness, removed }
      : { drink: selection.drink, doneness: selection.doneness };
  }
  return {};
}
