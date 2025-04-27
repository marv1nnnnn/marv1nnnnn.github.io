import '@testing-library/jest-dom/vitest'; // Import testing library matchers
// @vitest-environment jsdom
// @vitest-setup ./../test/setup.ts

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MacToolbar from './MacToolbar';
import { vi, type Mock, describe, it, expect, beforeEach, test } from 'vitest';

// Mock the fetch API
global.fetch = vi.fn() as Mock;

describe('MacToolbar', () => {
  beforeEach(() => {
    // Reset the mock before each test
    (fetch as Mock).mockReset();
  });

  test('fetches and displays blog files', async () => {
    const mockBlogFiles = ['test-blog-entry.md', 'another-blog-post.md'];
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBlogFiles,
    });

    const onBlogFileSelectMock = vi.fn();
    render(<MacToolbar onBlogFileSelect={onBlogFileSelectMock} />);

    // Click the "File" span to open the menu (targeting the desktop version)
    fireEvent.click(screen.getAllByText('File')[0]);

    // Wait for the blog files to be displayed
    await waitFor(() => {
      mockBlogFiles.forEach(file => {
        expect(screen.getByText(file)).toBeInTheDocument();
      });
    });

    // Verify fetch was called with the correct endpoint
    expect(fetch).toHaveBeenCalledWith('/api/blog-files');
  });

  test('handles error when fetching blog files', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    // Spy on console.error to check if it's called
    const consoleErrorSpy = vi.spyOn(console, 'error');

    const onBlogFileSelectMock = vi.fn();
    render(<MacToolbar onBlogFileSelect={onBlogFileSelectMock} />);

    // Wait for the error to be logged (or for the component to render without crashing)
    // We don't expect blog files to be displayed in case of an error
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching blog files:',
        expect.any(Error)
      );
    });

    // Ensure no blog file names are rendered
    const mockBlogFiles = ['test-blog-entry', 'another-blog-post'];
    mockBlogFiles.forEach(file => {
      expect(screen.queryByText(file)).not.toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore(); // Restore the spy
  });

  test('displays default menu items', () => {
    // Mock fetch to return an empty array for blog files
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const onBlogFileSelectMock = vi.fn();
    render(<MacToolbar onBlogFileSelect={onBlogFileSelectMock} />);

    // Check for default menu items (targeting the desktop version)
    expect(screen.getAllByText('File')[0]).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Go')).toBeInTheDocument();
    expect(screen.getByText('Window')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
  });

   test('calls onBlogFileSelect with correct arguments on file click', async () => {
     const mockBlogFiles = ['test-blog-entry.md'];
     const mockBlogContent = { content: '## Test Blog Content' };
    // Mock fetch for blog files
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBlogFiles,
    });

    // Mock fetch for blog content
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBlogContent,
    });

   const onBlogFileSelectMock = vi.fn();
   render(<MacToolbar onBlogFileSelect={onBlogFileSelectMock} />);

   // Click the "File" span to open the menu (targeting the desktop version)
   fireEvent.click(screen.getAllByText('File')[0]);

   // Wait for blog files to be displayed and click the file
   await waitFor(() => {
     const fileElement = screen.getByText('test-blog-entry.md');
     expect(fileElement).toBeInTheDocument();
     fileElement.click();
   });

   // Verify onBlogFileSelect was called with the correct arguments
   expect(onBlogFileSelectMock).toHaveBeenCalledWith('test-blog-entry.md', '## Test Blog Content');

   // Verify fetch was called with the correct blog content endpoint
   expect(fetch).toHaveBeenCalledWith('/api/blog-content/test-blog-entry');
 });

 test('handles error when fetching blog content and does not call onBlogFileSelect', async () => {
   const mockBlogFiles = ['test-blog-entry.md'];

   // Mock fetch for blog files
   (fetch as Mock).mockResolvedValueOnce({
     ok: true,
     json: async () => mockBlogFiles,
   });

   // Mock fetch for blog content error
   (fetch as Mock).mockResolvedValueOnce({
     ok: false,
     status: 500,
   });

   // Spy on console.error to check if it's called
   const consoleErrorSpy = vi.spyOn(console, 'error');

   const onBlogFileSelectMock = vi.fn();
   render(<MacToolbar onBlogFileSelect={onBlogFileSelectMock} />);

   // Click the "File" span to open the menu (targeting the desktop version)
   fireEvent.click(screen.getAllByText('File')[0]);

   // Wait for blog files to be displayed and click the file
   await waitFor(() => {
     const fileElement = screen.getByText('test-blog-entry.md');
     expect(fileElement).toBeInTheDocument();
     fileElement.click();
   });

   // Wait for the error to be logged
   await waitFor(() => {
     expect(consoleErrorSpy).toHaveBeenCalledWith(
       'Error fetching blog content for test-blog-entry.md:',
       expect.any(Error)
     );
   });

   // Verify onBlogFileSelect was NOT called
   expect(onBlogFileSelectMock).not.toHaveBeenCalled();

   consoleErrorSpy.mockRestore(); // Restore the spy
 });
});