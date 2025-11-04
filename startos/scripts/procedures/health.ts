import { checkWebUrl, catchError } from "../deps.ts";

// Export health checks as named exports
// Start9 SDK will look for exports matching the health check IDs in manifest.yaml
export const health = {
  "web-ui": async (effects: any, duration: any) => {
    return await checkWebUrl("http://tally-budget.embassy:8080/api/health")(
      effects,
      duration
    ).catch(catchError(effects));
  },
};
