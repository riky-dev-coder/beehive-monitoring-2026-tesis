import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const { login, signup, error: authError } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Validaciones básicas
    if (!email || !password) {
      setLocalError('Email y contraseña son requeridos');
      return;
    }

    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (isSignup && password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }

    setSubmitting(true);

    if (isSignup) {
      const { error } = await signup(email, password);
      if (error) {
        setLocalError(error);
      }
    } else {
      const { error } = await login(email, password);
      if (error) {
        setLocalError(error);
      }
    }

    setSubmitting(false);
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen bg-[#071014] text-gray-200 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="rounded-md px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-400 text-black font-bold text-lg">
              Monitor de Colmenas
            </div>
          </div>
          <p className="text-gray-400">Sistema Inteligente de Monitoreo Apícola</p>
        </div>

        {/* Card de login */}
        <div className="bg-[#0f1720] border border-gray-800 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-100 mb-6 text-center">
            {isSignup ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 bg-[#071014] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                disabled={submitting}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-3 bg-[#071014] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                disabled={submitting}
              />
            </div>

            {/* Confirmación de contraseña (solo en signup) */}
            {isSignup && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-4 py-3 bg-[#071014] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  disabled={submitting}
                />
              </div>
            )}

            {/* Mensaje de error */}
            {displayError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                {displayError}
              </div>
            )}

            {/* Botón de submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-400 text-black font-semibold py-3 rounded-lg hover:from-emerald-500 hover:to-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Cargando...' : isSignup ? 'Registrarse' : 'Ingresar'}
            </button>
          </form>

          {/* Toggle entre login/signup */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {isSignup ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
              <button
                onClick={() => {
                  setIsSignup(!isSignup);
                  setLocalError('');
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                disabled={submitting}
                className="ml-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors disabled:cursor-not-allowed"
              >
                {isSignup ? 'Inicia sesión aquí' : 'Regístrate aquí'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-xs">
          <p>© {new Date().getFullYear()} Beehive Monitor - Sistema inteligente de monitoreo apícola</p>
        </div>
      </div>
    </div>
  );
}
