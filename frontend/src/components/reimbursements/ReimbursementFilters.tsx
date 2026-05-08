import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ReactNode } from 'react';
import type { Category, RequestStatus, UserSummary } from '@/types/api';
import { reimbursementStatusLabels } from './reimbursementOptions';

const ALL_VALUE = 'ALL';

export function ReimbursementFilters({
  categories,
  categoryId,
  collaboratorId,
  collaborators,
  onCategoryChange,
  onCollaboratorChange,
  onStatusChange,
  showCollaboratorFilter,
  status,
  statusOptions,
}: {
  categories: Category[];
  categoryId: string;
  collaboratorId: string;
  collaborators: UserSummary[];
  onCategoryChange: (categoryId: string) => void;
  onCollaboratorChange: (collaboratorId: string) => void;
  onStatusChange: (status: RequestStatus | '') => void;
  showCollaboratorFilter: boolean;
  status: RequestStatus | '';
  statusOptions: RequestStatus[];
}) {
  return (
    <div className='grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-900'>
      <FilterField label='Categoria'>
        <Select
          value={categoryId || ALL_VALUE}
          onValueChange={(value) => onCategoryChange(value === ALL_VALUE ? '' : value)}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Todas as categorias' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label='Status'>
        <Select
          value={status || ALL_VALUE}
          onValueChange={(value) =>
            onStatusChange(value === ALL_VALUE ? '' : (value as RequestStatus))
          }
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Todos os status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todos os status</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {reimbursementStatusLabels[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      {showCollaboratorFilter ? (
        <FilterField label='Colaborador'>
          <Select
            value={collaboratorId || ALL_VALUE}
            onValueChange={(value) =>
              onCollaboratorChange(value === ALL_VALUE ? '' : value)
            }
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Todos os colaboradores' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todos os colaboradores</SelectItem>
              {collaborators.map((collaborator) => (
                <SelectItem key={collaborator.id} value={collaborator.id}>
                  {collaborator.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      ) : null}
    </div>
  );
}

function FilterField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className='space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-200'>
      <span>{label}</span>
      {children}
    </label>
  );
}
