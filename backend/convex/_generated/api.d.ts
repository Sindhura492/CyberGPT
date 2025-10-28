/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as chats from "../chats.js";
import type * as graphVisualizations from "../graphVisualizations.js";
import type * as reports from "../reports.js";
import type * as sastScans from "../sastScans.js";
import type * as scans from "../scans.js";
import type * as summaries from "../summaries.js";
import type * as todoApi from "../todoApi.js";
import type * as todoLists from "../todoLists.js";
import type * as vulnerabilities from "../vulnerabilities.js";
import type * as vulnerabilityInfo from "../vulnerabilityInfo.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  chats: typeof chats;
  graphVisualizations: typeof graphVisualizations;
  reports: typeof reports;
  sastScans: typeof sastScans;
  scans: typeof scans;
  summaries: typeof summaries;
  todoApi: typeof todoApi;
  todoLists: typeof todoLists;
  vulnerabilities: typeof vulnerabilities;
  vulnerabilityInfo: typeof vulnerabilityInfo;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
