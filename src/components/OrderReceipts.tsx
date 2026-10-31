import React, { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useRecentReceipts } from '@/hooks/useRecentReceipts';
import type { OrderReceipt } from '@/types/database';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'canteen-receipts-open';

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function Filipeta({ receipt }: { receipt: OrderReceipt }) {
  const number = String(receipt.order_number).padStart(3, '0');
  const name = receipt.customer_name || 'Sem nome';
  const total = formatMoney(receipt.total);

  return (
    <article aria-label={`Pedido ${number}, ${name}, ${total}`} className="px-3">
      <div
        aria-hidden
        className="h-2 bg-[radial-gradient(circle_at_6px_0,transparent_6px,#fffdf8_6.5px)] bg-[length:12px_8px] bg-repeat-x"
      />
      <div className="bg-[#fffdf8] px-3 py-3 text-center shadow-sm">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gray-400 font-sf">Pedido</p>
        <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-gray-900 font-sf">{number}</p>
        <p className="mt-1 truncate text-sm font-semibold text-gray-800 font-sf">{name}</p>
        <div className="my-3 border-t border-dashed border-gray-300" />
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gray-400 font-sf">Valor</p>
        <p className="mt-1 text-lg font-bold tabular-nums text-gray-900 font-sf">{total}</p>
      </div>
      <div
        aria-hidden
        className="h-2 bg-[radial-gradient(circle_at_6px_8px,transparent_6px,#fffdf8_6.5px)] bg-[length:12px_8px] bg-repeat-x"
      />
    </article>
  );
}

const OrderReceipts: React.FC = () => {
  const { data: receipts = [], isLoading } = useRecentReceipts();
  const [open, setOpen] = useState(() => {
    try {
      return window.sessionStorage.getItem(STORAGE_KEY) !== '0';
    } catch {
      return true;
    }
  });

  const setOpenAndRemember = (next: boolean) => {
    setOpen(next);
    window.sessionStorage.setItem(STORAGE_KEY, next ? '1' : '0');
  };

  return (
    <aside
      data-receipt-rail
      className={cn(
        'sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-gray-200 bg-gray-100 transition-[width] duration-200 md:flex',
        open ? 'w-64' : 'w-12',
      )}
    >
      {open ? (
        <>
          <div className="flex items-center justify-between gap-2 px-3 py-4">
            <h2 className="text-sm font-bold text-gray-900 font-sf">Pedidos</h2>
            <button
              type="button"
              onClick={() => setOpenAndRemember(false)}
              aria-expanded={true}
              aria-label="Recolher pedidos"
              className="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-gray-900"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-4">
            {isLoading ? (
              <p className="px-4 text-sm text-gray-500 font-sf">Carregando...</p>
            ) : receipts.length === 0 ? (
              <p className="px-4 text-sm text-gray-500 font-sf">Nenhum pedido ainda</p>
            ) : (
              receipts.map((receipt) => (
                <Filipeta key={receipt.order_number} receipt={receipt} />
              ))
            )}
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setOpenAndRemember(true)}
          aria-expanded={false}
          aria-label="Mostrar pedidos"
          className="flex h-full w-full flex-col items-center gap-3 py-4 text-gray-700 hover:bg-gray-200"
        >
          <PanelLeftOpen className="h-4 w-4" />
          <span className="text-xs font-semibold tracking-wide font-sf [writing-mode:vertical-rl] rotate-180">
            Pedidos
          </span>
        </button>
      )}
    </aside>
  );
};

export default OrderReceipts;
