import APIService from "services/api.service";
import trackEventServices from "services/track-event.service";
// types
import { ICurrentUserResponse, IGptResponse } from "types";
// helpers
import { API_BASE_URL } from "helpers/common.helper";
import PosthogService from "./posthog.service";
import { ASK_GPT } from "constants/posthog-events";

const posthogService = new PosthogService();

class AiServices extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async createGptTask(
    workspaceSlug: string,
    projectId: string,
    data: { prompt: string; task: string },
    user: ICurrentUserResponse | undefined
  ): Promise<IGptResponse> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/ai-assistant/`, data)
      .then((response) => {
        trackEventServices.trackAskGptEvent(response?.data, "ASK_GPT", user);
        posthogService.capture(ASK_GPT, response?.data, user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response;
      });
  }
}

export default new AiServices();
