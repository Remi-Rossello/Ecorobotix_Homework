import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsTab from '../src/components/SettingsTab.jsx';

const defaultProps = {
  tempUnit: 'celsius',
  onTempUnitChange: vi.fn(),
  theme: 'light',
  onThemeChange: vi.fn(),
  onDeleteAccount: vi.fn().mockResolvedValue(undefined),
};

describe('SettingsTab – Delete Account', () => {
  it('renders the delete account section', () => {
    render(<SettingsTab {...defaultProps} />);
    expect(screen.getByText('Delete Account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('shows confirm/cancel buttons after clicking Delete', () => {
    render(<SettingsTab {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('hides confirmation when Cancel is clicked', () => {
    render(<SettingsTab {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
  });

  it('calls onDeleteAccount when Confirm is clicked', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<SettingsTab {...defaultProps} onDeleteAccount={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledOnce());
  });

  it('shows Deleting... state while in progress', async () => {
    // Never-resolving promise to keep the deleting state
    const onDelete = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<SettingsTab {...defaultProps} onDeleteAccount={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled();
    });
  });

  it('resets UI on delete failure', async () => {
    const onDelete = vi.fn().mockRejectedValue(new Error('fail'));
    render(<SettingsTab {...defaultProps} onDeleteAccount={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });
  });
});

// ─── Corner‑case / adversarial tests ───────────────────────────────

describe('SettingsTab – Corner Cases', () => {
  it('Cancel button is disabled while deletion is in progress', async () => {
    const onDelete = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<SettingsTab {...defaultProps} onDeleteAccount={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });
  });

  it('Confirm button is disabled while deletion is in progress (no double fire)', async () => {
    const onDelete = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<SettingsTab {...defaultProps} onDeleteAccount={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled();
    });

    // Try clicking again — should not fire a second call
    fireEvent.click(screen.getByRole('button', { name: 'Deleting...' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('rapid Delete→Confirm click only calls onDeleteAccount once', async () => {
    let resolveDelete;
    const onDelete = vi.fn().mockImplementation(() => new Promise((r) => { resolveDelete = r; }));
    render(<SettingsTab {...defaultProps} onDeleteAccount={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    // Rapidly click Confirm multiple times
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    fireEvent.click(screen.getByRole('button', { name: 'Deleting...' }));
    fireEvent.click(screen.getByRole('button', { name: 'Deleting...' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    resolveDelete();
  });

  it('toggling temp unit calls the handler with exact value', () => {
    const onTempChange = vi.fn();
    render(<SettingsTab {...defaultProps} onTempUnitChange={onTempChange} />);

    fireEvent.click(screen.getByRole('button', { name: '°F' }));
    expect(onTempChange).toHaveBeenCalledWith('fahrenheit');

    fireEvent.click(screen.getByRole('button', { name: '°C' }));
    expect(onTempChange).toHaveBeenCalledWith('celsius');
  });

  it('toggling theme calls the handler with exact value', () => {
    const onThemeChange = vi.fn();
    render(<SettingsTab {...defaultProps} onThemeChange={onThemeChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Dark/i }));
    expect(onThemeChange).toHaveBeenCalledWith('dark');

    fireEvent.click(screen.getByRole('button', { name: /Light/i }));
    expect(onThemeChange).toHaveBeenCalledWith('light');
  });

  it('active toggle has "active" class based on props', () => {
    const { rerender } = render(<SettingsTab {...defaultProps} tempUnit="celsius" />);
    const celsiusBtn = screen.getByRole('button', { name: '°C' });
    const fahrenheitBtn = screen.getByRole('button', { name: '°F' });

    expect(celsiusBtn.className).toContain('active');
    expect(fahrenheitBtn.className).not.toContain('active');

    rerender(<SettingsTab {...defaultProps} tempUnit="fahrenheit" />);
    expect(celsiusBtn.className).not.toContain('active');
    expect(fahrenheitBtn.className).toContain('active');
  });

  it('delete confirmation is independent across re-renders', () => {
    const { rerender } = render(<SettingsTab {...defaultProps} tempUnit="celsius" />);

    // Open confirm dialog
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();

    // Re-render with different props — confirm should persist (same component instance)
    rerender(<SettingsTab {...defaultProps} tempUnit="fahrenheit" />);
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });
});
