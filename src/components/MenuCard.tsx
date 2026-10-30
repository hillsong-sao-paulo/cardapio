import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Minus, Plus } from 'lucide-react';
import { MenuItem, CartItem } from '../types/inventory';
import {
  DONENESS,
  DRINKS,
  REMOVALS,
  ItemSelection,
  cartLineKey,
  emptySelection,
  formatOptions,
  missingOptionHint,
  optionProfileFor,
  optionsReady,
} from '@/lib/item-options';
import { cn } from '@/lib/utils';

interface MenuCardProps {
  item: MenuItem;
  lines: CartItem[];
  onAdd: (selection: ItemSelection) => void;
  onUpdateQuantity: (lineKey: string, quantity: number) => void;
}

const MenuCard: React.FC<MenuCardProps> = ({ item, lines, onAdd, onUpdateQuantity }) => {
  const [selection, setSelection] = useState<ItemSelection>(emptySelection);
  const profile = optionProfileFor(item);
  const ready = optionsReady(profile, selection);
  const optionsLabel = profile && ready ? formatOptions(profile, selection) : null;
  const lineKey = cartLineKey(item.id, optionsLabel);
  const activeLine = ready ? lines.find((line) => line.lineKey === lineKey) : undefined;
  const quantity = activeLine?.quantity ?? 0;
  const reserved = lines.reduce((sum, line) => sum + line.quantity, 0);
  const isOutOfStock = item.stock === 0;
  const canAddMore = reserved < item.stock;

  const handleQuantityChange = (newQuantity: number) => {
    if (!activeLine) return;
    onUpdateQuantity(activeLine.lineKey, newQuantity);
  };

  const toggleRemoved = (name: string) => {
    setSelection((current) => ({
      ...current,
      removed: current.removed.includes(name)
        ? current.removed.filter((itemName) => itemName !== name)
        : [...current.removed, name],
    }));
  };

  return (
    <Card className="bg-white border-0 shadow-sm rounded-2xl overflow-hidden mb-3">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-3">
              <h3 className="text-base font-semibold text-gray-900 leading-tight mb-1 font-sf">
                {item.name}
              </h3>
              {item.description ? (
                <p className="text-sm text-gray-500 line-clamp-2 mb-2 font-sf">
                  {item.description}
                </p>
              ) : null}
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-gray-900 font-sf">
                  R$ {item.price.toFixed(2)}
                </span>
                {isOutOfStock ? (
                  <Badge variant="destructive" className="text-xs font-sf">
                    Esgotado
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs font-sf">
                    {item.stock} disponível
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {!isOutOfStock && (profile === 'drink' || profile === 'combo') && (
            <fieldset className="space-y-1">
              <legend className="text-sm font-medium text-gray-800 font-sf">Qual refrigerante?</legend>
              <RadioGroup
                value={selection.drink ?? ''}
                onValueChange={(drink) => setSelection((current) => ({ ...current, drink }))}
                className="gap-0"
              >
                {DRINKS.map((drink) => {
                  const id = `${item.id}-drink-${drink}`;
                  return (
                    <label key={drink} htmlFor={id} className="flex items-center gap-3 py-2 cursor-pointer">
                      <RadioGroupItem value={drink} id={id} />
                      <span className="text-sm text-gray-800 font-sf">{drink}</span>
                    </label>
                  );
                })}
              </RadioGroup>
            </fieldset>
          )}

          {!isOutOfStock && (profile === 'burger' || profile === 'combo') && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-800 font-sf mb-2">Ponto da carne</p>
                <div className="flex flex-wrap gap-2">
                  {DONENESS.map((point) => {
                    const selected = selection.doneness === point;
                    return (
                      <button
                        key={point}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSelection((current) => ({ ...current, doneness: point }))}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-sm font-medium font-sf',
                          selected
                            ? 'border-app-blue bg-app-blue text-white'
                            : 'border-gray-200 bg-white text-gray-700',
                        )}
                      >
                        {point}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 font-sf">Remover</p>
                <div>
                  {REMOVALS.map((name) => (
                    <button
                      key={name}
                      type="button"
                      aria-pressed={selection.removed.includes(name)}
                      onClick={() => toggleRemoved(name)}
                      className="flex w-full items-center gap-3 py-2 text-left"
                    >
                      <Checkbox
                        checked={selection.removed.includes(name)}
                        tabIndex={-1}
                        className="pointer-events-none"
                      />
                      <span className="text-sm text-gray-800 font-sf">{name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-400 uppercase tracking-wide font-sf">
              Quantidade
            </div>

            <div className="flex items-center">
              {isOutOfStock ? (
                <div className="bg-gray-100 text-gray-400 px-4 py-2 rounded-full text-sm font-medium font-sf">
                  Indisponível
                </div>
              ) : profile && !ready ? (
                <div className="bg-gray-100 text-gray-400 px-4 py-2 rounded-full text-sm font-medium font-sf">
                  {missingOptionHint(profile, selection)}
                </div>
              ) : quantity === 0 ? (
                <Button
                  onClick={() => onAdd(selection)}
                  disabled={!canAddMore}
                  className="bg-app-blue hover:bg-app-blue-hover text-white px-6 py-2 rounded-full text-sm font-medium h-auto font-sf"
                >
                  Adicionar
                </Button>
              ) : (
                <div className="flex items-center bg-gray-50 rounded-full p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="h-8 w-8 rounded-full p-0 hover:bg-app-blue-light text-app-blue hover:text-app-blue-hover"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>

                  <span className="font-semibold text-base min-w-[2.5rem] text-center text-gray-900 font-sf">
                    {quantity}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={!canAddMore}
                    className="h-8 w-8 rounded-full p-0 hover:bg-app-blue-light text-app-blue hover:text-app-blue-hover disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MenuCard;
