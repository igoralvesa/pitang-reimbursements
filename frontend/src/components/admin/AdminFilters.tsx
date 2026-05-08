import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function AdminFilters<TFilter extends string>({
  filterLabel,
  filterOptions,
  filterValue,
  onFilterChange,
  onSearchChange,
  searchLabel,
  searchPlaceholder,
  searchValue,
  isEmpty,
}: {
  filterLabel?: string;
  filterOptions?: Array<{ label: string; value: TFilter }>;
  filterValue?: TFilter;
  onFilterChange?: (value: TFilter) => void;
  onSearchChange: (value: string) => void;
  searchLabel: string;
  searchPlaceholder: string;
  searchValue: string;
  isEmpty?: boolean;
}) {
  return (
    <Card className='bg-white dark:bg-zinc-900'>
      <CardContent className='p-4'>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
          <div className='relative flex-1'>
            <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400' />
            <Input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className='pl-9'
              aria-label={searchLabel}
              disabled={isEmpty}
            />
          </div>
          {filterOptions && filterValue && onFilterChange && filterLabel ? (
            <Select
              value={filterValue}
              onValueChange={(value) => onFilterChange(value as TFilter)}
            >
              <SelectTrigger
                className='w-full bg-white lg:w-56 dark:bg-zinc-900'
                aria-label={filterLabel}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
