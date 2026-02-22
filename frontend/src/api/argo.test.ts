import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWorkflowTemplates } from './argo';

// Mock fetch globally with proper typing
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('Argo API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('fetchWorkflowTemplates - happy path', () => {
    it('should fetch workflow templates list from backend', async () => {
      // Arrange
      const mockTemplates = [
        {
          name: 'data-processing-with-params',
          namespace: 'dashboard-test',
          parameters: [
            { name: 'input-path', value: '/data/input' },
            { name: 'output-path', value: '/data/output' },
            { name: 'batch-size', value: '100' },
            { name: 'env', value: 'dev', enum: ['dev', 'staging', 'prod'] },
          ],
        },
        {
          name: 'simple-template',
          namespace: 'dashboard-test',
          parameters: [],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates,
      });

      // Act
      const result = await fetchWorkflowTemplates();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/argo/workflow-templates');
      expect(result).toEqual(mockTemplates);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should fetch workflow templates with namespace filter', async () => {
      // Arrange
      const mockTemplates = [
        {
          name: 'data-processing-with-params',
          namespace: 'dashboard-test',
          parameters: [],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates,
      });

      // Act
      const result = await fetchWorkflowTemplates('dashboard-test');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/argo/workflow-templates?ns=dashboard-test');
      expect(result).toEqual(mockTemplates);
    });

    it('should not include ns query param when namespace is undefined', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      await fetchWorkflowTemplates(undefined);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/argo/workflow-templates');
    });

    it('should not include ns query param when namespace is empty string', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      await fetchWorkflowTemplates('');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/argo/workflow-templates');
    });

    it('should return empty array when no templates exist', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      const result = await fetchWorkflowTemplates();

      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should return template with parameters array', async () => {
      // Arrange
      const mockTemplates = [
        {
          name: 'data-processing-with-params',
          namespace: 'dashboard-test',
          parameters: [
            { name: 'input-path', value: '/data/input' },
            { name: 'output-path', value: '/data/output' },
            { name: 'batch-size', value: '100' },
            {
              name: 'env',
              value: 'dev',
              enum: ['dev', 'staging', 'prod'],
              description: 'Deployment environment',
            },
          ],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates,
      });

      // Act
      const result = await fetchWorkflowTemplates();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('data-processing-with-params');
      expect(result[0].namespace).toBe('dashboard-test');
      expect(result[0].parameters).toHaveLength(4);
    });

    it('should return template with empty parameters array when no params defined', async () => {
      // Arrange
      const mockTemplates = [
        {
          name: 'simple-template',
          namespace: 'dashboard-test',
          parameters: [],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates,
      });

      // Act
      const result = await fetchWorkflowTemplates();

      // Assert
      expect(result[0].parameters).toEqual([]);
      expect(result[0].parameters).toHaveLength(0);
    });

    it('should return parameter with optional fields (description, enum)', async () => {
      // Arrange
      const mockTemplates = [
        {
          name: 'template-with-enum',
          namespace: 'default',
          parameters: [
            {
              name: 'env',
              value: 'dev',
              description: 'Target environment',
              enum: ['dev', 'staging', 'prod'],
            },
          ],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates,
      });

      // Act
      const result = await fetchWorkflowTemplates();

      // Assert
      const param = result[0].parameters[0];
      expect(param.name).toBe('env');
      expect(param.value).toBe('dev');
      expect(param.description).toBe('Target environment');
      expect(param.enum).toEqual(['dev', 'staging', 'prod']);
    });
  });

  describe('fetchWorkflowTemplates - error cases', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(fetchWorkflowTemplates()).rejects.toThrow('Network error');
    });

    it('should handle non-200 responses', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      // Act & Assert
      await expect(fetchWorkflowTemplates()).rejects.toThrow();
    });

    it('should handle 404 not found', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      // Act & Assert
      await expect(fetchWorkflowTemplates()).rejects.toThrow();
    });

    it('should handle 403 forbidden', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      // Act & Assert
      await expect(fetchWorkflowTemplates()).rejects.toThrow();
    });

    it('should handle invalid JSON response', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      // Act & Assert
      await expect(fetchWorkflowTemplates()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('fetchWorkflowTemplates - edge cases', () => {
    it('should handle large templates list', async () => {
      // Arrange
      const mockTemplates = Array.from({ length: 50 }, (_, i) => ({
        name: `template-${i}`,
        namespace: 'default',
        parameters: [],
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates,
      });

      // Act
      const result = await fetchWorkflowTemplates();

      // Assert
      expect(result).toHaveLength(50);
      expect(result[0].name).toBe('template-0');
      expect(result[49].name).toBe('template-49');
    });

    it('should handle templates with many parameters', async () => {
      // Arrange
      const mockTemplates = [
        {
          name: 'complex-template',
          namespace: 'default',
          parameters: Array.from({ length: 10 }, (_, i) => ({
            name: `param-${i}`,
            value: `value-${i}`,
          })),
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates,
      });

      // Act
      const result = await fetchWorkflowTemplates();

      // Assert
      expect(result[0].parameters).toHaveLength(10);
    });

    it('should handle namespace with hyphens', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      await fetchWorkflowTemplates('dashboard-test');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/argo/workflow-templates?ns=dashboard-test');
    });

    it('should return type-safe workflow template objects', async () => {
      // Arrange
      const mockTemplates = [
        {
          name: 'my-template',
          namespace: 'default',
          parameters: [
            { name: 'input', value: 'default-value' },
          ],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates,
      });

      // Act
      const result = await fetchWorkflowTemplates();

      // Assert - TypeScript compile-time check
      const name: string = result[0].name;
      const namespace: string = result[0].namespace;
      const parameters = result[0].parameters;

      expect(name).toBe('my-template');
      expect(namespace).toBe('default');
      expect(Array.isArray(parameters)).toBe(true);
    });
  });
});
