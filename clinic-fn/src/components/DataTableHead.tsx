import { cn } from '@/lib/utils';

export interface DataTableColumn {
  label: string;
  align?: 'left' | 'center' | 'right';
  show?: boolean;
  className?: string;
}

interface Props {
  columns: DataTableColumn[];
  /** Override per-cell padding (e.g. 'px-4 py-3' for compact tables). */
  cellClassName?: string;
}

/**
 * Standard table header row — uses the app's neutral muted/border styling.
 * Pass `show: false` to omit a column conditionally without filtering at the
 * call site.
 */
export const DataTableHead = ({ columns, cellClassName }: Props) => (
  <thead>
    <tr className="border-b border-border bg-muted/30">
      {columns
        .filter((c) => c.show !== false)
        .map((c) => (
          <th
            key={c.label}
            className={cn(
              'text-xs font-semibold text-muted-foreground whitespace-nowrap',
              cellClassName ?? 'px-5 py-3',
              c.align === 'center'
                ? 'text-center'
                : c.align === 'right'
                  ? 'text-right'
                  : 'text-left',
              c.className,
            )}
          >
            {c.label}
          </th>
        ))}
    </tr>
  </thead>
);
