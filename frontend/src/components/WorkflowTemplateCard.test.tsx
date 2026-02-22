import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkflowTemplateCard } from './WorkflowTemplateCard';

// Sample template data matching the API response shape
const mockTemplateWithParams = {
  name: 'data-processing-with-params',
  namespace: 'dashboard-test',
  parameters: [
    { name: 'input-path', value: '/data/input' },
    { name: 'output-path', value: '/data/output' },
    { name: 'batch-size', value: '100' },
    { name: 'env', value: 'dev', enum: ['dev', 'staging', 'prod'] },
  ],
};

const mockTemplateNoParams = {
  name: 'simple-template',
  namespace: 'dashboard-test',
  parameters: [],
};

const mockTemplateWithDescription = {
  name: 'ml-training',
  namespace: 'production',
  parameters: [
    { name: 'model-type', value: 'resnet', description: 'ML model architecture' },
  ],
};

describe('WorkflowTemplateCard Component', () => {
  describe('Basic Rendering', () => {
    it('should render workflow template card container', () => {
      // Arrange & Act
      render(<WorkflowTemplateCard {...mockTemplateWithParams} />);

      // Assert
      const card = screen.getByTestId('workflow-template-card');
      expect(card).toBeInTheDocument();
    });

    it('should display template name', () => {
      // Arrange & Act
      render(<WorkflowTemplateCard {...mockTemplateWithParams} />);

      // Assert
      const name = screen.getByTestId('workflow-template-name');
      expect(name).toBeInTheDocument();
      expect(name).toHaveTextContent('data-processing-with-params');
    });

    it('should display template namespace', () => {
      // Arrange & Act
      render(<WorkflowTemplateCard {...mockTemplateWithParams} />);

      // Assert
      const namespace = screen.getByTestId('workflow-template-namespace');
      expect(namespace).toBeInTheDocument();
      expect(namespace).toHaveTextContent('dashboard-test');
    });

    it('should display parameters section', () => {
      // Arrange & Act
      render(<WorkflowTemplateCard {...mockTemplateWithParams} />);

      // Assert
      const params = screen.getByTestId('workflow-template-params');
      expect(params).toBeInTheDocument();
    });
  });

  describe('Parameters Display', () => {
    it('should render parameter tags for each parameter', () => {
      // Arrange & Act
      render(<WorkflowTemplateCard {...mockTemplateWithParams} />);

      // Assert
      const paramTags = screen.getAllByTestId('workflow-template-param-tag');
      expect(paramTags).toHaveLength(4);
    });

    it('should display parameter name in tag', () => {
      // Arrange & Act
      render(<WorkflowTemplateCard {...mockTemplateWithParams} />);

      // Assert
      expect(screen.getByText('input-path')).toBeInTheDocument();
      expect(screen.getByText('output-path')).toBeInTheDocument();
      expect(screen.getByText('batch-size')).toBeInTheDocument();
      expect(screen.getByText('env')).toBeInTheDocument();
    });

    it('should show "No parameters" when parameters array is empty', () => {
      // Arrange & Act
      render(<WorkflowTemplateCard {...mockTemplateNoParams} />);

      // Assert
      expect(screen.getByText('No parameters')).toBeInTheDocument();
    });

    it('should not render parameter tags when parameters is empty', () => {
      // Arrange & Act
      render(<WorkflowTemplateCard {...mockTemplateNoParams} />);

      // Assert
      const paramTags = screen.queryAllByTestId('workflow-template-param-tag');
      expect(paramTags).toHaveLength(0);
    });

    it('should render single parameter tag for single parameter', () => {
      // Arrange
      const templateWithOneParam = {
        name: 'single-param-template',
        namespace: 'default',
        parameters: [{ name: 'input', value: 'value' }],
      };

      // Act
      render(<WorkflowTemplateCard {...templateWithOneParam} />);

      // Assert
      const paramTags = screen.getAllByTestId('workflow-template-param-tag');
      expect(paramTags).toHaveLength(1);
      expect(screen.getByText('input')).toBeInTheDocument();
    });

    it('should render all 4 parameter tags for data-processing-with-params fixture', () => {
      // Arrange & Act
      render(<WorkflowTemplateCard {...mockTemplateWithParams} />);

      // Assert: exactly 4 param tags for the fixture template
      const paramTags = screen.getAllByTestId('workflow-template-param-tag');
      expect(paramTags).toHaveLength(4);
    });
  });

  describe('Template Name and Namespace', () => {
    it('should display correct name for different templates', () => {
      // Arrange & Act
      render(<WorkflowTemplateCard {...mockTemplateNoParams} />);

      // Assert
      const name = screen.getByTestId('workflow-template-name');
      expect(name).toHaveTextContent('simple-template');
    });

    it('should display correct namespace for different namespaces', () => {
      // Arrange & Act
      render(<WorkflowTemplateCard {...mockTemplateWithDescription} />);

      // Assert
      const namespace = screen.getByTestId('workflow-template-namespace');
      expect(namespace).toHaveTextContent('production');
    });

    it('should handle template names with hyphens', () => {
      // Arrange
      const template = {
        name: 'my-complex-workflow-template',
        namespace: 'my-app-namespace',
        parameters: [],
      };

      // Act
      render(<WorkflowTemplateCard {...template} />);

      // Assert
      expect(screen.getByTestId('workflow-template-name')).toHaveTextContent(
        'my-complex-workflow-template'
      );
      expect(screen.getByTestId('workflow-template-namespace')).toHaveTextContent(
        'my-app-namespace'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle template with many parameters', () => {
      // Arrange
      const templateWithManyParams = {
        name: 'complex-template',
        namespace: 'default',
        parameters: Array.from({ length: 10 }, (_, i) => ({
          name: `param-${i}`,
          value: `value-${i}`,
        })),
      };

      // Act
      render(<WorkflowTemplateCard {...templateWithManyParams} />);

      // Assert
      const paramTags = screen.getAllByTestId('workflow-template-param-tag');
      expect(paramTags).toHaveLength(10);
    });

    it('should handle parameter with enum field', () => {
      // Arrange
      const templateWithEnum = {
        name: 'env-template',
        namespace: 'default',
        parameters: [
          { name: 'env', value: 'dev', enum: ['dev', 'staging', 'prod'] },
        ],
      };

      // Act
      render(<WorkflowTemplateCard {...templateWithEnum} />);

      // Assert
      const paramTag = screen.getByTestId('workflow-template-param-tag');
      expect(paramTag).toBeInTheDocument();
      expect(screen.getByText('env')).toBeInTheDocument();
    });

    it('should handle parameter with description field', () => {
      // Arrange & Act
      render(<WorkflowTemplateCard {...mockTemplateWithDescription} />);

      // Assert: card should render without error
      const card = screen.getByTestId('workflow-template-card');
      expect(card).toBeInTheDocument();
    });

    it('should handle parameter without value field', () => {
      // Arrange
      const templateWithNoValue = {
        name: 'template-no-value',
        namespace: 'default',
        parameters: [
          { name: 'param-without-value' },
        ],
      };

      // Act
      render(<WorkflowTemplateCard {...templateWithNoValue} />);

      // Assert: should render without crashing
      const paramTag = screen.getByTestId('workflow-template-param-tag');
      expect(paramTag).toBeInTheDocument();
      expect(screen.getByText('param-without-value')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper structure for screen readers', () => {
      // Arrange & Act
      render(<WorkflowTemplateCard {...mockTemplateWithParams} />);

      // Assert: name should be visible/accessible
      const name = screen.getByTestId('workflow-template-name');
      expect(name).toBeVisible();

      // Assert: namespace should be visible/accessible
      const namespace = screen.getByTestId('workflow-template-namespace');
      expect(namespace).toBeVisible();
    });
  });
});
