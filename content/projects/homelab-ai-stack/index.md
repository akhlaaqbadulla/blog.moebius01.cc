---
title: "On-Prem AI Inference Stack"
date: 2026-04-20
summary: "Production-grade LLM deployment on Proxmox — Ollama for dev/small models, vLLM for high-throughput serving, OpenWebUI for the human interface, all behind a hardened reverse proxy."
status: "in-progress"
stack:
  - "Proxmox"
  - "Ollama"
  - "vLLM"
  - "OpenWebUI"
  - "Terraform"
  - "Nvidia"
---

A homelab + work-driven build of an on-premise inference stack designed for environments where data sovereignty rules out public LLM APIs. Ollama covers small models and rapid iteration, vLLM handles concurrent throughput, and OpenWebUI sits in front for human-friendly chat. Everything is provisioned with Terraform and Ansible, deployed inside Proxmox VMs with GPU passthrough.

**Goals:** repeatable infra, hardened network boundary, observable performance, and a clear migration path if/when we move pieces to the cloud.

**Status:** Stack runs in staging; production hardening, GPU autoscaling, and an MCP bridge are next.
