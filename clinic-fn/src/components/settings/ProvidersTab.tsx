import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/Spinner';
import { useProviders, useRemoveProvider } from '@/hooks/useApi';
import { ProviderDialog, type ProviderDraft } from './ProviderDialog';

const EMPTY_DRAFT: ProviderDraft = {
  _id: '',
  name: '',
  title: '',
  serviceId: '',
};

export const ProvidersTab = () => {
  const { data: providers = [], isLoading } = useProviders();
  const removeMut = useRemoveProvider();
  const [draft, setDraft] = useState<ProviderDraft | null>(null);
  const serviceId = (service: typeof providers[number]['serviceId']): string => {
    if (!service) return '';
    if (typeof service === 'object') return service._id;
    return service;
  };

  return (
    <div className="bg-card rounded-2xl p-6 card-3d border border-border/50 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Providers</h2>
        <Button
          size="sm"
          className="rounded-xl"
          onClick={() => setDraft(EMPTY_DRAFT)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Provider
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="sm" />
        </div>
      ) : (
        <div className="space-y-2">
          {providers.map((p) => (
            <div
              key={p._id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {p.name}
                  {p.title ? ` — ${p.title}` : ''}
                </p>
                {p.serviceName && (
                  <p className="text-xs text-muted-foreground">{p.serviceName}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() =>
                    setDraft({
                      _id: p._id,
                      name: p.name,
                      title: p.title || '',
                      serviceId: serviceId(p.serviceId),
                    })
                  }
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeMut.mutate(p._id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {providers.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No providers yet
            </p>
          )}
        </div>
      )}

      <ProviderDialog draft={draft} onClose={() => setDraft(null)} />
    </div>
  );
};
