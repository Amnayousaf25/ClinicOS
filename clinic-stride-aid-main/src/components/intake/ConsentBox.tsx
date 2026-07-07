import { Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  error?: string;
}

export const ConsentBox = ({ checked, onChange, error }: Props) => (
  <>
    <div
      role="button"
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className={cn(
        'relative p-3 rounded-xl border cursor-pointer transition-colors',
        checked
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/40',
      )}
    >
      <div
        className={cn(
          'absolute top-3 right-3 h-5 w-5 rounded border flex items-center justify-center',
          checked
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-input',
        )}
      >
        {checked ? <Check className="h-3.5 w-3.5" /> : null}
      </div>
      <div className="space-y-0.5 pr-8">
        <Label htmlFor="consent" className="text-sm cursor-pointer">
          I consent to data collection *
        </Label>
        <p className="text-xs text-muted-foreground">
          I agree to the collection and processing of my personal health
          information.
        </p>
      </div>
      <input
        id="consent"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
    </div>
    {error && <p className="text-xs text-destructive">{error}</p>}
  </>
);
