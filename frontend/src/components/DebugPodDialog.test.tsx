import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DebugPodDialog, DEBUG_IMAGE_PRESETS } from './DebugPodDialog';
import type { PodDetails, DebugPodResult } from '../api/pods';

const samplePod: PodDetails = {
  name: 'web',
  namespace: 'default',
  status: 'Running',
  restarts: 0,
  node: 'node-1',
  age: '5m',
  containers: ['app', 'sidecar'],
  initContainers: [],
};

function successResult(container = 'debugger-1'): DebugPodResult {
  return { container, ready: true };
}

describe('DebugPodDialog', () => {
  it('renders image presets and target container options when open', () => {
    render(
      <DebugPodDialog
        isOpen
        pod={samplePod}
        onCancel={vi.fn()}
        onSubmit={vi.fn(() => Promise.resolve(successResult()))}
      />,
    );

    const imageSelect = screen.getByTestId('debug-image-select') as HTMLSelectElement;
    expect(imageSelect).toBeInTheDocument();

    // Every preset value must be selectable.
    for (const preset of DEBUG_IMAGE_PRESETS) {
      expect(
        imageSelect.querySelector(`option[value="${preset.value}"]`),
      ).toBeInTheDocument();
    }
    expect(imageSelect.querySelector('option[value="__custom__"]')).toBeInTheDocument();

    const targetSelect = screen.getByTestId('debug-target-select') as HTMLSelectElement;
    expect(targetSelect.querySelector('option[value=""]')).toBeInTheDocument();
    expect(targetSelect.querySelector('option[value="app"]')).toBeInTheDocument();
    expect(targetSelect.querySelector('option[value="sidecar"]')).toBeInTheDocument();
  });

  it('returns null-shaped hidden placeholder when not open', () => {
    const { container } = render(
      <DebugPodDialog
        isOpen={false}
        pod={samplePod}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    // Placeholder is hidden with display:none and aria-hidden.
    const placeholder = container.querySelector('[data-testid="debug-pod-dialog"]');
    expect(placeholder).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows custom image input when "Custom..." is selected', async () => {
    const user = userEvent.setup();
    render(
      <DebugPodDialog
        isOpen
        pod={samplePod}
        onCancel={vi.fn()}
        onSubmit={vi.fn(() => Promise.resolve(successResult()))}
      />,
    );

    expect(screen.queryByTestId('debug-image-custom-input')).not.toBeInTheDocument();
    await user.selectOptions(screen.getByTestId('debug-image-select'), '__custom__');
    expect(screen.getByTestId('debug-image-custom-input')).toBeInTheDocument();
  });

  it('submits preset image and target container to onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => Promise.resolve(successResult()));
    render(
      <DebugPodDialog isOpen pod={samplePod} onCancel={vi.fn()} onSubmit={onSubmit} />,
    );

    await user.selectOptions(screen.getByTestId('debug-image-select'), 'busybox:1.36');
    await user.selectOptions(screen.getByTestId('debug-target-select'), 'app');
    await user.click(screen.getByTestId('debug-pod-submit'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit).toHaveBeenCalledWith({
      image: 'busybox:1.36',
      targetContainer: 'app',
      allowPtrace: undefined,
      allowSysAdmin: undefined,
    });
  });

  it('uses trimmed custom image when selected', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => Promise.resolve(successResult()));
    render(
      <DebugPodDialog isOpen pod={samplePod} onCancel={vi.fn()} onSubmit={onSubmit} />,
    );

    await user.selectOptions(screen.getByTestId('debug-image-select'), '__custom__');
    await user.type(
      screen.getByTestId('debug-image-custom-input'),
      '  my/custom:tag  ',
    );
    await user.click(screen.getByTestId('debug-pod-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith({
      image: 'my/custom:tag',
      targetContainer: undefined,
      allowPtrace: undefined,
      allowSysAdmin: undefined,
    });
  });

  it('forwards allowPtrace=true when the checkbox is ticked', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => Promise.resolve(successResult()));
    render(
      <DebugPodDialog isOpen pod={samplePod} onCancel={vi.fn()} onSubmit={onSubmit} />,
    );

    await user.click(screen.getByTestId('debug-ptrace-checkbox'));
    await user.click(screen.getByTestId('debug-pod-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ allowPtrace: true }),
    );
  });

  it('forwards allowSysAdmin=true when the checkbox is ticked', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => Promise.resolve(successResult()));
    render(
      <DebugPodDialog isOpen pod={samplePod} onCancel={vi.fn()} onSubmit={onSubmit} />,
    );

    await user.click(screen.getByTestId('debug-sysadmin-checkbox'));
    await user.click(screen.getByTestId('debug-pod-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ allowSysAdmin: true }),
    );
  });

  it('disables submit when custom image is empty', async () => {
    const user = userEvent.setup();
    render(
      <DebugPodDialog
        isOpen
        pod={samplePod}
        onCancel={vi.fn()}
        onSubmit={vi.fn(() => Promise.resolve(successResult()))}
      />,
    );

    await user.selectOptions(screen.getByTestId('debug-image-select'), '__custom__');
    const submit = screen.getByTestId('debug-pod-submit') as HTMLButtonElement;
    expect(submit).toBeDisabled();
  });

  it('renders error message and keeps dialog open when onSubmit rejects', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => Promise.reject(new Error('boom: image pull failed')));
    render(
      <DebugPodDialog isOpen pod={samplePod} onCancel={vi.fn()} onSubmit={onSubmit} />,
    );

    await user.click(screen.getByTestId('debug-pod-submit'));

    const error = await screen.findByTestId('debug-pod-error');
    expect(error).toHaveTextContent('boom: image pull failed');
    // Submit re-enabled so user can retry.
    expect(screen.getByTestId('debug-pod-submit')).not.toBeDisabled();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <DebugPodDialog
        isOpen
        pod={samplePod}
        onCancel={onCancel}
        onSubmit={vi.fn(() => Promise.resolve(successResult()))}
      />,
    );

    await user.click(screen.getByTestId('debug-pod-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
