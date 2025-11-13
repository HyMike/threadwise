import { ExecutionAdapter } from './executionAdapter';
import { InMemoryAdapter } from './inMemoryAdapter';
import { KubernetesAdapter } from './kubernetesAdapter';
import { config, ExecutionMode } from '../utils/config';

export class ExecutionAdapterFactory {
  static createAdapter(): ExecutionAdapter {
    const mode = config.execution.mode;

    switch (mode) {
      case ExecutionMode.IN_MEMORY:
        console.log('Using in-memory execution adapter (direct API calls)');
        return new InMemoryAdapter();

      case ExecutionMode.KUBERNETES:
        console.log('Using Kubernetes execution adapter (K8s jobs)');
        return new KubernetesAdapter();

      default:
        console.warn(`Unknown execution mode: ${mode}. Defaulting to in-memory.`);
        return new InMemoryAdapter();
    }
  }
}
