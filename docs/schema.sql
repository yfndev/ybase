-- YBudget Schema DDL for DrawSQL
-- Generated from convex/schema.ts

CREATE TABLE organizations (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  street VARCHAR(255),
  plz VARCHAR(20),
  city VARCHAR(255),
  accounting_email VARCHAR(255)
);

CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),
  image TEXT,
  email VARCHAR(255),
  email_verification_time BIGINT,
  phone VARCHAR(50),
  phone_verification_time BIGINT,
  is_anonymous BOOLEAN,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  organization_id VARCHAR(255),
  role VARCHAR(20),
  iban VARCHAR(34),
  bic VARCHAR(11),
  account_holder VARCHAR(255),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

ALTER TABLE organizations
  ADD FOREIGN KEY (created_by) REFERENCES users(id);

CREATE TABLE projects (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id VARCHAR(255),
  organization_id VARCHAR(255) NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by VARCHAR(255) NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES projects(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE categories (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  taxsphere VARCHAR(30) NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_by VARCHAR(255),
  parent_id VARCHAR(255),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

CREATE TABLE donors (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  allowed_tax_spheres TEXT NOT NULL,
  organization_id VARCHAR(255) NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE transactions (
  id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255),
  organization_id VARCHAR(255) NOT NULL,
  date BIGINT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  counterparty VARCHAR(255) NOT NULL,
  category_id VARCHAR(255),
  donor_id VARCHAR(255),
  imported_by VARCHAR(255) NOT NULL,
  imported_transaction_id VARCHAR(255),
  import_source VARCHAR(20),
  status VARCHAR(20) NOT NULL,
  matched_transaction_id VARCHAR(255),
  account_name VARCHAR(255),
  is_archived BOOLEAN,
  split_from_transaction_id VARCHAR(255),
  transfer_id VARCHAR(255),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (donor_id) REFERENCES donors(id),
  FOREIGN KEY (imported_by) REFERENCES users(id),
  FOREIGN KEY (split_from_transaction_id) REFERENCES transactions(id)
);

CREATE TABLE teams (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  organization_id VARCHAR(255) NOT NULL,
  project_ids TEXT NOT NULL,
  member_ids TEXT NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE reimbursements (
  id VARCHAR(255) PRIMARY KEY,
  organization_id VARCHAR(255) NOT NULL,
  project_id VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type VARCHAR(20) NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  iban VARCHAR(34) NOT NULL,
  bic VARCHAR(11) NOT NULL,
  account_holder VARCHAR(255) NOT NULL,
  rejection_note TEXT,
  created_by VARCHAR(255) NOT NULL,
  reviewed_by VARCHAR(255),
  signature_storage_id VARCHAR(255),
  is_shared_link BOOLEAN,
  submitter_name VARCHAR(255),
  submitter_email VARCHAR(255),
  description TEXT,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE TABLE travel_details (
  id VARCHAR(255) PRIMARY KEY,
  reimbursement_id VARCHAR(255) NOT NULL,
  start_date VARCHAR(20) NOT NULL,
  end_date VARCHAR(20) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  purpose TEXT NOT NULL,
  is_international BOOLEAN NOT NULL DEFAULT false,
  meal_allowance_days INTEGER,
  meal_allowance_daily_budget DECIMAL(8,2),
  allow_food_allowance BOOLEAN,
  FOREIGN KEY (reimbursement_id) REFERENCES reimbursements(id)
);

CREATE TABLE receipts (
  id VARCHAR(255) PRIMARY KEY,
  reimbursement_id VARCHAR(255) NOT NULL,
  receipt_number VARCHAR(50) NOT NULL,
  receipt_date VARCHAR(20) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  net_amount DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL,
  gross_amount DECIMAL(12,2) NOT NULL,
  file_storage_id VARCHAR(255) NOT NULL,
  cost_type VARCHAR(20),
  kilometers DECIMAL(10,2),
  FOREIGN KEY (reimbursement_id) REFERENCES reimbursements(id)
);

CREATE TABLE logs (
  id VARCHAR(255) PRIMARY KEY,
  organization_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  details TEXT,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE volunteer_allowance (
  id VARCHAR(255) PRIMARY KEY,
  organization_id VARCHAR(255) NOT NULL,
  project_id VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  iban VARCHAR(34) NOT NULL,
  bic VARCHAR(11) NOT NULL,
  account_holder VARCHAR(255) NOT NULL,
  rejection_note TEXT,
  created_by VARCHAR(255) NOT NULL,
  reviewed_by VARCHAR(255),
  activity_description TEXT NOT NULL,
  start_date VARCHAR(20) NOT NULL,
  end_date VARCHAR(20) NOT NULL,
  volunteer_name VARCHAR(255) NOT NULL,
  volunteer_street VARCHAR(255) NOT NULL,
  volunteer_plz VARCHAR(20) NOT NULL,
  volunteer_city VARCHAR(255) NOT NULL,
  signature_storage_id VARCHAR(255),
  token VARCHAR(255),
  expires_at BIGINT,
  used_at BIGINT,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE TABLE signature_tokens (
  id VARCHAR(255) PRIMARY KEY,
  token VARCHAR(255) NOT NULL,
  organization_id VARCHAR(255) NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  expires_at BIGINT NOT NULL,
  signature_storage_id VARCHAR(255),
  used_at BIGINT,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
