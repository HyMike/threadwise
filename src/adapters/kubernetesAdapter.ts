import * as k8s from '@kubernetes/client-node';
import { ExecutionAdapter, WorkspaceExecutionResult } from './executionAdapter';
import { config } from '../utils/config';

export class KubernetesAdapter implements ExecutionAdapter {
  private k8sApi: k8s.BatchV1Api;
  private k8sConfig: k8s.KubeConfig;

  constructor() {
    // Initialize Kubernetes client
    this.k8sConfig = new k8s.KubeConfig();
    
    try {
      // Try to load from default kubeconfig (~/.kube/config or in-cluster)
      this.k8sConfig.loadFromDefault();
    } catch (error) {
      console.warn('Failed to load Kubernetes config from default location');
      throw new Error('Kubernetes config not found. Make sure kubectl is configured or running in a K8s cluster.');
    }
    
    this.k8sApi = this.k8sConfig.makeApiClient(k8s.BatchV1Api);
  }

  async executeWorkspace(workspaceId: string): Promise<WorkspaceExecutionResult> {
    try {
      await this.createWorkspaceJob(workspaceId);
      return {
        workspaceId,
        success: true
      };
    } catch (error: any) {
      console.error(`Failed to create K8s job for workspace ${workspaceId}:`, error);
      return {
        workspaceId,
        success: false,
        error: error.message || 'Failed to create Kubernetes job'
      };
    }
  }

  async executeWorkspaces(workspaceIds: string[]): Promise<WorkspaceExecutionResult[]> {
    const results = await Promise.allSettled(
      workspaceIds.map(id => this.executeWorkspace(id))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          workspaceId: workspaceIds[index],
          success: false,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });
  }

  private async createWorkspaceJob(workspaceId: string): Promise<void> {
    const k8sConfig = config.execution.kubernetes;
    const timestamp = Date.now();
    const jobName = `workspace-analyzer-${workspaceId}-${timestamp}`.toLowerCase();

    const jobManifest: k8s.V1Job = {
      apiVersion: 'batch/v1',
      kind: 'Job',
      metadata: {
        name: jobName,
        namespace: k8sConfig.namespace,
        labels: {
          app: 'threadwise',
          component: 'workspace-analyzer',
          workspaceId: workspaceId
        }
      },
      spec: {
        ttlSecondsAfterFinished: k8sConfig.ttlSecondsAfterFinished,
        backoffLimit: k8sConfig.backoffLimit,
        template: {
          metadata: {
            labels: {
              app: 'threadwise',
              component: 'workspace-analyzer',
              workspaceId: workspaceId
            }
          },
          spec: {
            restartPolicy: 'OnFailure',
            containers: [{
              name: 'analyzer',
              image: `${k8sConfig.imageName}:${k8sConfig.imageTag}`,
              command: ['node'],
              args: [
                'dist/scripts/analyzeWorkspace.js',
                workspaceId
              ],
              env: [
                {
                  name: 'WORKSPACE_ID',
                  value: workspaceId
                },
                {
                  name: 'API_URL',
                  value: process.env.API_URL || `http://threadwise-api.${k8sConfig.namespace}.svc.cluster.local:3000`
                },
                {
                  name: 'NODE_ENV',
                  value: config.environment
                },
                // Load secrets from K8s secret
                {
                  name: 'LLM_API_KEY',
                  valueFrom: {
                    secretKeyRef: {
                      name: k8sConfig.secretName,
                      key: 'llm-api-key'
                    }
                  }
                },
                {
                  name: 'LLM_PROVIDER',
                  valueFrom: {
                    secretKeyRef: {
                      name: k8sConfig.secretName,
                      key: 'llm-provider',
                      optional: true
                    }
                  }
                },
                {
                  name: 'LLM_MODEL',
                  valueFrom: {
                    secretKeyRef: {
                      name: k8sConfig.secretName,
                      key: 'llm-model',
                      optional: true
                    }
                  }
                }
              ],
              resources: {
                requests: {
                  memory: k8sConfig.resources.requests.memory,
                  cpu: k8sConfig.resources.requests.cpu
                },
                limits: {
                  memory: k8sConfig.resources.limits.memory,
                  cpu: k8sConfig.resources.limits.cpu
                }
              }
            }]
          }
        }
      }
    };

    try {
      await this.k8sApi.createNamespacedJob(k8sConfig.namespace, jobManifest);
      console.log(`Created K8s job: ${jobName} in namespace ${k8sConfig.namespace}`);
    } catch (error: any) {
      console.error(`Failed to create K8s job ${jobName}:`, error.body || error.message);
      throw error;
    }
  }

  /**
   * Clean up old completed jobs
   */
  async cleanup(): Promise<void> {
    const k8sConfig = config.execution.kubernetes;
    
    try {
      const jobs = await this.k8sApi.listNamespacedJob(
        k8sConfig.namespace,
        undefined,
        undefined,
        undefined,
        undefined,
        'app=threadwise,component=workspace-analyzer'
      );

      const now = new Date();
      const cleanupThreshold = new Date(now.getTime() - (k8sConfig.ttlSecondsAfterFinished * 1000));

      for (const job of jobs.body.items) {
        if (job.status?.completionTime) {
          const completionTime = new Date(job.status.completionTime);
          if (completionTime < cleanupThreshold && job.metadata?.name) {
            await this.k8sApi.deleteNamespacedJob(
              job.metadata.name,
              k8sConfig.namespace
            );
            console.log(`Cleaned up old job: ${job.metadata.name}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up old K8s jobs:', error);
    }
  }
}
