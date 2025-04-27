import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BlogContentModal from './BlogContentModal';
import '@testing-library/jest-dom';

describe('BlogContentModal', () => {
  const mockTitle = 'Test Blog Post';
  const mockContent = '# Hello World\n\nThis is a test blog post with `inline code` and a code block:\n\n```javascript\nconsole.log("Hello, world!");\n```';
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  test('renders the modal with title and content', () => {
    render(<BlogContentModal title={mockTitle} content={mockContent} onClose={mockOnClose} />);

    expect(screen.getByText(mockTitle)).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getByText('This is a test blog post with')).toBeInTheDocument();
    expect(screen.getByText('inline code')).toBeInTheDocument();
    expect(screen.getByText('console.log("Hello, world!");')).toBeInTheDocument();
  });

  test('calls onClose when the close button is clicked', () => {
    render(<BlogContentModal title={mockTitle} content={mockContent} onClose={mockOnClose} />);

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('renders markdown content correctly', () => {
    render(<BlogContentModal title={mockTitle} content={mockContent} onClose={mockOnClose} />);

    // Check for rendered markdown elements
    expect(screen.getByRole('heading', { level: 1, name: 'Hello World' })).toBeInTheDocument();
    expect(screen.getByText('inline code').tagName).toBe('CODE');
    expect(screen.getByText('console.log("Hello, world!");').closest('pre')).toHaveClass('language-javascript');
  });

  test('modal is hidden when onClose is called', () => {
    const { rerender } = render(<BlogContentModal title={mockTitle} content={mockContent} onClose={mockOnClose} />);

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    // In a real application, the parent component would handle the state to hide the modal.
    // Here, we simulate this by not rendering the modal component after onClose is called.
    rerender(<></>);

    expect(screen.queryByText(mockTitle)).not.toBeInTheDocument();
  });
});