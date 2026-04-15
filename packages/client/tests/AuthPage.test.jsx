import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthPage from '../src/components/AuthPage.jsx';

// Mock the AuthContext – use a factory so we can control per-test
let mockLoginUser;
let mockRegisterUser;

vi.mock('../src/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    loginUser: (...args) => mockLoginUser(...args),
    registerUser: (...args) => mockRegisterUser(...args),
  }),
}));

beforeEach(() => {
  mockLoginUser = vi.fn().mockResolvedValue(undefined);
  mockRegisterUser = vi.fn().mockResolvedValue(undefined);
});

describe('AuthPage', () => {
  it('renders sign in form by default', () => {
    render(<AuthPage />);
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('agent@farm.co')).toBeInTheDocument();
  });

  it('switches to register form', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByText('Sign up'));
    expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument();
  });

  it('switches back to login form', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByText('Sign up'));
    fireEvent.click(screen.getByText('Sign in'));
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });
});

// ─── Corner‑case / adversarial tests ───────────────────────────────

describe('AuthPage – Corner Cases', () => {
  it('displays error message when login fails', async () => {
    mockLoginUser.mockRejectedValue(new Error('Invalid email or password'));
    render(<AuthPage />);

    fireEvent.change(screen.getByPlaceholderText('agent@farm.co'), { target: { value: 'bad@test.co' } });
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), { target: { value: 'wrongpw' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('clears error when switching between login and register', async () => {
    mockLoginUser.mockRejectedValue(new Error('Server error'));
    render(<AuthPage />);

    fireEvent.change(screen.getByPlaceholderText('agent@farm.co'), { target: { value: 'a@b.co' } });
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(screen.getByText('Server error')).toBeInTheDocument());

    // Switch to register – error should clear
    fireEvent.click(screen.getByText('Sign up'));
    expect(screen.queryByText('Server error')).not.toBeInTheDocument();
  });

  it('shows Loading... and disables button during submission', async () => {
    // Never-resolving promise to keep loading state
    mockLoginUser.mockReturnValue(new Promise(() => {}));
    render(<AuthPage />);

    fireEvent.change(screen.getByPlaceholderText('agent@farm.co'), { target: { value: 'a@b.co' } });
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: 'Loading...' });
      expect(btn).toBeDisabled();
    });
  });

  it('calls onClose after successful login', async () => {
    const onClose = vi.fn();
    render(<AuthPage onClose={onClose} />);

    fireEvent.change(screen.getByPlaceholderText('agent@farm.co'), { target: { value: 'a@b.co' } });
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  it('does NOT call onClose when login fails', async () => {
    mockLoginUser.mockRejectedValue(new Error('nope'));
    const onClose = vi.fn();
    render(<AuthPage onClose={onClose} />);

    fireEvent.change(screen.getByPlaceholderText('agent@farm.co'), { target: { value: 'a@b.co' } });
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(screen.getByText('nope')).toBeInTheDocument());
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls showToast with correct message on signup', async () => {
    const showToast = vi.fn();
    render(<AuthPage showToast={showToast} />);

    fireEvent.click(screen.getByText('Sign up'));
    fireEvent.change(screen.getByPlaceholderText('agent@farm.co'), { target: { value: 'new@test.co' } });
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith('Account created successfully!'));
  });

  it('calls showToast with correct message on login', async () => {
    const showToast = vi.fn();
    render(<AuthPage showToast={showToast} />);

    fireEvent.change(screen.getByPlaceholderText('agent@farm.co'), { target: { value: 'a@b.co' } });
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith('Welcome back!'));
  });

  it('closes when clicking the overlay background', () => {
    const onClose = vi.fn();
    render(<AuthPage onClose={onClose} />);

    // Click the overlay div itself (not a child)
    const overlay = document.querySelector('.auth-overlay');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('does NOT close when clicking inside the card', () => {
    const onClose = vi.fn();
    render(<AuthPage onClose={onClose} />);

    // Click the form heading (inside .auth-card)
    fireEvent.click(screen.getByRole('heading', { name: 'Sign in' }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('re-enables button after failed submission', async () => {
    mockRegisterUser.mockRejectedValue(new Error('Email taken'));
    render(<AuthPage />);

    fireEvent.click(screen.getByText('Sign up'));
    fireEvent.change(screen.getByPlaceholderText('agent@farm.co'), { target: { value: 'dup@t.co' } });
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText('Email taken')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create account' })).not.toBeDisabled();
    });
  });
});
