import { mockCommunitiesService } from "./mockService";
import { realCommunitiesService } from "./realService";
import type { CommunitiesService } from "./types";

export * from "./types";

const isMock = import.meta.env.VITE_USE_MOCKS === "true";

export const communitiesService: CommunitiesService = isMock
  ? mockCommunitiesService
  : realCommunitiesService;
