/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as authJwks from "../authJwks.js";
import type * as cms_aiChat from "../cms/aiChat.js";
import type * as cms_apiKeys from "../cms/apiKeys.js";
import type * as cms_blocks from "../cms/blocks.js";
import type * as cms_builders from "../cms/builders.js";
import type * as cms_constants from "../cms/constants.js";
import type * as cms_content from "../cms/content.js";
import type * as cms_invitations from "../cms/invitations.js";
import type * as cms_media from "../cms/media.js";
import type * as cms_mediaActions from "../cms/mediaActions.js";
import type * as cms_mediaTags from "../cms/mediaTags.js";
import type * as cms_migrations from "../cms/migrations.js";
import type * as cms_r2 from "../cms/r2.js";
import type * as cms_rest from "../cms/rest.js";
import type * as cms_sanitizeContent from "../cms/sanitizeContent.js";
import type * as cms_schemas from "../cms/schemas.js";
import type * as cms_settings from "../cms/settings.js";
import type * as cms_users from "../cms/users.js";
import type * as cms_utils from "../cms/utils.js";
import type * as cms_webhooks from "../cms/webhooks.js";
import type * as http from "../http.js";
import type * as lib_email from "../lib/email.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authJwks: typeof authJwks;
  "cms/aiChat": typeof cms_aiChat;
  "cms/apiKeys": typeof cms_apiKeys;
  "cms/blocks": typeof cms_blocks;
  "cms/builders": typeof cms_builders;
  "cms/constants": typeof cms_constants;
  "cms/content": typeof cms_content;
  "cms/invitations": typeof cms_invitations;
  "cms/media": typeof cms_media;
  "cms/mediaActions": typeof cms_mediaActions;
  "cms/mediaTags": typeof cms_mediaTags;
  "cms/migrations": typeof cms_migrations;
  "cms/r2": typeof cms_r2;
  "cms/rest": typeof cms_rest;
  "cms/sanitizeContent": typeof cms_sanitizeContent;
  "cms/schemas": typeof cms_schemas;
  "cms/settings": typeof cms_settings;
  "cms/users": typeof cms_users;
  "cms/utils": typeof cms_utils;
  "cms/webhooks": typeof cms_webhooks;
  http: typeof http;
  "lib/email": typeof lib_email;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
  r2: import("@convex-dev/r2/_generated/component.js").ComponentApi<"r2">;
};
