import { getDb } from "./client";
import type {
  Department,
  JobPosting,
  Log,
  Organization,
  Project,
  Receipt,
  Reimbursement,
  SignatureToken,
  Team,
  TravelDetails,
  User,
  VolunteerAllowance,
} from "./types";

export async function organizations() {
  return (await getDb()).collection<Organization>("organizations");
}

export async function users() {
  return (await getDb()).collection<User>("users");
}

export async function projects() {
  return (await getDb()).collection<Project>("projects");
}

export async function departments() {
  return (await getDb()).collection<Department>("departments");
}

export async function teams() {
  return (await getDb()).collection<Team>("teams");
}

export async function jobPostings() {
  return (await getDb()).collection<JobPosting>("jobPostings");
}

export async function reimbursements() {
  return (await getDb()).collection<Reimbursement>("reimbursements");
}

export async function travelDetails() {
  return (await getDb()).collection<TravelDetails>("travelDetails");
}

export async function receipts() {
  return (await getDb()).collection<Receipt>("receipts");
}

export async function logs() {
  return (await getDb()).collection<Log>("logs");
}

export async function volunteerAllowance() {
  return (await getDb()).collection<VolunteerAllowance>("volunteerAllowance");
}

export async function signatureTokens() {
  return (await getDb()).collection<SignatureToken>("signatureTokens");
}
