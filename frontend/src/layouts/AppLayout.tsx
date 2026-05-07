import { LogOut, Menu } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { adminNavItems, AppSidebar } from '@/components/AppSidebar';
import { RoleBadge } from '@/components/RoleBadge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className='min-h-screen bg-zinc-100 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50'>
      <div className='flex min-h-screen'>
        {user?.role === 'ADMIN' ? <AppSidebar /> : null}
        <div className='flex min-w-0 flex-1 flex-col'>
          <header className='sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95'>
            <div className='flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8'>
              <div className='flex min-w-0 items-center gap-3'>
                {user?.role === 'ADMIN' ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='lg:hidden'
                        aria-label='Abrir navegação'
                      >
                        <Menu className='size-5' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className='w-64' align='start'>
                      {adminNavItems.map((item) => {
                        const Icon = item.icon;

                        return (
                          <DropdownMenuItem key={item.to} asChild>
                            <Link
                              to={item.to}
                              className='flex items-center gap-2'
                            >
                              <Icon className='size-4' />
                              {item.label}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
                <Link to='/dashboard' className='min-w-0'>
                  <div className='text-xs font-semibold uppercase tracking-[0.18em] text-orange-600'>
                    Pitang
                  </div>
                  <div className='truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50'>
                    Console de reembolsos
                  </div>
                </Link>
              </div>

              <div className='flex min-w-0 items-center gap-3'>
                <div className='hidden min-w-0 text-right sm:block'>
                  <div className='truncate text-sm font-medium'>
                    {user?.name}
                  </div>
                  {user ? <RoleBadge role={user.role} /> : null}
                </div>
              </div>

              <div className='flex min-w-0 items-center gap-3'>
                <ThemeToggle />
                <Button variant='outline' onClick={logout} className='gap-2'>
                  <LogOut className='size-4' />
                  Sair
                </Button>
              </div>
            </div>
          </header>
          <main className='flex-1 px-4 py-6 sm:px-6 lg:px-8'>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
