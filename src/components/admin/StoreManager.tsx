import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { isValidStoreSlug, slugFromName } from '@/lib/store-slug';
import { useAdminStore, type AdminStore } from '@/context/admin-store';
import { copyPlainText } from '@/lib/copy-text';

interface CampusOption {
  id: string;
  name: string;
}

interface StoreDraft {
  id: string | null;
  name: string;
  slug: string;
  campusId: string;
  isActive: boolean;
  slugEdited: boolean;
}

function emptyDraft(campusId: string): StoreDraft {
  return {
    id: null,
    name: '',
    slug: '',
    campusId,
    isActive: true,
    slugEdited: false,
  };
}

function linkPieces(url: string): string[] {
  return url.split(/(?<=\/)/);
}

function storeLinks(slug: string): { label: string; url: string }[] {
  const origin = window.location.origin;
  const base = `${origin}/s/${slug}`;
  return [
    { label: 'Cardápio', url: base },
    { label: 'Cozinha', url: `${base}/kitchen` },
    { label: 'Pedidos', url: `${base}/orders` },
  ];
}

function saveErrorMessage(error: { code?: string; message?: string }): string {
  if (error.code === '23505') return 'Já existe uma loja com esse link.';
  if (error.code === '23514') return 'O link precisa ter pelo menos 3 letras ou números, sem espaço nem acento.';
  return 'Não foi possível salvar a loja.';
}

export function StoreLinkList({ slug }: { slug: string }) {
  const { toast } = useToast();
  const links = storeLinks(slug);

  const copyOne = async (url: string, label: string) => {
    const copied = await copyPlainText(url);
    toast(copied
      ? { title: `${label} copiado` }
      : {
          title: 'Não foi possível copiar',
          description: 'Segure o link e escolha Copiar.',
          variant: 'destructive',
        });
  };

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <div key={link.label} className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{link.label}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0"
              onClick={() => copyOne(link.url, link.label)}
            >
              Copiar
            </Button>
          </div>
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="block break-words text-sm leading-5 text-blue-700 underline"
          >
            {linkPieces(link.url).map((piece, index) => (
              <span key={`${link.label}-${index}`}>
                {piece}
                <wbr />
              </span>
            ))}
          </a>
        </div>
      ))}
    </div>
  );
}

export function StoreControls({
  selectId,
  linksOpen,
  onToggleLinks,
  onOpenStores,
  stacked = false,
}: {
  selectId: string;
  linksOpen: boolean;
  onToggleLinks: () => void;
  onOpenStores: () => void;
  stacked?: boolean;
}) {
  const { stores, store, storeId, setStoreId, loading } = useAdminStore();

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor={selectId} className="text-sm font-medium text-gray-700">Loja</label>
        <select
          id={selectId}
          className="h-11 w-full rounded-md border bg-white px-3 text-base"
          value={storeId ?? ''}
          disabled={loading || stores.length === 0}
          onChange={(event) => setStoreId(event.target.value)}
        >
          {stores.map((item) => (
            <option key={item.id} value={item.id}>
              {item.is_active ? item.name : `${item.name} (inativa)`}
            </option>
          ))}
        </select>
      </div>
      {!loading && stores.length === 0 && (
        <p className="text-sm text-gray-500">Nenhuma loja ainda. Toque em Lojas para criar.</p>
      )}
      <div className={stacked ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-2 gap-2'}>
        <Button variant="outline" className="h-11 w-full justify-center gap-2" onClick={onOpenStores}>
          {stacked && <Store className="h-4 w-4" />}
          Lojas
        </Button>
        <Button
          variant="outline"
          className="h-11 w-full"
          disabled={!store}
          onClick={onToggleLinks}
        >
          {linksOpen ? 'Ocultar links' : 'Ver links'}
        </Button>
      </div>
      {linksOpen && store && (
        <div className="rounded-md border bg-gray-50 p-3">
          <StoreLinkList slug={store.slug} />
        </div>
      )}
    </div>
  );
}

export function StoreManager({
  open: openProp,
  onOpenChange,
  hideButton = false,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideButton?: boolean;
} = {}) {
  const { stores, setStoreId } = useAdminStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const [draft, setDraft] = useState<StoreDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);

  const campusesQuery = useQuery({
    queryKey: ['admin-campuses'],
    enabled: open && isSupabaseConfigured,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('campuses')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return (data ?? []) as CampusOption[];
    },
  });

  const campuses = campusesQuery.data ?? [];
  const defaultCampusId = campuses[0]?.id ?? '';

  const startCreate = () => {
    setDraft(emptyDraft(defaultCampusId));
  };

  const startEdit = (store: AdminStore) => {
    setDraft({
      id: store.id,
      name: store.name,
      slug: store.slug,
      campusId: store.campus_id,
      isActive: store.is_active,
      slugEdited: true,
    });
  };

  const updateName = (name: string) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        name,
        slug: current.slugEdited ? current.slug : slugFromName(name),
      };
    });
  };

  const copyText = async (text: string, title: string) => {
    const copied = await copyPlainText(text);
    toast(copied
      ? { title }
      : {
          title: 'Não foi possível copiar',
          description: 'Segure o link e escolha Copiar.',
          variant: 'destructive',
        });
  };

  const copyLinks = (slug: string) => {
    copyText(storeLinks(slug).map((link) => link.url).join('\n'), 'Links da loja copiados');
  };

  const save = async () => {
    if (!draft) return;
    const name = draft.name.trim();
    const slug = draft.slug.trim();
    if (!name) {
      toast({ title: 'Dê um nome para a loja', variant: 'destructive' });
      return;
    }
    if (!isValidStoreSlug(slug)) {
      toast({
        title: 'Link inválido',
        description: 'Use pelo menos 3 letras ou números, sem espaço nem acento. Exemplo: cantina-zona-sul.',
        variant: 'destructive',
      });
      return;
    }
    if (!draft.campusId) {
      toast({ title: 'Escolha o campus', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const payload = {
      name,
      slug,
      campus_id: draft.campusId,
      is_active: draft.isActive,
    };
    const query = draft.id
      ? getSupabase().from('stores').update(payload).eq('id', draft.id).select('id').single()
      : getSupabase().from('stores').insert(payload).select('id').single();
    const { data, error } = await query;
    setSaving(false);

    if (error || !data) {
      toast({
        title: 'Não foi possível salvar',
        description: saveErrorMessage(error ?? {}),
        variant: 'destructive',
      });
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
    setStoreId(data.id);
    setDraft(null);
    toast({
      title: draft.id ? 'Loja atualizada' : 'Loja criada',
      description: draft.isActive
        ? 'Os links do cardápio, da cozinha e dos pedidos já podem ser copiados.'
        : 'A loja está inativa. Os links só abrem de novo quando você ativar.',
    });
  };

  return (
    <>
      {!hideButton && (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Lojas
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pr-8 text-left">
            <DialogTitle>Lojas</DialogTitle>
            <DialogDescription>
              Cada loja tem o próprio cardápio. O link identifica a cantina ou o evento.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <Button
              className="w-full sm:w-auto"
              onClick={startCreate}
              disabled={campusesQuery.isLoading || campuses.length === 0}
            >
              Nova loja
            </Button>
          </div>

          {draft && (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="space-y-2">
                <Label htmlFor="store-name">Nome</Label>
                <Input
                  id="store-name"
                  value={draft.name}
                  onChange={(event) => updateName(event.target.value)}
                  placeholder="Cantina do evento"
                />
              </div>

              {campuses.length > 1 && !draft.id && (
                <div className="space-y-2">
                  <Label htmlFor="store-campus">Campus</Label>
                  <select
                    id="store-campus"
                    className="flex h-11 w-full rounded-md border bg-background px-3 text-base sm:h-10 sm:text-sm"
                    value={draft.campusId}
                    onChange={(event) => setDraft({ ...draft, campusId: event.target.value })}
                  >
                    {campuses.map((campus) => (
                      <option key={campus.id} value={campus.id}>{campus.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="store-slug">Link</Label>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-sm text-gray-500">/s/</span>
                  <Input
                    id="store-slug"
                    value={draft.slug}
                    onChange={(event) => setDraft({
                      ...draft,
                      slug: event.target.value.toLowerCase(),
                      slugEdited: true,
                    })}
                    placeholder="cantina-zona-sul"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Mudar o link troca o endereço do cardápio, da cozinha e dos pedidos.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="store-active">Loja ativa</Label>
                <Switch
                  id="store-active"
                  checked={draft.isActive}
                  onCheckedChange={(checked) => setDraft({ ...draft, isActive: checked })}
                />
              </div>

              {isValidStoreSlug(draft.slug) && <StoreLinkList slug={draft.slug} />}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setDraft(null)} disabled={saving}>
                  Cancelar
                </Button>
                <Button className="w-full sm:w-auto" onClick={save} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {stores.map((store) => {
              const linksOpen = expandedStoreId === store.id;
              return (
                <Collapsible
                  key={store.id}
                  open={linksOpen}
                  onOpenChange={(nextOpen) => setExpandedStoreId(nextOpen ? store.id : null)}
                  className="rounded-md border"
                >
                  <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">{store.name}</p>
                      <p className="break-all text-sm text-gray-500">
                        {`/s/${store.slug}${store.is_active ? '' : ' · inativa'}`}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:flex sm:shrink-0 sm:flex-wrap sm:justify-end">
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" className="h-10 w-full sm:w-auto">
                          {linksOpen ? 'Ocultar links' : 'Ver links'}
                        </Button>
                      </CollapsibleTrigger>
                      <Button variant="outline" className="h-10 w-full sm:w-auto" onClick={() => copyLinks(store.slug)}>
                        Copiar links
                      </Button>
                      <Button variant="outline" className="h-10 w-full sm:w-auto" onClick={() => startEdit(store)}>
                        Editar
                      </Button>
                    </div>
                  </div>
                  <CollapsibleContent className="border-t px-3 py-3">
                    <StoreLinkList slug={store.slug} />
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
            {stores.length === 0 && (
              <p className="text-sm text-gray-500">Nenhuma loja neste campus ainda.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
