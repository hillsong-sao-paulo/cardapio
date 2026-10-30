import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getSupabase } from '@/lib/supabase';
import { isValidStoreSlug, slugFromName } from '@/lib/store-slug';
import { useAdminStore, type AdminStore } from '@/context/admin-store';

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

function storeLinks(slug: string): string[] {
  const origin = window.location.origin;
  return [
    `${origin}/s/${slug}`,
    `${origin}/s/${slug}/kitchen`,
    `${origin}/s/${slug}/orders`,
  ];
}

function saveErrorMessage(error: { code?: string; message?: string }): string {
  if (error.code === '23505') return 'Já existe uma loja com esse link.';
  if (error.code === '23514') return 'O link precisa ter pelo menos 3 letras ou números, sem espaço nem acento.';
  return 'Não foi possível salvar a loja.';
}

export function StoreManager() {
  const { stores, setStoreId } = useAdminStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<StoreDraft | null>(null);
  const [saving, setSaving] = useState(false);

  const campusesQuery = useQuery({
    queryKey: ['admin-campuses'],
    enabled: open,
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

  const copyLinks = async (slug: string) => {
    await navigator.clipboard.writeText(storeLinks(slug).join('\n'));
    toast({ title: 'Links da loja copiados' });
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
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Lojas
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lojas</DialogTitle>
            <DialogDescription>
              Cada loja tem o próprio cardápio. O link identifica a cantina ou o evento.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <Button
              size="sm"
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
                    className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">/s/</span>
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

              {isValidStoreSlug(draft.slug) && (
                <div className="space-y-1 text-xs text-gray-600">
                  {storeLinks(draft.slug).map((link) => (
                    <p key={link} className="truncate">{link}</p>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setDraft(null)} disabled={saving}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {stores.map((store) => (
              <div key={store.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{store.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {`/s/${store.slug}${store.is_active ? '' : ' · inativa'}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyLinks(store.slug)}>
                    Copiar links
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => startEdit(store)}>
                    Editar
                  </Button>
                </div>
              </div>
            ))}
            {stores.length === 0 && (
              <p className="text-sm text-gray-500">Nenhuma loja neste campus ainda.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
