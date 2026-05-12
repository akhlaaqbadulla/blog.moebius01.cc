---
title: "Running Local LLMs in Production: Notes on Ollama and vLLM"
date: 2026-05-10
draft: false
summary: "Practical considerations from deploying on-prem Ollama and vLLM behind a unified web UI in an enterprise environment."
description: "Practical considerations from deploying on-prem Ollama and vLLM behind a unified web UI in an enterprise environment."
categories:
  - ai-ml
  - infrastructure
tags:
  - ollama
  - vllm
  - llm
  - on-prem
  - open-source
series:
  - On-Prem AI
---

A short writeup on lessons from deploying local LLMs in an enterprise setting. The goal
was simple: give internal users a controlled, private AI environment without sending data
to external APIs.

## Why on-prem at all

Three reasons most teams arrive at this:

1. **Data sensitivity** — regulated industries, internal documents, anything you can't
   send to a third party.
2. **Cost predictability** — token-based pricing gets expensive fast at organisational
   scale.
3. **Control** — model choice, model versions, audit trails, and integration with internal
   identity.

## The stack

```
┌────────────────────────────────────────┐
│  LibreChat (web UI, auth, history)     │
└──────────────┬─────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼──────┐ ┌──────▼──────┐
│   Ollama    │ │    vLLM     │
│  (lightweight)│ │ (throughput) │
└─────────────┘ └─────────────┘
       │               │
       └───────┬───────┘
               │
        ┌──────▼──────┐
        │   GPUs      │
        └─────────────┘
```

**Ollama** for quick iteration, smaller models, and inference where simplicity wins.
**vLLM** when you need throughput and proper batching for larger models.
**LibreChat** (migrated from OpenWebUI) for the user-facing surface — chats, history,
multi-model selection, and SSO integration.

## What I'd do differently

- Decide on GPU topology *before* picking inference servers. Memory layout dictates which
  models you can serve and at what concurrency.
- Treat the inference layer as a backend service with proper monitoring (latency
  percentiles, GPU utilisation, queue depth) — not an experiment.
- Version your model weights like you version code. "GPT-4-but-the-llama-version" is not
  reproducible.

More to come on the security side — auth, logging, prompt-injection mitigation in a
multi-tenant internal context.
