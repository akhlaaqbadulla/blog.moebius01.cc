---
title: "MCP Infrastructure Agent"
date: 2026-05-01
summary: "An MCP server exposing infrastructure operations — Proxmox VM lifecycle, Ansible playbook runs, Wazuh queries — as tools an agent can call. Authorised, audited, opt-in."
status: "planned"
stack:
  - "Python"
  - "MCP SDK"
  - "Ansible"
  - "Proxmox API"
  - "Wazuh"
---

Most infra work is small, repetitive, and well-defined: list VMs, restart a service, pull a Wazuh alert, run a hardening playbook. The Model Context Protocol gives us a clean way to expose those operations to an LLM with explicit authorisation and an audit trail — instead of giving the model shell access.

**Design constraints:**
- Read-only tools by default, write tools require human confirmation.
- Every call logged with the model identity, prompt context, and outcome.
- Scoped tokens per environment (lab vs prod), never one keyring.

**Status:** Architecture sketched, building the read-only Proxmox + Wazuh tools first. Write paths come behind a feature flag and a review.
