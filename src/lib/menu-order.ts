import { optionProfileFor } from '@/lib/item-options';

type MenuOrderItem = { name: string; option_profile?: string | null };

function rank(item: MenuOrderItem): number {
  const profile = optionProfileFor(item);
  const name = item.name.trim().toLowerCase();
  if (profile === 'combo') return 0;
  if (profile === 'burger') return 1;
  if (profile === 'drink' || name.includes('refrigerante') || name.includes('refri')) return 2;
  if (name.includes('batata')) return 4;
  return 3;
}

export function compareMenuDisplay(left: MenuOrderItem, right: MenuOrderItem): number {
  const difference = rank(left) - rank(right);
  if (difference !== 0) return difference;
  return left.name.localeCompare(right.name, 'pt-BR');
}
