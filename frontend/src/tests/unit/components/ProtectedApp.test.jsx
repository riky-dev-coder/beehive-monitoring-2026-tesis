import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProtectedApp from '../../../components/Auth/ProtectedApp';
import * as AuthContext from '../../../context/AuthContext';

// Mock the AuthContext
vi.mock('../../../context/AuthContext');

// Mock the App and LoginPage components
vi.mock('../../../App', () => ({
  default: () => <div>App Component</div>,
}));

vi.mock('../../../pages/LoginPage', () => ({
  default: () => <div>Login Page</div>,
}));

describe('ProtectedApp Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state when auth is loading', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      loading: true,
    });

    const { container } = render(<ProtectedApp />);

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should render App when user is logged in', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      loading: false,
    });

    render(<ProtectedApp />);

    expect(screen.getByText('App Component')).toBeInTheDocument();
  });

  it('should render LoginPage when user is not logged in', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      loading: false,
    });

    render(<ProtectedApp />);

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should have loading spinner with correct styling', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      loading: true,
    });

    const { container } = render(<ProtectedApp />);

    const spinner = container.querySelector(
      '.animate-spin.rounded-full.h-12.w-12.border-t-2.border-b-2.border-emerald-500'
    );
    expect(spinner).toBeInTheDocument();
  });

  it('should have dark theme styling', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      loading: true,
    });

    const { container } = render(<ProtectedApp />);

    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('min-h-screen');
    expect(mainDiv).toHaveClass('bg-[#071014]');
    expect(mainDiv).toHaveClass('text-gray-200');
  });

  it('should update when auth state changes', async () => {
    const { rerender } = render(<ProtectedApp />);

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      loading: true,
    });

    rerender(<ProtectedApp />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      loading: false,
    });

    rerender(<ProtectedApp />);
    expect(screen.getByText('App Component')).toBeInTheDocument();
  });

  it('should display loading message', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      loading: true,
    });

    render(<ProtectedApp />);

    const loadingMessage = screen.getByText('Cargando...');
    expect(loadingMessage).toHaveClass('text-gray-400');
  });

  it('should render centered loading state', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      loading: true,
    });

    const { container } = render(<ProtectedApp />);

    const centerDiv = container.querySelector('.flex.items-center.justify-center');
    expect(centerDiv).toBeInTheDocument();

    const textCenterDiv = container.querySelector('.text-center');
    expect(textCenterDiv).toBeInTheDocument();
  });
});
