/* eslint-disable react-refresh/only-export-components */
import { LayoutDashboard, PanelLeftClose, PanelLeftOpen, Tags, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const SIDEBAR_STORAGE_KEY = 'admin-sidebar-collapsed';

export const adminNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/categories', label: 'Gestão de categorias', icon: Tags },
  { to: '/users', label: 'Gestão de usuários', icon: Users },
];

function getInitialCollapsedState() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
}

export function AppSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsedState);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'hidden shrink-0 border-r border-zinc-800 bg-zinc-950 text-white transition-[width] duration-200 ease-out lg:block',
          isCollapsed ? 'w-20' : 'w-72',
        )}
      >
        <div className='flex min-h-20 items-center justify-between gap-2 p-4'>
          <div
            className={cn(
              'min-w-0 transition-opacity duration-150',
              isCollapsed && 'pointer-events-none opacity-0',
            )}
          >
            <div className='text-xs font-semibold uppercase tracking-[0.18em] text-orange-400'>
              Pitang
            </div>
            <div className='mt-1 truncate text-lg font-semibold'>Reembolsos</div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='text-zinc-300 hover:bg-white/10 hover:text-white'
                aria-label={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
                onClick={() => setIsCollapsed((current) => !current)}
              >
                {isCollapsed ? <PanelLeftOpen className='size-5' /> : <PanelLeftClose className='size-5' />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side='right'>{isCollapsed ? 'Expandir menu' : 'Recolher menu'}</TooltipContent>
          </Tooltip>
        </div>

        <nav className='space-y-1 px-3'>
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const link = (
              <NavLink
                key={item.to}
                to={item.to}
                aria-label={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white',
                    isCollapsed && 'justify-center px-0',
                    isActive && 'bg-orange-600 text-white shadow-sm shadow-orange-950/30',
                  )
                }
              >
                <Icon className='size-4 shrink-0' />
                <span
                  className={cn(
                    'truncate transition-[opacity,width] duration-150',
                    isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100',
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            );

            if (!isCollapsed) {
              return link;
            }

            return (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side='right'>{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
