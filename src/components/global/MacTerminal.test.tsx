// @vitest-environment jsdom
// @vitest-setup ./../test/setup.ts

import { render, screen, fireEvent } from '@testing-library/react';
import MacTerminal from './MacTerminal';
import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';

// Mock the IntersectionObserver
const mockIntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

describe('MacTerminal', () => {
  // Mock window.innerHeight and window.innerWidth for centering
  const originalInnerHeight = window.innerHeight;
  const originalInnerWidth = window.innerWidth;

  beforeAll(() => {
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 800 });
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1200 });
  });

  afterAll(() => {
    Object.defineProperty(window, 'innerHeight', { writable: true, value: originalInnerHeight });
    Object.defineProperty(window, 'innerWidth', { writable: true, value: originalInnerWidth });
  });

  it('renders the terminal component', () => {
    render(<MacTerminal />);
    expect(screen.getByText(/Welcome to My Portfolio/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your question...')).toBeInTheDocument();
  });

  it('shows the drag icon when the mouse is near the top bar', () => {
    render(<MacTerminal />);
    const terminal = screen.getByTestId('mac-terminal'); // Updated query
    const dragIcon = screen.getByTestId('drag-icon'); // Add data-testid to the icon span

    // Simulate mouse entering the terminal near the top
    fireEvent.mouseMove(terminal, { clientY: 10 }); // Assuming top bar height is around 24px

    expect(dragIcon).toHaveStyle('opacity: 1');
  });

  it('hides the drag icon when the mouse is away from the top bar', () => {
    render(<MacTerminal />);
    const terminal = screen.getByTestId('mac-terminal'); // Updated query
    const dragIcon = screen.getByTestId('drag-icon');

    // Simulate mouse entering the terminal near the top first
    fireEvent.mouseMove(terminal, { clientY: 10 });
    expect(dragIcon).toHaveStyle('opacity: 1');

    // Simulate mouse moving away from the top
    fireEvent.mouseMove(terminal, { clientY: 100 });

    expect(dragIcon).toHaveStyle('opacity: 0');
  });

  it('hides the drag icon when the mouse leaves the terminal', () => {
    render(<MacTerminal />);
    const terminal = screen.getByTestId('mac-terminal'); // Updated query
    const dragIcon = screen.getByTestId('drag-icon');

    // Simulate mouse entering the terminal near the top first
    fireEvent.mouseMove(terminal, { clientY: 10 });
    expect(dragIcon).toHaveStyle('opacity: 1');

    // Simulate mouse leaving the terminal
    fireEvent.mouseLeave(terminal);

    expect(dragIcon).toHaveStyle('opacity: 0');
  });
});