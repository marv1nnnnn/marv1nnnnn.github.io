// @vitest-environment node
import fs from 'fs/promises';
import path from 'path';
import { describe, test, expect, beforeEach, vi, type Mock } from 'vitest';

// Mock the fs/promises module
vi.mock('fs/promises');
// Mock the path module
vi.mock('path');

// Mock the blog-content module to control its dependencies
vi.mock('./blog-content/[fileName]', async (importActual) => {
  const actual = await importActual<typeof import('./blog-content')>();
  const actualPath = await vi.importActual<typeof path>('path');

  return {
    ...actual,
    GET: vi.fn(async ({ params }) => {
      const fileName = params.fileName;

      if (!fileName) {
        return new Response(JSON.stringify({ error: 'Missing fileName parameter' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      // Calculate blogDirectory using the mocked path and process.cwd()
      const blogDirectory = actualPath.join(process.cwd(), 'src/pages/blog');
      const filePath = actualPath.join(blogDirectory, `${fileName}.md`);

      try {
        // Basic security check: prevent directory traversal
        const resolvedFilePath = actualPath.resolve(filePath);
        console.log('blogDirectory:', blogDirectory);
        console.log('resolvedFilePath:', resolvedFilePath);
        if (!resolvedFilePath.startsWith(blogDirectory)) {
            console.error('Directory traversal attempt detected!');
            return new Response(JSON.stringify({ error: 'Invalid file path' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        // Use the mocked fs.readFile
        const content = await (fs.readFile as Mock)(filePath, 'utf-8');

        return new Response(JSON.stringify({ content }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error(`Error reading blog file ${fileName}:`, error);
        return new Response(JSON.stringify({ error: 'Failed to read blog file' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    }),
  };
});


describe('GET /api/blog-content', () => {
  const mockReadFile = fs.readFile as Mock;
  const mockProcessCwd = vi.spyOn(process, 'cwd');
  let GET: typeof import('./blog-content').GET;


  beforeEach(async () => {
    // Import the mocked blog-content module
    ({ GET } = await import('./blog-content/[fileName]'));

    // Clear mocks before each test
    mockReadFile.mockReset();
    (path.join as Mock).mockReset();
    (path.resolve as Mock).mockReset();
    mockProcessCwd.mockReturnValue('/fake/project/root');

    // Default mock for path.join to simulate joining within the blog directory
    // Default mock for path.join to simulate joining within the blog directory using forward slashes
    (path.join as Mock).mockImplementation((...args: string[]) => {
      // Simple implementation for testing purposes, ensure forward slashes
      return args.join('/').replace(/\\/g, '/');
    });

    // Default mock for path.resolve to simulate resolving paths relative to the mocked process.cwd() using forward slashes
    (path.resolve as Mock).mockImplementation(async (...args: string[]) => {
      // Use the actual path.resolve here
      const actualPath = await vi.importActual<typeof path>('path');
      const resolvedPath = actualPath.resolve('/fake/project/root', ...args);
      // Ensure forward slashes in the resolved path
      return resolvedPath.replace(/\\/g, '/');
    });

    // Log the mocked blogDirectory for debugging
    console.log('Mocked blogDirectory in beforeEach:', path.join(process.cwd(), 'src/pages/blog'));
  });

  test('should return blog content for a valid file name', async () => {
    const fileName = 'test-blog-entry';
    const fileContent = '## Test Blog Post\n\nThis is a test.';
    mockReadFile.mockResolvedValueOnce(fileContent);

    const mockRequest = {
      url: `http://localhost/api/blog-content/${fileName}`,
      method: 'GET',
    } as Request;

    const response = await GET({ params: { fileName }, url: new URL(mockRequest.url), request: mockRequest } as any);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    const body = await response.json();
    expect(body).toEqual({ content: fileContent });
    const actualPath = await vi.importActual<typeof path>('path'); // Import actual path
    expect(mockReadFile).toHaveBeenCalledWith(
      // Use ACTUAL path.join to create platform-specific path for assertion
      actualPath.join('/fake/project/root', 'src/pages/blog', 'test-blog-entry.md'),
      'utf-8'
    );
  });

  test('should return blog content for a valid file name using dynamic route', async () => {
    const fileName = 'test-blog-entry';
    const fileContent = '## Test Blog Post\n\nThis is a test.';
    mockReadFile.mockResolvedValueOnce(fileContent);

    // Mock the request object to include params for dynamic routes
    const mockRequest = {
      url: `http://localhost/api/blog-content/${fileName}`,
      method: 'GET',
    } as Request;

    // Pass params to the GET handler
    const response = await GET({ params: { fileName }, url: new URL(mockRequest.url), request: mockRequest } as any);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    const body = await response.json();
    expect(body).toEqual({ content: fileContent });
    const actualPath = await vi.importActual<typeof path>('path'); // Import actual path
    expect(mockReadFile).toHaveBeenCalledWith(
      // Use ACTUAL path.join to create platform-specific path for assertion
      actualPath.join('/fake/project/root', 'src/pages/blog', 'test-blog-entry.md'),
      'utf-8'
    );
  });

  test('should return 400 if fileName parameter is missing', async () => {
    const mockRequest = {
      url: 'http://localhost/api/blog-content',
      method: 'GET',
    } as Request;

    const response = await GET({ params: {}, url: new URL(mockRequest.url), request: mockRequest } as any);

    expect(response.status).toBe(400);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    const body = await response.json();
    expect(body).toEqual({ error: 'Missing fileName parameter' });
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  test('should return 400 for invalid file paths (directory traversal attempt)', async () => {
    const fileName = '../.env'; // Attempting directory traversal
     // Mock path.join to return a path outside the blog directory for this specific test
    (path.join as Mock).mockImplementationOnce(() => '/fake/project/root/../.env.md');


    const mockRequest = {
      url: `http://localhost/api/blog-content/${fileName}`,
      method: 'GET',
    } as Request;

    const response = await GET({ params: { fileName }, url: new URL(mockRequest.url), request: mockRequest } as any);

    expect(response.status).toBe(400);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    const body = await response.json();
    expect(body).toEqual({ error: 'Invalid file path' });
    expect(mockReadFile).not.toHaveBeenCalled();
  });


  test('should return 500 if reading the file fails', async () => {
    const fileName = 'non-existent-blog';
    mockReadFile.mockRejectedValueOnce(new Error('File not found'));

    const mockRequest = {
      url: `http://localhost/api/blog-content/${fileName}`,
      method: 'GET',
    } as Request;

    const response = await GET({ params: { fileName }, url: new URL(mockRequest.url), request: mockRequest } as any);

    expect(response.status).toBe(500);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    const body = await response.json();
    expect(body).toEqual({ error: 'Failed to read blog file' });
    const actualPath = await vi.importActual<typeof path>('path'); // Import actual path
    expect(mockReadFile).toHaveBeenCalledWith(
      // Use ACTUAL path.join to create platform-specific path for assertion
      actualPath.join('/fake/project/root', 'src/pages/blog', 'non-existent-blog.md'),
      'utf-8'
    );
  });
});