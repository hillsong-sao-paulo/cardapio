export function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

const PORTUGUESE_ERRORS: Array<[string, string]> = [
  ['Store not found', 'Loja não encontrada'],
  ['Not enough stock', 'Estoque insuficiente'],
  ['Order not found', 'Pedido não encontrado'],
  ['Invalid login credentials', 'Credenciais inválidas'],
  ['Choose the drink', 'Escolha o sabor'],
  ['Choose how the burger should be cooked', 'Escolha o ponto'],
  ['This item has no options', 'Este item não tem opções'],
  ['Unknown item option', 'Opção inválida'],
  ['Duplicate removed item', 'Item removido repetido'],
  ['Removed items must be a list', 'As retiradas precisam ser uma lista'],
  ['Duplicate menu item in the same sale', 'Essa combinação já está no pedido'],
];

export function toUserError(error: unknown, fallback: string): Error {
  const message = error instanceof Error ? error.message : fallback;
  const match = PORTUGUESE_ERRORS.find(([needle]) => message.includes(needle));
  return new Error(match ? match[1] : message || fallback);
}
