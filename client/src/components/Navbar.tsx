import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Image, Users, PenTool, Trophy } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isConnected = true; // Replace with actual wallet connection state
  
  const navItems = [
    {
      label: 'Gallery',
      path: '/gallery',
      icon: <Image className="h-4 w-4" />
    },
    {
    label: 'Competition',
    path: '/competition',
    icon: <Trophy className="h-4 w-4" />
      },
    {
      label: 'Create',
      path: '/create',
      icon: <PenTool className="h-4 w-4" />
    },
    {
      label: 'Community',
      path: '/community',
      icon: <Users className="h-4 w-4" />
    }
  ];

  return (
    <nav className="border-b bg-white">
      <div className="max-w-[2000px] mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => navigate('/')}
            >
              <svg className="h-8 w-8 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xl font-semibold">Mosaic</span>
            </div>

            {/* Navigation Items */}
            <div className="hidden md:flex items-center ml-8 gap-6">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    location.pathname === item.path
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Network Status */}
            {isConnected && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Connected to Ethereum</span>
              </div>
            )}

            {/* Connect Wallet Button */}
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <span>{isConnected ? 'Connected' : 'Connect Wallet'}</span>
            </button>

            {/* Mobile Menu */}
            <button className="md:hidden p-2 rounded-md hover:bg-gray-100">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;