import { describe, test, expect, beforeEach, vi } from 'vitest';
import { GET } from './blog-files';
import fs from 'fs/promises';
import path from 'path';

// Mock the fs/promises module
vi.mock('fs/promises');

describe('GET /api/blog-files', () => {
  const mockReaddir = fs.readdir as vi.Mock;

  beforeEach(() => {
    // Clear mock before each test
    mockReaddir.mockReset();
  });

  test('should return a list of blog files (without .md extension)', async () => {
    // Mock fs.readdir to return a list of files
    mockReaddir.mockResolvedValueOnce(['test-blog-entry.md', 'another-post.md', 'not-a-blog.txt']);

    // Create a mock request object (not strictly needed for this simple GET)
    const mockRequest = {} as Request;

    // Call the GET function
    const response = await GET({ request: mockRequest } as any);

    // Assert the response status and content
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    const body = await response.json();
    expect(body).toEqual(['test-blog-entry', 'another-post']);
  });

  test('should return an empty array if no markdown files are found', async () => {
    // Mock fs.readdir to return files without .md extension
    mockReaddir.mockResolvedValueOnce(['image.png', 'document.pdf']);

    const mockRequest = {} as Request;
    const response = await GET({ request: mockRequest } as any);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    const body = await response.json();
    expect(body).toEqual([]);
  });

  test('should return 500 if reading the directory fails', async () => {
    // Mock fs.readdir to throw an error
    mockReaddir.mockRejectedValueOnce(new Error('Failed to read directory'));

    const mockRequest = {} as Request;
    const response = await GET({ request: mockRequest } as any);

    expect(response.status).toBe(500);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    const body = await response.json();
    expect(body).toEqual({ error: 'Failed to read blog files' });
  });
});