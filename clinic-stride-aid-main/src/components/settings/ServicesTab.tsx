import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/Spinner';
import { useServices, useRemoveService } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { ServiceDialog, type ServiceDraft } from './ServiceDialog';

const EMPTY_DRAFT: ServiceDraft = {
  _id: '',
  name: '',
  duration: 30,
  price: 0,
  category: 'General',
};

export const ServicesTab = () => {
  const { data: services = [], isLoading } = useServices();
  const removeMut = useRemoveService();
  const [draft, setDraft] = useState<ServiceDraft | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(services.map((s) => s.category || 'General'))),
    [services],
  );
  const [activeCat, setActiveCat] = useState(categories[0] || 'General');

  const visible = services.filter(
    (s) => (s.category || 'General') === activeCat,
  );

  return (
    <div className="bg-card rounded-2xl p-6 card-3d border border-border/50 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Services</h2>
        <Button
          size="sm"
          className="rounded-xl"
          onClick={() => setDraft(EMPTY_DRAFT)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Service
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="sm" />
        </div>
      ) : (
        <>
          <div className="flex gap-1 flex-wrap bg-muted/50 rounded-xl p-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCat(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  activeCat === cat
                    ? 'bg-card text-foreground shadow-3d'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {visible.map((s) => (
              <div
                key={s._id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.duration} min · ${s.price}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() =>
                      setDraft({
                        _id: s._id,
                        name: s.name,
                        duration: s.duration,
                        price: s.price || 0,
                        category: s.category || 'General',
                      })
                    }
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeMut.mutate(s._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {visible.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No services in this category
              </p>
            )}
          </div>
        </>
      )}

      <ServiceDialog draft={draft} onClose={() => setDraft(null)} />
    </div>
  );
};
