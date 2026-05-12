---
title: "AI-Augmented DevOps: Wiring Intelligence into Your Harness Pipelines"
date: 2026-05-12
draft: false
summary: "Most teams add AI to DevOps the wrong way — bolted onto the end, or replacing reviewers wholesale. Here's where AI actually earns its keep in a Harness pipeline, and where it absolutely shouldn't be."
description: "A pragmatic guide to using AI inside Harness CI/CD — where LLM calls genuinely add value (PR analysis, release notes, test selection), where they don't, and concrete YAML patterns for wiring them in."
author: "Mian Budulla"
categories:
  - devops
  - ai-ml
tags:
  - harness
  - ci-cd
  - llm
  - devops-ai
  - pipeline
---

The "AI in DevOps" pitch in 2026 is everywhere and mostly wrong. The wrong version is *replace your reviewers with an LLM*. The right version is *use LLMs in the specific spots where the failure mode is verifiable and cheap*. Harness — like Jenkins, GitHub Actions, GitLab CI, or any modern pipeline tool — gives you the seams to do this well, if you know where the seams are.

This is a working notebook from doing it in real Harness pipelines. What works, what doesn't, what the YAML actually looks like.

## The shape of a Harness pipeline

For anyone not embedded in Harness: a pipeline is a YAML document of *stages* containing *steps*. Stages run sequentially by default; steps within a stage run sequentially or in parallel. There's a templating layer, secrets management, approval gates, and — important for our purposes — *custom shell steps* that can run arbitrary code with access to pipeline variables.

That last one is the seam. Anywhere you can run a shell, you can call an LLM. The question is *where in the pipeline does that produce more value than it costs in latency, money, and false positives.*

## Where AI actually earns its keep

Four spots, in roughly increasing order of risk:

### 1. Release notes from the diff

The cheapest, safest win. After a merge to `main`, before the deploy stage, run a step that grabs the diff since the last release tag and asks an LLM to produce human-readable release notes. The output goes to the PR comment, the Slack channel, or the release page. Nobody dies if it's wrong; everyone's life is slightly better if it's right.

```yaml
- step:
    name: Generate release notes
    type: ShellScript
    spec:
      shell: Bash
      source:
        type: Inline
        spec:
          script: |
            DIFF=$(git log $LAST_TAG..HEAD --pretty=format:"- %s (%an)")
            curl -s https://api.anthropic.com/v1/messages \
              -H "x-api-key: $ANTHROPIC_API_KEY" \
              -H "anthropic-version: 2023-06-01" \
              -H "content-type: application/json" \
              -d "$(jq -n --arg diff "$DIFF" '{
                model: "claude-sonnet-4-6",
                max_tokens: 800,
                messages: [{
                  role: "user",
                  content: ("Produce concise release notes grouped by Features, Fixes, Internal. Diff:\n" + $diff)
                }]
              }')" | jq -r '.content[0].text' > release_notes.md
      envVariables:
        ANTHROPIC_API_KEY: <+secrets.getValue("anthropic_api_key")>
```

That's it. Cost: a few hundred input tokens per release, occasional reread by a human. Failure mode: notes are slightly off, easy to fix.

### 2. PR analysis as a review hint, not a gate

When a PR opens, run a stage that:
- Pulls the diff
- Asks an LLM to surface anything that looks risky — auth changes, deletes, schema changes, broad refactors
- Posts the output as a *non-blocking* comment

Note the word *non-blocking*. The mistake here is making it a required check. The model will produce false positives and the team will start clicking *override* on autopilot, which is worse than not running the check at all. Make it a hint a human reviewer reads before they start.

A useful prompt structure:

> *"You are reviewing a pull request. Identify any of the following: (1) changes to authentication or authorisation code, (2) destructive operations against data, (3) new external network calls, (4) changes to security-relevant configuration. Be specific. Cite file and line. If none, say so."*

The narrower the prompt, the more useful the output. "Review this PR for quality" gives you slop. "Find these four categories of risk" gives you a checklist.

### 3. Failing-test triage

A test fails in CI. The current human workflow is: open the failing log, read the stack trace, decide if it's the test, the code, or the infrastructure. A step that runs *only on failure* and asks the model to do a first-pass triage saves real time.

```yaml
- step:
    name: Triage failure
    type: ShellScript
    when:
      stageStatus: Failure
    spec:
      shell: Bash
      source:
        type: Inline
        spec:
          script: |
            LOG=$(tail -200 test_output.log)
            CONTEXT=$(git diff HEAD~5..HEAD -- '*.py' '*.go' 'requirements.txt' 'go.mod')
            # call LLM with $LOG and $CONTEXT, ask for a triage:
            #   - flaky test (cite log evidence)
            #   - genuine regression in this PR (cite the change)
            #   - environmental (network, dep version, secret missing)
            # post to the failure notification
```

The trick: include *recent context*, not just the failure. The model is much better at distinguishing a flaky test from a regression when it can see what just changed.

### 4. Smart test selection

The expensive case. On a large monorepo, running the full test suite on every PR is slow. You can ask the model: "Given this diff, which test files are most likely to be affected?" and run that subset first, falling back to the full suite afterward.

This works if you have:
- A reasonable mapping of code to tests
- A clear policy that the full suite still runs eventually (the model picks priority, not what runs at all)
- Telemetry to see whether the subset caught real failures

It does *not* work as a way to skip tests. If the model says a test isn't needed and you don't run it, you've replaced determinism with probability. The model picks order, not coverage.

## Where you absolutely should not put AI

The mirror image. Things I've seen tried and regretted:

**Replacing the code review.** Required LLM approval on PRs creates a Goodhart-style mess. People learn to phrase the diff to please the model. The model learns nothing. Review is the human work; the model can hint, but the human signs.

**Automated production rollbacks.** Triggering a rollback based on an LLM's interpretation of metrics is a recipe for amplifying transient noise into incidents. Rollbacks should be deterministic — threshold-based on a metric you defined — and triggered by humans for the cases that don't fit the threshold.

**Secret detection.** Use a deterministic scanner (gitleaks, trufflehog). LLMs miss things scanners catch and flag things scanners ignore.

**License compliance.** Deterministic again. You don't want the SBOM check to be probabilistic.

**Anything billed to the customer.** A pipeline step that auto-emails customers, generates a quote, or writes to a billing system is not the right place for "the LLM said so."

## The cost/latency budget question

Every LLM call in a pipeline adds time and money. Two principles:

1. **The call must finish in less than a minute or it's not in the critical path.** Long-running model calls belong in async jobs that *update* the PR, not block it.
2. **The cost per pipeline run must be visible and capped.** Log it. Show it. Have a budget. Otherwise you find out about it at the end of the month.

For the patterns above, even on a chunky monorepo, you're looking at single-digit cents per pipeline run if you're disciplined about prompt size. That's worth it. It stops being worth it the moment you start asking the model to read the whole codebase on every run.

## Concrete starter: a single LLM step you can copy

Here's a generic Harness shell step that takes a prompt and a context, calls Claude, and writes the result to a file. Drop this into a stage, pass the right inputs:

```yaml
- step:
    name: Call LLM
    type: ShellScript
    spec:
      shell: Bash
      source:
        type: Inline
        spec:
          script: |
            set -euo pipefail
            PROMPT=$1
            CONTEXT=$2
            OUTPUT_FILE=$3
            BODY=$(jq -n \
              --arg p "$PROMPT" \
              --arg c "$CONTEXT" \
              '{
                model: "claude-sonnet-4-6",
                max_tokens: 1500,
                messages: [
                  { role: "user", content: ($p + "\n\n---\n\n" + $c) }
                ]
              }')
            curl -fsS https://api.anthropic.com/v1/messages \
              -H "x-api-key: $ANTHROPIC_API_KEY" \
              -H "anthropic-version: 2023-06-01" \
              -H "content-type: application/json" \
              -d "$BODY" \
            | jq -r '.content[0].text' > "$OUTPUT_FILE"
      envVariables:
        ANTHROPIC_API_KEY: <+secrets.getValue("anthropic_api_key")>
```

Three input variables, one output file, idempotent failure mode (the step either writes or it doesn't). Compose this with the right `when` conditions and you have a small library of AI-augmented pipeline behaviour.

## The principle, summarised

Treat the LLM the way you'd treat a junior teammate looking over your shoulder. Good for first-pass observations, useful for boilerplate, occasionally wrong in ways an experienced engineer would catch. The pipeline patterns that work are the ones that give the model a clear, narrow job and a human who actually reads the output. The patterns that fail are the ones that promote the model from *teammate* to *gatekeeper*.

CI/CD is a determinism machine. AI is a probability machine. Putting them together works when the probability machine is producing hints and the determinism machine is making decisions. Reverse it, and you've built a flake generator.
