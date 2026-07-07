import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  /** Width override — e.g. 'w-48', 'w-64', 'w-full'. Default 'w-64'. */
  width?: string;
  className?: string;
}

/**
 * Search input with a leading magnifier icon. Standardized so every
 * list page renders the same control without inlining the icon
 * positioning.
 */
export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search...',
  width = 'w-64',
  className,
}: Props) => (
  <div className={cn('relative', width, className)}>
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    <Input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="pl-9 h-9 rounded-xl text-sm"
    />
  </div>
);
