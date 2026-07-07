# OpsFlow AI — User Guide

> Version 1.0 · Last updated: 2026-05-12

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard Overview](#2-dashboard-overview)
3. [Lead Management](#3-lead-management)
4. [Workflow Builder](#4-workflow-builder)
5. [Running Workflows](#5-running-workflows)
6. [Monitoring Runs](#6-monitoring-runs)
7. [Audit Log](#7-audit-log)
8. [Organization Settings](#8-organization-settings)
9. [AI Features](#9-ai-features)
10. [Appendix: Roles & Permissions](#10-appendix-roles--permissions)

---

## 1. Getting Started

### 1.1 Logging In

Navigate to your OpsFlow instance. You will see the sign-in screen:

- Enter your **email address** and **password**
- Click **Sign in**

If you do not have an account, click **Create one** at the bottom of the sign-in form to register.

### 1.2 Your First Login

After signing in, you land on the **Dashboard** — your central overview page. Here you see:

- Your **organization name**
- **Workflow count** — total workflows in your organization
- **Lead count** — total leads tracked
- **Member count** — team members in your organization
- **Worker status** — health indicator for the background job processor

### 1.3 Navigating the App

The sidebar on the left gives you access to all major sections:

| Navigation Item | Description |
|----------------|-------------|
| **Dashboard** | Overview of key metrics and system health |
| **Leads** | Manage prospects and customer records |
| **Workflows** | Design and manage automation workflows |
| **Runs** | Monitor workflow execution history |
| **Settings** | Organization configuration and team management |
| **Audit Log** | Track all changes across the organization |

Your name and organization are displayed at the top-right of every page. Click there to sign out.

---

## 2. Dashboard Overview

The Dashboard is your command center, showing:

- **Organization name** and member count
- **Workflow count** — click to navigate to the workflows list
- **Lead count** — click to navigate to the leads list
- **Worker Health** — status of the background worker that processes workflow runs

### Worker Health Card

| Indicator | Meaning |
|-----------|---------|
| Green dot | Worker is running and healthy |
| Gray dot | Worker is offline or not responding |

Queue status shows:
- **Queued** — workflows waiting to be processed
- **Running** — workflows currently executing
- **Dead letter** — workflows that have permanently failed

> If the worker shows "unknown" or the dot is gray, contact your system administrator.

---

## 3. Lead Management

### 3.1 Leads List

Navigate to **Leads** in the sidebar to see all leads in your organization.

The leads table shows:
- **Name**
- **Email**
- **Company**
- **Stage** (e.g., New, Qualified, Proposal, Closed Won, Closed Lost)

**Search**: Type in the search bar to filter leads by name, email, or company. Results update as you type.

**Filter**: Click column headers to sort ascending/descending.

### 3.2 Creating a Lead

1. Click the **Create Lead** button (top of the leads list)
2. Fill in the details:
   - **Name** (required)
   - **Email** (required)
   - **Company**
   - **Stage** — select from the dropdown (defaults to "New")
3. Click **Create**

The lead appears immediately in the list.

### 3.3 Viewing a Lead

Click on any lead in the table to open the **Lead Detail** page. Here you can:

- **Edit information** — click the edit button to update name, email, company, or stage
- **Change stage** — use the stage selector dropdown to move the lead through your pipeline. Each change is automatically recorded.
- **View activity log** — see a timeline of all changes and actions for this lead
- **Add notes** — type a note and click submit to add context to the lead
- **Delete** — remove the lead (with confirmation)

### 3.4 AI Lead Scoring

If AI features are enabled, each lead shows an **AI Insights** card with:

- **Score** — a numerical rating (0-100)
- **Label** — Hot / Warm / Cold
- **Reasoning** — why the lead received this score
- **Suggested next action** — what to do next

Click **Score** on individual leads, or use **Score All** to score all leads at once.

---

## 4. Workflow Builder

The Workflow Builder is a visual drag-and-drop canvas for creating automation workflows. This is the heart of OpsFlow.

### 4.1 Accessing the Builder

1. Go to **Workflows** in the sidebar
2. Click on a workflow to view its details
3. Click **Open Builder** to enter the visual editor

### 4.2 Builder Interface

The builder has four sections:

| Area | Purpose |
|------|---------|
| **Left panel** | Node palette — drag nodes onto the canvas |
| **Center canvas** | Visual workspace — arrange and connect nodes |
| **Right panel** | Configuration — edit the selected node's settings |
| **Top toolbar** | Workflow name, save, zoom controls |

### 4.3 Node Types

| Node | Color | Purpose |
|------|-------|---------|
| **Trigger** | Green | Starts the workflow (manual, webhook, or scheduled) |
| **Action** | Blue | Performs an operation (send email, update lead, etc.) |
| **Condition** | Amber | Branches execution based on a condition (yes/no) |
| **Delay** | Purple | Waits a specified amount of time before continuing |

### 4.4 Building a Workflow

**Step 1: Add nodes**

Drag a node from the left palette onto the canvas. Position it where you want.

**Step 2: Configure nodes**

Click a node to select it. The right panel opens with configuration options:

- **Trigger**: Choose type (Manual, Webhook, or Scheduled). For Scheduled, set a cron expression.
- **Action**: Choose the action type (Send Email, Update Lead, Create Lead, Slack Notification, HTTP Request).
- **Condition**: Set the field to evaluate, the operator (equals, not equals, contains, greater than, less than), and the value to compare.
- **Delay**: Set the duration (number) and unit (minutes, hours, days).

**Step 3: Connect nodes**

Click and drag from a node's output handle (circle at bottom or side) to another node's input handle (circle at top). Connections define the flow of execution.

For **Condition** nodes, two output handles appear:
- **Yes** (green) — followed when the condition is true
- **No** (red) — followed when the condition is false

**Step 4: Save**

Click **Save** in the toolbar (or press Ctrl+S). Your workflow is saved as a new version.

### 4.5 Example Workflows

**Simple Email Workflow:**
```
Trigger (Manual) → Action (Send Email)
```

**Lead Qualification Pipeline:**
```
Trigger (Webhook) → Condition (Is company email?) 
  → Yes → Action (Mark as Hot Lead)
  → No → Action (Send Nurture Email) → Delay (1 day)
```

### 4.6 Versioning

Each time you save, a new version of the workflow is created. Runs always execute against the version that was active at trigger time, so past runs remain accurate even if the workflow is later modified.

### 4.7 AI-Powered Workflow Generation

In the builder, you can use the **Generate with AI** feature:

1. Open the collapsible panel below the node palette
2. Describe your workflow in plain English (e.g., "When a new lead comes in, score it, and if it's hot, send a Slack notification")
3. Click **Generate Workflow**
4. The AI creates a complete workflow graph on the canvas

You can also get **AI Node Suggestions** at any point. Click "Suggest Nodes" and the AI recommends relevant nodes based on your current workflow.

---

## 5. Running Workflows

### 5.1 Triggering a Run

1. Navigate to the workflow's detail page
2. Click **Run Now**
3. Optionally provide input data (JSON format)
4. The workflow is queued for execution

### 5.2 Run Statuses

| Status | Meaning |
|--------|---------|
| **Queued** | The run is waiting to be processed |
| **Running** | The workflow is currently executing |
| **Completed** | All nodes executed successfully |
| **Failed** | A node encountered an error |
| **Dead Letter** | All retry attempts exhausted |
| **Delayed** | A delay node is waiting |

### 5.3 What Happens During Execution

When a workflow runs:

1. Nodes execute in **topological order** (dependencies first)
2. **Condition** nodes evaluate and follow the matching branch
3. **Delay** nodes pause execution for the configured duration
4. **Retries** are automatic — failed nodes retry up to the configured limit
5. Each node's execution creates an **event** visible in the run history

### 5.4 Viewing Run Results in the Builder

In the Workflow Builder, use the **Run Selector** dropdown to choose a previous run. The canvas overlays node statuses:

- **Green ring** → Success
- **Red ring** → Failed
- **Blue pulsing** → Running
- **Amber dashed** → Delayed
- **Dimmed** → Pending / not yet reached

---

## 6. Monitoring Runs

The **Runs** page gives you a complete view of all workflow executions across your organization.

### 6.1 Runs List

The left panel shows all runs with:
- Status badge and icon
- Workflow name
- Date and event count
- **Retry** button (for failed/dead_letter runs)
- **Cancel** button (for queued/running runs)

Use the status filter buttons at the top to show runs by status: All, Queued, Running, Completed, Failed, or Dead Letter.

### 6.2 Execution Timeline

Click any run to open the **Execution Timeline** panel on the right. This shows:

- Overall status badge
- A chronological list of every node execution event
- Each event shows:
  - **Status** — success, failed, or delayed
  - **Timestamp** — when the event occurred
  - **Output** — execution output data

This timeline is similar to what you see in tools like **GitHub Actions** or **Temporal** — it gives you a clear, chronological picture of exactly what happened during the run.

### 6.3 Retrying Failed Runs

If a run fails:

1. Navigate to the **Runs** page
2. Filter to show failed/dead_letter runs
3. Click **Retry** on the failed run
4. The run is re-queued for execution with a fresh attempt

### 6.4 Canceling Runs

For queued or running workflows:

1. Find the run in the list
2. Click **Cancel**
3. The run is marked as failed and stops execution

---

## 7. Audit Log

The **Audit Log** provides a complete record of all changes made in your organization. This is essential for compliance, debugging, and team coordination.

### 7.1 Viewing the Audit Log

Navigate to **Audit Log** in the sidebar. Each entry shows:

- **User avatar** — colored initial of the person who made the change
- **Action** — what happened (e.g., "created", "updated", "deleted")
- **Target** — what was affected (e.g., "lead", "workflow", "member")
- **Details** — specific changes made, shown as key-value pairs
- **Timestamp** — when it happened (shown as relative time, e.g., "5m ago")

### 7.2 Audit Log Examples

```
Alice    updated    lead    · stage: "New" → "Qualified"    2h ago
Bob      deleted    lead    · id: lead_abc123               1d ago
Alice    created    workflow · name: "Email Campaign"        3d ago
System   updated    member  · role: "member" → "admin"      1w ago
```

### 7.3 Pagination

If you have many audit entries, use the Previous/Next buttons at the bottom to navigate pages. The total entry count is displayed.

### 7.4 Refresh

Click the **Refresh** button to reload the latest entries.

---

## 8. Organization Settings

### 8.1 General Settings

Navigate to **Settings** → **General** to:

- **Edit organization name**
- **Change organization slug** (URL identifier)

### 8.2 Managing Members

Navigate to **Settings** → **Members** to manage your team.

**View members**: See all members with their name, email, and role.

**Add a member**: Click **Add Member**, enter their email and select a role. They will receive access immediately.

**Change a role**: Use the role dropdown next to any member to upgrade or downgrade their permissions.

**Remove a member**: Click the remove button next to a member (with confirmation).

> **Note**: You cannot remove the last owner of an organization. At least one owner must remain.

### 8.3 Member Roles

| Role | Description |
|------|-------------|
| **Owner** | Full access to everything, including billing and deletion |
| **Admin** | Can manage workflows, leads, and members |
| **Member** | Can create and edit workflows and leads |
| **Viewer** | Read-only access to all data |

See the full permissions matrix in the [Appendix](#10-appendix-roles--permissions).

---

## 9. AI Features

OpsFlow includes AI-powered features to enhance your workflow.

### 9.1 AI Workflow Generation

Describe your desired workflow in plain English, and the AI generates a complete visual workflow graph on the canvas. Available in the Workflow Builder.

### 9.2 AI Node Suggestions

While editing a workflow, get AI-suggested nodes based on your current graph. Suggestions include priority levels (high, medium, low) and reasons for the recommendation. Add them to the canvas with one click.

### 9.3 AI Lead Scoring

Each lead can be scored by AI based on its data. The analysis includes:

- **Score** — 0 to 100 rating
- **Label** — Hot (high priority), Warm (medium), Cold (low priority)
- **Reason** — explanation of the score
- **Next action** — recommended next step

### 9.4 Anomaly Detection

When a workflow run fails, click **Analyze with AI** to get:

- **Root cause** — what went wrong
- **Failed node** — which node encountered the error
- **Suggested fix** — how to resolve the issue
- **Transient indicator** — whether the error is likely temporary

---

## 10. Appendix: Roles & Permissions

| Permission | Owner | Admin | Member | Viewer |
|-----------|-------|-------|--------|--------|
| View workflows | ✅ | ✅ | ✅ | ✅ |
| Create/edit workflows | ✅ | ✅ | ✅ | ❌ |
| Delete workflows | ✅ | ✅ | ❌ | ❌ |
| Run workflows | ✅ | ✅ | ✅ | ❌ |
| View leads | ✅ | ✅ | ✅ | ✅ |
| Create/edit leads | ✅ | ✅ | ✅ | ❌ |
| Delete leads | ✅ | ✅ | ❌ | ❌ |
| View members | ✅ | ✅ | ✅ | ✅ |
| Manage members | ✅ | ✅ | ❌ | ❌ |
| View audit log | ✅ | ✅ | ✅ | ✅ |
| Manage organization | ✅ | ❌ | ❌ | ❌ |
| View runs | ✅ | ✅ | ✅ | ✅ |
| Retry/cancel runs | ✅ | ✅ | ✅ | ❌ |

---

*For technical support, contact your system administrator.*
