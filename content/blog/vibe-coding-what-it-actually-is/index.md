---
title: "Vibe Coding: What It Is, When It Works, and When to Stop"
date: 2026-05-12
draft: false
summary: "Andrej Karpathy coined the term in February 2025. A year and change later, it's a real practice — and a real footgun. Where it speeds you up, where it bites, and how to tell the difference."
description: "A practitioner's guide to vibe coding — what Karpathy meant, where the practice actually delivers, and the specific situations where you should stop and write the code yourself."
author: "Mian Budulla"
categories:
  - devops
  - ai-ml
tags:
  - vibe-coding
  - claude-code
  - copilot
  - cursor
  - ai-pair-programming
---

In February 2025, Andrej Karpathy posted a description of how he'd been writing code: largely by talking to a model, accepting whatever it produced, and only stepping in when something visibly broke. He called it *vibe coding*. The phrase spread instantly, because it named a thing a lot of us were already doing but hadn't admitted out loud.

A year and change later, I've watched friends ship side projects in a weekend that would have taken a month, and I've watched teams introduce subtle production bugs because nobody actually read the diff. The practice is real and useful. It is also a footgun. Knowing which is which is the actual skill in 2026.

## What Karpathy actually meant

The original framing was specific. It wasn't "use AI to write code." It was closer to: *let the model drive, accept the suggestions, and only engage your own brain when the artefact misbehaves*. You give up the line-by-line review. You read the output the way you read a colleague's PR description, not their diff.

For toy projects, prototypes, and exploration, this is liberating. You stay in problem-framing mode and skip the typing entirely. For production code touching paying customers, it's a mistake. The hard part of senior engineering has never been typing.

## The tools, briefly

The practice is tool-agnostic, but the shape of the conversation differs.

- **GitHub Copilot** — inline suggestions, completes the next 1–10 lines. Closest to autocomplete on steroids. Lowest barrier, narrowest blast radius.
- **Cursor / Windsurf / Zed** — full IDE built around chatting with an agent. The agent reads files, edits, runs commands. You can authentically vibe-code in these.
- **Claude Code** — terminal-native agent that lives in your repo. Edits across files, runs tests, opens PRs. Heavier-weight, closer to giving a junior engineer the keys.
- **Aider, Continue, Codex CLI** — open and IDE-agnostic variants, often used by people who don't want their codebase ingested by a SaaS.

I use Claude Code daily and Copilot for muscle-memory completions. The combination covers most of what I need.

## Where it actually delivers

After a year of doing this seriously, the places it earns its keep are pretty consistent:

**Scaffolding.** Boilerplate for a new microservice, a Terraform module skeleton, a new Hugo theme file. The agent produces 80% of the structure correctly and you adjust the 20%. The marginal cost of starting something new dropped by an order of magnitude.

**Tests against an existing implementation.** Hand it a function and a description of the contract, get back a thorough test suite. This is one of the strongest cases — the implementation is the spec, the model just translates it into assertions. Easy to verify because you read the test, run it, and confirm pass/fail.

**Format-bound transformations.** Convert this CSV into a JSON schema. Rewrite these YAML files to a new structure. Generate a SQL migration from this Pydantic model. The model is very good at consistent format-to-format work and the diff is mechanically reviewable.

**Glue scripts.** The 30-line bash script that nobody wants to write but everyone needs once. The Python that hits an API, paginates the response, and dumps to disk. Disposable, throwaway, easy to read end-to-end.

**Documentation against existing code.** The model reads the implementation, produces a README that's roughly right, you correct a few things. Faster than writing it from scratch.

## Where it bites — every time, eventually

The failure modes are also depressingly consistent.

**Security-sensitive code.** Anything touching authentication, authorisation, secrets handling, cryptographic primitives, or input parsing for untrusted data. The model produces code that *looks* idiomatic and *passes* a happy-path test and has a subtle vulnerability you'll find at audit. I have caught: SQL string concatenation that bypassed the parameterised path; an OAuth flow that didn't validate the state parameter; an HMAC comparison that wasn't constant-time. All in plausible-looking, well-named functions.

**Data migrations.** A model will happily write a migration that drops a column "because it appears unused." It does not know about the cron job that reads it twice a year. Always read migrations line by line.

**Cross-file refactors that change semantics.** The model is fine at mechanical renames. It is not reliable at "thread this new parameter through and update every call site to pass the right value based on context." It will sometimes pass a sensible-looking default and lose information.

**Anything where the correct answer requires running the production system in your head.** This is where senior engineers earn their salaries. The model has never been on-call for your system. It does not know that the queue is backed up on Mondays, or that this service is the one with the leaky retry behaviour. It will confidently propose a change that re-creates a bug you fixed two years ago.

**Code where "looks correct" is the bug.** Polished, well-commented, idiomatic code that's wrong is worse than messy code that's wrong, because nobody reviews it carefully. The aesthetic of LLM output is dangerous in subtle ways.

## The trust-but-verify loop

The way I actually work in 2026, when I'm using an agent on real code:

1. **Plan first, write second.** I get the model to write a plan and read it carefully. Most disagreements get resolved here, before any code is written. The cost of changing your mind in the plan is zero. The cost in the diff is non-zero.
2. **Small diffs, fast feedback.** I'd rather make ten 50-line PRs than one 500-line PR. Vibe coding into a giant PR is the worst case — too much to review, too tempting to skim.
3. **Tests as the spec.** Before I let the agent touch a function, I have it write the tests against the existing behaviour, see them pass, *then* propose the change. The tests become the regression boundary.
4. **Read every line that touches security, auth, money, or migrations.** No exceptions. The agent is allowed to draft these; it is not allowed to land them unread.
5. **Verify in the running system, not just the test suite.** Especially for changes to live behaviour. A passing test is necessary, not sufficient.

## Vibe coding vs agentic coding

There's a useful distinction emerging. *Vibe coding* is the human-driven, conversational mode — you're at the keyboard, accepting or rejecting. *Agentic coding* is the model running a loop autonomously — picking up a ticket, writing code, running tests, opening a PR — with the human reviewing the artefact at the end.

Different shapes, different failure modes. Vibe coding fails by accepting plausible nonsense. Agentic coding fails by spending hours pursuing the wrong understanding. Both have their place; both need a different verification discipline.

## When to stop

If you find yourself accepting changes you don't fully understand, in code that matters, stop. Open the file. Read the diff. Make the model explain what it did and why. This sounds obvious. It is not what most people do under deadline pressure, which is exactly when you most need to do it.

The version of this practice that earns its keep is *fast on the boring stuff, careful on the important stuff*. The version that doesn't is *fast on everything, careful on nothing.* The second one is producing a lot of code right now. Some of it is going to be expensive to undo.
