import * as k8s from "@kubernetes/client-node";
import { ExecutionAdapter, WorkspaceExecutionResult } from "./executionAdapter";
import { config } from "../utils/config";

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
      console.warn("Failed to load Kubernetes config from default location");
      throw new Error(
        "Kubernetes config not found. Make sure kubectl is configured or running in a K8s cluster."
      );
    }

    this.k8sApi = this.k8sConfig.makeApiClient(k8s.BatchV1Api);
  }

  async executeWorkspace(
    workspaceId: string
  ): Promise<WorkspaceExecutionResult> {
    try {
      await this.createWorkspaceJob(workspaceId);
      return {
        workspaceId,
        success: true,
      };
    } catch (error: any) {
      console.error(
        `Failed to create K8s job for workspace ${workspaceId}:`,
        error
      );
      return {
        workspaceId,
        success: false,
        error: error.message || "Failed to create Kubernetes job",
      };
    }
  }

  async executeWorkspaces(
    workspaceIds: string[]
  ): Promise<WorkspaceExecutionResult[]> {
    const results = await Promise.allSettled(
      workspaceIds.map((id) => this.executeWorkspace(id))
    );

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          workspaceId: workspaceIds[index],
          success: false,
          error: result.reason?.message || "Unknown error",
        };
      }
    });
  }

  private async createWorkspaceJob(workspaceId: string): Promise<void> {
    const k8sConfig = config.execution.kubernetes;
    const timestamp = Date.now();
    const jobName =
      `workspace-analyzer-${workspaceId}-${timestamp}`.toLowerCase();

    const jobManifest: k8s.V1Job = {
      apiVersion: "batch/v1",
      kind: "Job",
      metadata: {
        name: jobName,
        namespace: k8sConfig.namespace,
        labels: {
          app: "threadwise",
          component: "workspace-analyzer",
          workspaceId: workspaceId,
        },
      },
      spec: {
        ttlSecondsAfterFinished: k8sConfig.ttlSecondsAfterFinished,
        backoffLimit: k8sConfig.backoffLimit,
        template: {
          metadata: {
            labels: {
              app: "threadwise",
              component: "workspace-analyzer",
              workspaceId: workspaceId,
            },
          },
          spec: {
            restartPolicy: "OnFailure",
            containers: [
              {
                name: "analyzer",
                image: `${k8sConfig.imageName}:${k8sConfig.imageTag}`,
                command: ["sh", "-c"],
                args: [
                  `curl -X POST -H "Content-Type: application/json" -f --max-time 300 ${
                    process.env.API_URL ||
                    `http://threadwise-api.${k8sConfig.namespace}.svc.cluster.local:3000`
                  }/api/workspaces/${workspaceId}/analyze && echo "Analysis completed successfully" || (echo "Analysis failed" && exit 1)`,
                ],
                resources: {
                  requests: {
                    memory: "64Mi",
                    cpu: "50m",
                  },
                  limits: {
                    memory: "128Mi",
                    cpu: "100m",
                  },
                },
              },
            ],
          },
        },
      },
    };

    try {
      await this.k8sApi.createNamespacedJob({
        namespace: k8sConfig.namespace,
        body: jobManifest,
      });
      console.log(
        `Created K8s job: ${jobName} in namespace ${k8sConfig.namespace}`
      );
    } catch (error: any) {
      console.error(
        `Failed to create K8s job ${jobName}:`,
        error.body || error.message
      );
      throw error;
    }
  }

  /**
   * Clean up old completed jobs
   */
  async cleanup(): Promise<void> {
    const k8sConfig = config.execution.kubernetes;
    // TO-DO: Implement cleanup later. This is all just ai generated stuff below
    // try {
    //   const jobs = await this.k8sApi.listNamespacedJob(
    //     k8sConfig.namespace,
    //     undefined,
    //     undefined,
    //     undefined,
    //     undefined,
    //     'app=threadwise,component=workspace-analyzer'
    //   );

    //   const now = new Date();
    //   const cleanupThreshold = new Date(now.getTime() - (k8sConfig.ttlSecondsAfterFinished * 1000));

    //   for (const job of jobs.body.items) {
    //     if (job.status?.completionTime) {
    //       const completionTime = new Date(job.status.completionTime);
    //       if (completionTime < cleanupThreshold && job.metadata?.name) {
    //         await this.k8sApi.deleteNamespacedJob(
    //           job.metadata.name,
    //           k8sConfig.namespace
    //         );
    //         console.log(`Cleaned up old job: ${job.metadata.name}`);
    //       }
    //     }
    //   }
    // } catch (error) {
    //   console.error('Error cleaning up old K8s jobs:', error);
    // }
  }
}
