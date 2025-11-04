import { checkWebUrl } from "../deps.ts";

export const health = {
  "web-ui": checkWebUrl("http://tally-budget.embassy:8080")
};
