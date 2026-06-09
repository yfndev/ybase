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
import type * as http from "../http.js";
import type * as invitations_functions from "../invitations/functions.js";
import type * as logs_functions from "../logs/functions.js";
import type * as logs_queries from "../logs/queries.js";
import type * as organizations_functions from "../organizations/functions.js";
import type * as organizations_queries from "../organizations/queries.js";
import type * as projects_functions from "../projects/functions.js";
import type * as projects_queries from "../projects/queries.js";
import type * as reimbursements_functions from "../reimbursements/functions.js";
import type * as reimbursements_queries from "../reimbursements/queries.js";
import type * as reimbursements_sendApprovalEmail from "../reimbursements/sendApprovalEmail.js";
import type * as reimbursements_sharing from "../reimbursements/sharing.js";
import type * as reimbursements_validators from "../reimbursements/validators.js";
import type * as signatures_functions from "../signatures/functions.js";
import type * as signatures_queries from "../signatures/queries.js";
import type * as testing_functions from "../testing/functions.js";
import type * as users_functions from "../users/functions.js";
import type * as users_getCurrentUser from "../users/getCurrentUser.js";
import type * as users_permissions from "../users/permissions.js";
import type * as users_queries from "../users/queries.js";
import type * as volunteerAllowance_constants from "../volunteerAllowance/constants.js";
import type * as volunteerAllowance_functions from "../volunteerAllowance/functions.js";
import type * as volunteerAllowance_queries from "../volunteerAllowance/queries.js";
import type * as volunteerAllowance_sendEmails from "../volunteerAllowance/sendEmails.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  http: typeof http;
  "invitations/functions": typeof invitations_functions;
  "logs/functions": typeof logs_functions;
  "logs/queries": typeof logs_queries;
  "organizations/functions": typeof organizations_functions;
  "organizations/queries": typeof organizations_queries;
  "projects/functions": typeof projects_functions;
  "projects/queries": typeof projects_queries;
  "reimbursements/functions": typeof reimbursements_functions;
  "reimbursements/queries": typeof reimbursements_queries;
  "reimbursements/sendApprovalEmail": typeof reimbursements_sendApprovalEmail;
  "reimbursements/sharing": typeof reimbursements_sharing;
  "reimbursements/validators": typeof reimbursements_validators;
  "signatures/functions": typeof signatures_functions;
  "signatures/queries": typeof signatures_queries;
  "testing/functions": typeof testing_functions;
  "users/functions": typeof users_functions;
  "users/getCurrentUser": typeof users_getCurrentUser;
  "users/permissions": typeof users_permissions;
  "users/queries": typeof users_queries;
  "volunteerAllowance/constants": typeof volunteerAllowance_constants;
  "volunteerAllowance/functions": typeof volunteerAllowance_functions;
  "volunteerAllowance/queries": typeof volunteerAllowance_queries;
  "volunteerAllowance/sendEmails": typeof volunteerAllowance_sendEmails;
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
  resend: {
    lib: {
      cancelEmail: FunctionReference<
        "mutation",
        "internal",
        { emailId: string },
        null
      >;
      cleanupAbandonedEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      cleanupOldEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      createManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          replyTo?: Array<string>;
          subject: string;
          to: string;
        },
        string
      >;
      get: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          complained: boolean;
          createdAt: number;
          errorMessage?: string;
          finalizedAt: number;
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          opened: boolean;
          replyTo: Array<string>;
          resendId?: string;
          segment: number;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
          subject: string;
          text?: string;
          to: string;
        } | null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          complained: boolean;
          errorMessage: string | null;
          opened: boolean;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        } | null
      >;
      handleEmailEvent: FunctionReference<
        "mutation",
        "internal",
        { event: any },
        null
      >;
      sendEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          options: {
            apiKey: string;
            initialBackoffMs: number;
            onEmailEvent?: { fnHandle: string };
            retryAttempts: number;
            testMode: boolean;
          };
          replyTo?: Array<string>;
          subject: string;
          text?: string;
          to: string;
        },
        string
      >;
      updateManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          emailId: string;
          errorMessage?: string;
          resendId?: string;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        },
        null
      >;
    };
  };
};
