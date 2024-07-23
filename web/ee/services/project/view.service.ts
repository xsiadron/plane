import { TPublishViewSettings } from "@plane/types";
import { EViewAccess } from "@/constants/views";
import { API_BASE_URL } from "@/helpers/common.helper";
import { ViewService as CoreViewService } from "@/services/view.service";

export class ViewService extends CoreViewService {
  constructor() {
    super(API_BASE_URL);
  }

  async updateViewAccess(workspaceSlug: string, projectId: string, viewId: string, access: EViewAccess) {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/access/`, {
      access,
    }).catch((error) => {
      throw error?.response?.data;
    });
  }

  async lockView(workspaceSlug: string, projectId: string, viewId: string) {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/lock/`).catch((error) => {
      throw error?.response?.data;
    });
  }

  async unLockView(workspaceSlug: string, projectId: string, viewId: string) {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/lock/`).catch(
      (error) => {
        throw error?.response?.data;
      }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getPublishDetails(workspaceSlug: string, projectId: string, viewId: string): Promise<any> {
    return Promise.resolve({});
  }

  async publishView(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    workspaceSlug: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    projectId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    viewId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data: TPublishViewSettings
  ): Promise<any> {
    return Promise.resolve();
  }

  async updatePublishedView(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    workspaceSlug: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    projectId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    viewId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data: Partial<TPublishViewSettings>
  ): Promise<void> {
    return Promise.resolve();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async unPublishView(workspaceSlug: string, projectId: string, viewId: string): Promise<void> {
    return Promise.resolve();
  }
}
