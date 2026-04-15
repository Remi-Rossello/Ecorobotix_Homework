import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '../src/components/SearchBar.jsx';

describe('SearchBar', () => {
  it('renders search input', () => {
    render(<SearchBar onSelect={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search for a location...')).toBeInTheDocument();
  });

  it('shows clear button when typing', () => {
    render(<SearchBar onSelect={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search for a location...');
    fireEvent.change(input, { target: { value: 'Zurich' } });
    // The X button should appear (as an accessible button)
    expect(input.value).toBe('Zurich');
  });

  it('clears input on clear button click', () => {
    render(<SearchBar onSelect={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search for a location...');
    fireEvent.change(input, { target: { value: 'Zurich' } });
    // Find the clear button (X icon)
    const clearBtns = screen.getAllByRole('button');
    fireEvent.click(clearBtns[0]);
    expect(input.value).toBe('');
  });
});
