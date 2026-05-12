---
title: "The Hidden Cost of Hybrid Cloud: Lessons from 9 Years in the Trenches"
date: 2026-05-12
draft: false
summary: "Hybrid cloud is sold on flexibility. What it actually costs is operational discipline you usually don't have on day one. Notes from running the real thing."
description: "An infrastructure engineer's view on the real TCO of hybrid cloud — egress, operational overhead, when on-prem wins, and the discipline that makes it work."
author: "Mian Budulla"
categories:
  - infrastructure
  - cloud
tags:
  - hybrid-cloud
  - proxmox
  - azure
  - terraform
  - tco
---

When a vendor pitches hybrid cloud, the slide deck always has three boxes — *On-Prem*, *Cloud*, *Hybrid* — and an arrow pointing at the third one labelled "best of both worlds." After running hybrid environments across several companies, my honest reaction now is: *only if you bring the operational discipline of both worlds with you*. Otherwise you've just bought the cost of both with the elasticity of neither.

This isn't an argument against hybrid. I've designed and run it, I still believe in it, and at ELCA we deliberately keep workloads on both sides of the line. But the gap between the brochure and the bill is wider than people admit, and the gap is where most of the regret lives.

## What "TCO" actually means once you sign

Licensing comparisons are the easiest thing to put in a slide and the least useful number you'll ever calculate.

The costs that decide whether hybrid was worth it show up *after* go-live:

- **Egress.** Pulling data *out* of a public cloud is where the bill gets weird. Moving 10 TB of model weights or a daily database snapshot back to on-prem hits a per-GB egress charge that doesn't show up on a spreadsheet until you've done it for a quarter. Pure on-prem doesn't have this. Pure cloud doesn't either, if you stay in. Hybrid is exactly the architecture where you cross the boundary on purpose, repeatedly.
- **Network latency tax.** Anything chatty across the boundary — a DB on-prem and an app in Azure, or vice versa — pays a tax on every request. You either re-architect to be less chatty (engineering time), accept the latency (UX hit), or duplicate the dependency on both sides (storage and consistency overhead).
- **Two control planes.** Your engineers now need to be fluent in two stacks. Identity, networking, secrets, monitoring, backup — each has an on-prem implementation and a cloud one, and you have to either run both or build a unifying layer. Both are expensive.
- **Two incident playbooks.** When something breaks at 03:00, "is this an on-prem problem or a cloud problem" is the first triage question, and answering it costs minutes you don't have.

None of that appears on the vendor's TCO calculator, and all of it is real.

## Where on-prem still wins (and why I keep recommending it)

I'm not a cloud sceptic. I've migrated workloads to Azure that should have gone to Azure five years earlier. But there are categories where on-prem is the right answer in 2026, and they're not the ones people expect.

**Data sovereignty.** If your regulator says the data lives in a specific jurisdiction, in a specific class of facility, the cloud region map almost never lines up perfectly. Healthcare, defence, and parts of finance still ship workloads on-prem because *legal* says so, not because *engineering* prefers it.

**GPU economics.** This is the new one. Running an inference workload on borrowed A100s or H100s in a public cloud is roughly 3–5x the cost of running it on a depreciating asset you own — *once you have steady-state demand*. The qualifier matters. For spiky or experimental workloads, cloud GPUs win on flexibility every time. For a chat assistant your whole company uses every day during business hours, the maths flips fast.

**Predictable latency.** A storage workload that needs sub-millisecond response, or a network device terminating thousands of concurrent VPN sessions, runs more predictably on hardware you control. Cloud has improved enormously here, but "predictable enough for the SLO" still favours metal in specific cases.

**Tight integration with physical operations.** Manufacturing floors, hospitals, labs — anything where the compute is sitting next to a machine producing a signal. Cloud round-trips don't make sense.

## The Proxmox vs VMware moment

The big infrastructure event of the last two years was Broadcom's pricing reshuffle of VMware. I watched several environments scramble — including environments I'd previously argued *should* be on VMware, because the stability and ecosystem were worth the licence.

The realistic alternatives in 2026 are:

1. **Proxmox VE** — open source, mature, KVM-based. Strong on Linux workloads, improving on Windows, very strong storage story via Ceph or ZFS.
2. **Hyper-V** — fine if you're already a Microsoft shop and want to lean further in.
3. **Nutanix / OpenShift Virtualization** — heavier, more opinionated, more expensive but more "platform."

I've moved real production workloads from VMware to Proxmox, and the honest summary is: *Proxmox works, but you have to actually run it like a platform.* That means structured backup (Proxmox Backup Server is genuinely good), proper Ceph storage with three nodes minimum, network segmentation done deliberately, and a discipline around updates that VMware tooling used to give you for free.

The licence saving is real and large. The operational discipline cost is also real. People usually budget for the first and not the second.

## What hybrid actually requires

If I were starting a hybrid build today, the things I'd insist on before anything else lands in production:

1. **One identity provider, federated to both sides.** Entra ID, Okta — pick one. The number of incidents I've seen caused by local AD diverging from cloud AD is staggering. Build the federation first, populate workloads second.
2. **Infrastructure-as-code, no exceptions.** Terraform for both sides. Ansible for configuration. If you can't reproduce the environment from code in a fresh region, you don't actually have hybrid cloud, you have two environments that happen to share a logo.
3. **Centralised observability before you need it.** Logs and metrics from both sides flowing into one place. Grafana, Wazuh, or whatever you prefer — but *one* dashboard. Diagnosing a cross-boundary issue with two separate observability stacks is misery.
4. **Network design that names the boundary explicitly.** VPN or ExpressRoute, defined CIDR ranges, documented egress points, and a hard rule about which traffic patterns cross the boundary and which don't. Then enforce it with firewall policy, not goodwill.
5. **A migration story in both directions.** Because the right answer for workload X today is not the right answer in two years. If you can't move it back, you've built a one-way door.

## The honest summary

Hybrid cloud is the right architecture for a lot of organisations — including most of the ones I've worked at. But it earns its keep through engineering discipline that pure on-prem and pure cloud can both get away without. The "best of both worlds" claim is true only if you do the work; otherwise it's "the cost of both, the agility of neither, and a slightly bigger blast radius."

The version of hybrid I now recommend is *conservative on the boundary, aggressive on the IaC, ruthless on the egress*. That's the version that survives a calendar year and a leadership change. The other version usually doesn't.
