import { Fragment, useState } from 'react';
import { Dialog, Menu, Transition } from '@headlessui/react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import type { RootState, AppDispatch } from '../../store';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'My Petitions', href: '/petitions', icon: '📝' },
 
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-40 flex md:hidden" onClose={setSidebarOpen}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
            <div className="flex flex-shrink-0 items-center px-4 py-3">
              <Dialog.Title className="text-lg font-semibold">Menu</Dialog.Title>
              <button
                type="button"
                className="ml-auto text-gray-500 hover:text-gray-900"
                onClick={() => setSidebarOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="mt-5 flex flex-1 flex-col">
              <nav className="flex-1 space-y-1 px-2">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </a>
                ))}
              </nav>
            </div>
          </Dialog.Panel>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <h1 className="text-xl font-bold">Petition Submission</h1>
            </div>
            <nav className="mt-5 flex-1 space-y-1 bg-white px-2">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 bg-white pl-1 pt-1 sm:pl-3 sm:pt-3 md:hidden">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            ☰
          </button>
        </div>

        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <Menu as="div" className="relative ml-3">
              <Menu.Button className="flex items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  {user?.email.slice(-2)}
                </div>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}

                        
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                      >
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
