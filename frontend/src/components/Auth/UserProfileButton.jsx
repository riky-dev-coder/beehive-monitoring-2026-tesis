import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function UserProfileButton() {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 bg-[#0f1b1a] border border-gray-800 rounded-lg text-sm text-gray-300 hover:border-emerald-600 transition-colors"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
        <span className="truncate max-w-[150px]" title={user.email}>
          {user.email}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-[#0f1720] border border-gray-800 rounded-lg shadow-lg z-10">
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-xs text-gray-400">Sesión actual</p>
            <p className="text-sm text-gray-200 truncate font-medium" title={user.email}>
              {user.email}
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              setShowMenu(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#071014] hover:text-red-400 transition-colors text-red-400 hover:text-red-300"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
