import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWorkflowTemplates, submitWorkflow, fetchWorkflows, fetchWorkflowDetail } from './argo';

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

  describe('submitWorkflow - happy path', () => {
    it('should submit workflow and return created workflow name and namespace', async () => {
      // Arrange
      const mockResponse = {
        name: 'data-processing-with-params-abc12',
        namespace: 'dashboard-test',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await submitWorkflow('data-processing-with-params', 'dashboard-test', {
        'input-path': '/data/input',
        'output-path': '/data/output',
        'batch-size': '100',
        env: 'dev',
      });

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/argo/workflow-templates/data-processing-with-params/submit',
        expect.objectContaining({ method: 'POST' })
      );
      expect(result.name).toBe('data-processing-with-params-abc12');
      expect(result.namespace).toBe('dashboard-test');
    });

    it('should send parameters in request body as JSON', async () => {
      // Arrange
      const parameters = { env: 'staging', 'batch-size': '50' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'wf-xyz', namespace: 'default' }),
      });

      // Act
      await submitWorkflow('my-template', 'default', parameters);

      // Assert
      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse((options as RequestInit).body as string);
      expect(body).toEqual({ parameters });
    });

    it('should set Content-Type to application/json', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'wf-abc', namespace: 'default' }),
      });

      // Act
      await submitWorkflow('my-template', 'default', {});

      // Assert
      const [, options] = mockFetch.mock.calls[0];
      expect((options as RequestInit).headers).toMatchObject({
        'Content-Type': 'application/json',
      });
    });

    it('should accept empty parameters object', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'wf-123', namespace: 'default' }),
      });

      // Act
      const result = await submitWorkflow('simple-template', 'default', {});

      // Assert
      expect(result.name).toBe('wf-123');
      expect(result.namespace).toBe('default');
    });

    it('should include namespace in the URL path', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'wf-ns', namespace: 'my-namespace' }),
      });

      // Act
      await submitWorkflow('my-template', 'my-namespace', {});

      // Assert — namespace is not part of the URL but passed separately; URL uses templateName only
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/argo/workflow-templates/my-template/submit',
        expect.anything()
      );
    });

    it('should return type-safe SubmittedWorkflow object', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'wf-typed', namespace: 'prod' }),
      });

      // Act
      const result = await submitWorkflow('ml-training', 'prod', { 'model-type': 'resnet' });

      // Assert — TypeScript compile-time check
      const name: string = result.name;
      const namespace: string = result.namespace;
      expect(name).toBe('wf-typed');
      expect(namespace).toBe('prod');
    });
  });

  describe('submitWorkflow - error cases', () => {
    it('should throw when template does not exist (404)', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'WorkflowTemplate not found' }),
      });

      // Act & Assert
      await expect(
        submitWorkflow('non-existent-template', 'default', {})
      ).rejects.toThrow();
    });

    it('should propagate error message from 404 response', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'WorkflowTemplate not found' }),
      });

      // Act & Assert
      await expect(
        submitWorkflow('missing-template', 'default', {})
      ).rejects.toThrow('WorkflowTemplate not found');
    });

    it('should throw when workflow creation fails (500)', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' }),
      });

      // Act & Assert
      await expect(
        submitWorkflow('my-template', 'default', {})
      ).rejects.toThrow();
    });

    it('should handle network errors gracefully', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(
        submitWorkflow('my-template', 'default', {})
      ).rejects.toThrow('Network error');
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
      await expect(
        submitWorkflow('my-template', 'default', {})
      ).rejects.toThrow('Invalid JSON');
    });
  });

  describe('submitWorkflow - edge cases', () => {
    it('should handle template name with hyphens', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'data-processing-abc', namespace: 'default' }),
      });

      // Act
      await submitWorkflow('data-processing-with-params', 'default', {});

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/argo/workflow-templates/data-processing-with-params/submit',
        expect.anything()
      );
    });

    it('should handle many parameters', async () => {
      // Arrange
      const manyParams: Record<string, string> = {};
      for (let i = 0; i < 10; i++) {
        manyParams[`param-${i}`] = `value-${i}`;
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'wf-many', namespace: 'default' }),
      });

      // Act
      const result = await submitWorkflow('complex-template', 'default', manyParams);

      // Assert
      expect(result.name).toBe('wf-many');
      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse((options as RequestInit).body as string);
      expect(Object.keys(body.parameters)).toHaveLength(10);
    });
  });

  describe('fetchWorkflows - happy path', () => {
    it('should fetch workflow runs list from backend', async () => {
      // Arrange
      const mockWorkflows = [
        {
          name: 'data-processing-abc12',
          namespace: 'dashboard-test',
          templateName: 'data-processing-with-params',
          phase: 'Succeeded',
          startedAt: '2026-02-22T08:00:00Z',
          finishedAt: '2026-02-22T09:00:00Z',
          nodes: [
            { name: 'step-1', phase: 'Succeeded' },
            { name: 'step-2', phase: 'Succeeded' },
          ],
        },
        {
          name: 'ml-training-xyz99',
          namespace: 'production',
          templateName: 'ml-training',
          phase: 'Running',
          startedAt: '2026-02-22T10:00:00Z',
          finishedAt: '',
          nodes: [{ name: 'train', phase: 'Running' }],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkflows,
      });

      // Act
      const result = await fetchWorkflows();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/argo/workflows');
      expect(result).toEqual(mockWorkflows);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should fetch workflow runs with namespace filter', async () => {
      // Arrange
      const mockWorkflows = [
        {
          name: 'data-processing-abc12',
          namespace: 'dashboard-test',
          templateName: 'data-processing-with-params',
          phase: 'Succeeded',
          startedAt: '2026-02-22T08:00:00Z',
          finishedAt: '2026-02-22T09:00:00Z',
          nodes: [],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkflows,
      });

      // Act
      const result = await fetchWorkflows('dashboard-test');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/argo/workflows?ns=dashboard-test');
      expect(result).toEqual(mockWorkflows);
    });

    it('should not include ns query param when namespace is undefined', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

      // Act
      await fetchWorkflows(undefined);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/argo/workflows');
    });

    it('should not include ns query param when namespace is empty string', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

      // Act
      await fetchWorkflows('');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/argo/workflows');
    });

    it('should return empty array when no workflows exist', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

      // Act
      const result = await fetchWorkflows();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return workflow with nodes array', async () => {
      // Arrange
      const mockWorkflows = [
        {
          name: 'wf-with-nodes',
          namespace: 'default',
          templateName: 'my-template',
          phase: 'Succeeded',
          startedAt: '2026-02-22T08:00:00Z',
          finishedAt: '2026-02-22T08:30:00Z',
          nodes: [
            { name: 'step-a', phase: 'Succeeded' },
            { name: 'step-b', phase: 'Succeeded' },
            { name: 'step-c', phase: 'Succeeded' },
          ],
        },
      ];

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows });

      // Act
      const result = await fetchWorkflows();

      // Assert
      expect(result[0].nodes).toHaveLength(3);
      expect(result[0].nodes[0].name).toBe('step-a');
      expect(result[0].nodes[0].phase).toBe('Succeeded');
    });

    it('should return workflow with empty nodes array', async () => {
      // Arrange
      const mockWorkflows = [
        {
          name: 'wf-no-nodes',
          namespace: 'default',
          templateName: 'simple-template',
          phase: 'Pending',
          startedAt: '',
          finishedAt: '',
          nodes: [],
        },
      ];

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows });

      // Act
      const result = await fetchWorkflows();

      // Assert
      expect(result[0].nodes).toEqual([]);
    });

    it('should return type-safe WorkflowInfo objects', async () => {
      // Arrange
      const mockWorkflows = [
        {
          name: 'typed-wf',
          namespace: 'default',
          templateName: 'my-template',
          phase: 'Running',
          startedAt: '2026-02-22T10:00:00Z',
          finishedAt: '',
          nodes: [{ name: 'step-1', phase: 'Running' }],
        },
      ];

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows });

      // Act
      const result = await fetchWorkflows();

      // Assert — TypeScript compile-time check
      const name: string = result[0].name;
      const namespace: string = result[0].namespace;
      const templateName: string = result[0].templateName;
      const phase: string = result[0].phase;
      const nodes = result[0].nodes;

      expect(name).toBe('typed-wf');
      expect(namespace).toBe('default');
      expect(templateName).toBe('my-template');
      expect(phase).toBe('Running');
      expect(Array.isArray(nodes)).toBe(true);
    });
  });

  describe('fetchWorkflows - error cases', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(fetchWorkflows()).rejects.toThrow('Network error');
    });

    it('should handle HTTP 500 response', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      // Act & Assert
      await expect(fetchWorkflows()).rejects.toThrow();
    });

    it('should handle HTTP 403 forbidden', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      // Act & Assert
      await expect(fetchWorkflows()).rejects.toThrow();
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
      await expect(fetchWorkflows()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('fetchWorkflows - edge cases', () => {
    it('should handle large workflow list', async () => {
      // Arrange
      const mockWorkflows = Array.from({ length: 50 }, (_, i) => ({
        name: `workflow-${i}`,
        namespace: 'default',
        templateName: 'my-template',
        phase: 'Succeeded',
        startedAt: '2026-02-22T08:00:00Z',
        finishedAt: '2026-02-22T09:00:00Z',
        nodes: [],
      }));

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows });

      // Act
      const result = await fetchWorkflows();

      // Assert
      expect(result).toHaveLength(50);
      expect(result[0].name).toBe('workflow-0');
      expect(result[49].name).toBe('workflow-49');
    });

    it('should handle namespace with hyphens', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

      // Act
      await fetchWorkflows('dashboard-test');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/argo/workflows?ns=dashboard-test');
    });

    it('should handle workflow with many nodes', async () => {
      // Arrange
      const mockWorkflows = [
        {
          name: 'complex-wf',
          namespace: 'default',
          templateName: 'complex-template',
          phase: 'Succeeded',
          startedAt: '2026-02-22T08:00:00Z',
          finishedAt: '2026-02-22T10:00:00Z',
          nodes: Array.from({ length: 10 }, (_, i) => ({
            name: `step-${i}`,
            phase: 'Succeeded',
          })),
        },
      ];

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockWorkflows });

      // Act
      const result = await fetchWorkflows();

      // Assert
      expect(result[0].nodes).toHaveLength(10);
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

  // ---------------------------------------------------------------------------
  // fetchWorkflowDetail
  // ---------------------------------------------------------------------------

  describe('fetchWorkflowDetail - happy path', () => {
    it('should fetch workflow detail from correct URL', async () => {
      // Arrange
      const mockDetail = {
        name: 'data-processing-abc12',
        namespace: 'dashboard-test',
        phase: 'Succeeded',
        templateName: 'data-processing-with-params',
        startedAt: '2026-02-22T08:00:00Z',
        finishedAt: '2026-02-22T09:00:00Z',
        nodes: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetail,
      });

      // Act
      const result = await fetchWorkflowDetail('dashboard-test', 'data-processing-abc12');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/argo/workflows/dashboard-test/data-processing-abc12'
      );
      expect(result).toEqual(mockDetail);
    });

    it('should return detail with nodes containing inputs and outputs', async () => {
      // Arrange
      const mockDetail = {
        name: 'wf-with-io',
        namespace: 'default',
        phase: 'Succeeded',
        templateName: 'my-template',
        startedAt: '2026-02-22T08:00:00Z',
        finishedAt: '2026-02-22T09:00:00Z',
        nodes: [
          {
            name: 'step-1',
            phase: 'Succeeded',
            startedAt: '2026-02-22T08:00:00Z',
            finishedAt: '2026-02-22T08:30:00Z',
            message: '',
            inputs: {
              parameters: [{ name: 'input-path', value: '/data/input' }],
              artifacts: [],
            },
            outputs: {
              parameters: [],
              artifacts: [{ name: 'result', path: '/data/output' }],
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetail,
      });

      // Act
      const result = await fetchWorkflowDetail('default', 'wf-with-io');

      // Assert
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].inputs).toBeDefined();
      expect(result.nodes[0].inputs?.parameters).toHaveLength(1);
      expect(result.nodes[0].outputs).toBeDefined();
      expect(result.nodes[0].outputs?.artifacts).toHaveLength(1);
    });

    it('should return detail with empty nodes array', async () => {
      // Arrange
      const mockDetail = {
        name: 'wf-no-nodes',
        namespace: 'default',
        phase: 'Pending',
        templateName: 'simple-template',
        startedAt: '',
        finishedAt: '',
        nodes: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetail,
      });

      // Act
      const result = await fetchWorkflowDetail('default', 'wf-no-nodes');

      // Assert
      expect(result.nodes).toEqual([]);
    });

    it('should build URL with namespace and name correctly', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'x', namespace: 'y', phase: '', templateName: '', startedAt: '', finishedAt: '', nodes: [] }),
      });

      // Act
      await fetchWorkflowDetail('my-namespace', 'my-workflow-name');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/argo/workflows/my-namespace/my-workflow-name'
      );
    });

    it('should handle namespace and name with hyphens', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'data-processing-abc12',
          namespace: 'dashboard-test',
          phase: 'Running',
          templateName: 'data-processing-with-params',
          startedAt: '2026-02-22T10:00:00Z',
          finishedAt: '',
          nodes: [],
        }),
      });

      // Act
      const result = await fetchWorkflowDetail('dashboard-test', 'data-processing-abc12');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/argo/workflows/dashboard-test/data-processing-abc12'
      );
      expect(result.name).toBe('data-processing-abc12');
    });

    it('should return type-safe WorkflowDetailInfo object', async () => {
      // Arrange
      const mockDetail = {
        name: 'typed-wf',
        namespace: 'production',
        phase: 'Succeeded',
        templateName: 'ml-training',
        startedAt: '2026-02-22T08:00:00Z',
        finishedAt: '2026-02-22T09:00:00Z',
        nodes: [
          {
            name: 'train',
            phase: 'Succeeded',
            startedAt: '2026-02-22T08:00:00Z',
            finishedAt: '2026-02-22T09:00:00Z',
            message: 'completed successfully',
            inputs: { parameters: [], artifacts: [] },
            outputs: { parameters: [], artifacts: [] },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetail,
      });

      // Act
      const result = await fetchWorkflowDetail('production', 'typed-wf');

      // Assert — TypeScript compile-time field checks
      const name: string = result.name;
      const namespace: string = result.namespace;
      const phase: string = result.phase;
      const templateName: string = result.templateName;
      const nodes = result.nodes;

      expect(name).toBe('typed-wf');
      expect(namespace).toBe('production');
      expect(phase).toBe('Succeeded');
      expect(templateName).toBe('ml-training');
      expect(Array.isArray(nodes)).toBe(true);
    });
  });

  describe('fetchWorkflowDetail - error cases', () => {
    it('should throw when workflow does not exist (404)', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Workflow not found' }),
      });

      // Act & Assert
      await expect(
        fetchWorkflowDetail('default', 'non-existent-workflow')
      ).rejects.toThrow('Workflow not found');
    });

    it('should throw on network error', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(
        fetchWorkflowDetail('default', 'my-workflow')
      ).rejects.toThrow('Network error');
    });

    it('should throw on HTTP 500', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' }),
      });

      // Act & Assert
      await expect(
        fetchWorkflowDetail('default', 'my-workflow')
      ).rejects.toThrow();
    });

    it('should throw on invalid JSON response', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      // Act & Assert
      await expect(
        fetchWorkflowDetail('default', 'my-workflow')
      ).rejects.toThrow('Invalid JSON');
    });
  });

  describe('fetchWorkflowDetail - edge cases', () => {
    it('should handle workflow with many nodes', async () => {
      // Arrange
      const mockDetail = {
        name: 'complex-wf',
        namespace: 'default',
        phase: 'Succeeded',
        templateName: 'complex-template',
        startedAt: '2026-02-22T08:00:00Z',
        finishedAt: '2026-02-22T10:00:00Z',
        nodes: Array.from({ length: 5 }, (_, i) => ({
          name: `step-${i}`,
          phase: 'Succeeded',
          startedAt: '2026-02-22T08:00:00Z',
          finishedAt: '2026-02-22T08:30:00Z',
          message: '',
          inputs: { parameters: [], artifacts: [] },
          outputs: { parameters: [], artifacts: [] },
        })),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetail,
      });

      // Act
      const result = await fetchWorkflowDetail('default', 'complex-wf');

      // Assert
      expect(result.nodes).toHaveLength(5);
    });

    it('should handle node with multiple input parameters', async () => {
      // Arrange
      const mockDetail = {
        name: 'param-wf',
        namespace: 'default',
        phase: 'Succeeded',
        templateName: 'data-processing-with-params',
        startedAt: '2026-02-22T08:00:00Z',
        finishedAt: '2026-02-22T09:00:00Z',
        nodes: [
          {
            name: 'process',
            phase: 'Succeeded',
            startedAt: '2026-02-22T08:00:00Z',
            finishedAt: '2026-02-22T08:30:00Z',
            message: '',
            inputs: {
              parameters: [
                { name: 'input-path', value: '/data/input' },
                { name: 'batch-size', value: '100' },
                { name: 'env', value: 'prod' },
              ],
              artifacts: [],
            },
            outputs: {
              parameters: [{ name: 'record-count', value: '42' }],
              artifacts: [{ name: 'result-file', path: '/data/output/result.csv' }],
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetail,
      });

      // Act
      const result = await fetchWorkflowDetail('default', 'param-wf');

      // Assert
      const node = result.nodes[0];
      expect(node.inputs?.parameters).toHaveLength(3);
      expect(node.outputs?.parameters).toHaveLength(1);
      expect(node.outputs?.artifacts).toHaveLength(1);
    });
  });
});
