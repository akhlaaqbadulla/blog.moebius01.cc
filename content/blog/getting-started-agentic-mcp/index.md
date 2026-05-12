---
title: "Getting Started with Agentic AI and the Model Context Protocol"
date: 2026-05-12
draft: false
summary: "Anthropic published MCP in November 2024. It is now the closest thing we have to a USB-C for tool use. Here's what it is, what it isn't, and how to build something with it without lighting your data on fire."
description: "A practical introduction to agentic AI and the Model Context Protocol — what agents really are, how MCP differs from raw function calling, and how to build and secure a first MCP server."
author: "Mian Budulla"
categories:
  - ai-ml
  - devops
tags:
  - mcp
  - agentic-ai
  - claude
  - llm
  - tool-use
---

In November 2024, Anthropic published the Model Context Protocol — MCP. A year and a half later it has become, somewhat surprisingly, the closest thing we have to a *USB-C for tool use*: an open standard for letting language models talk to external tools, data sources, and systems, that's adopted across multiple vendors and SDKs.

I've now built two MCP servers in production-adjacent contexts. This post is the version of the introduction I wish I'd had when I started — focused on what agents actually are, what MCP changes, and how to build a useful server without giving an LLM the keys to production.

## What an "agent" actually is

Before MCP, the word *agent* meant different things to different people. The useful definition, the one the industry has more or less converged on, is fairly simple:

> **An agent is an LLM running in a loop, with access to tools and memory, working toward a goal it can verify making progress on.**

The components are all important:

- **Loop**: the model doesn't just answer once. It answers, observes the result, decides what to do next, and continues until it either succeeds, gives up, or hits a budget.
- **Tools**: side-effecting functions the model can call — read a file, run a shell command, query a database, hit an API.
- **Memory**: some form of state across the loop, even if it's just the conversation transcript. Most useful agents have richer state too.
- **Goal it can verify**: this is the part most people skip. An agent that can't tell whether it's done is just a chatbot in a loop. The verification can be tests, a checker function, a return value — but it has to exist.

Chatbots without tools are not agents. Agents without verification are not productive. The MCP world is what happens when you take that definition seriously.

## What MCP actually is

MCP is a protocol. It defines how an LLM-side *client* (Claude Desktop, Claude Code, an SDK) talks to a *server* that exposes tools, resources, and prompts. The wire format is JSON-RPC. The transport is typically stdio for local servers or HTTP+SSE for hosted ones.

What MCP gives you that raw function calling didn't:

1. **A standard shape.** Tools, resources, and prompts all have a defined schema. You write one server and it works with any compliant client. Function calling was per-vendor; MCP is cross-vendor.
2. **Three primitives, not one.** Function calling is just *tools*. MCP also defines *resources* (read-only data the model can pull in) and *prompts* (reusable templates the user can invoke). The distinction matters because the security boundary is different for each.
3. **Lifecycle and capability negotiation.** Client and server announce what they support, version the protocol, and degrade gracefully when something's missing. You can build a server today and still have it work with clients shipped two years from now.
4. **A community.** This is the real win. There are pre-built MCP servers for filesystems, GitHub, Slack, Postgres, Notion, Linear, Sentry, AWS, Kubernetes — dozens of them. You compose them rather than reinventing each integration.

What MCP is *not*:

- It is not an authorisation layer. You still need to do that yourself.
- It is not a sandbox. A tool that runs `rm -rf /` will run `rm -rf /`.
- It is not opinionated about model vendor. You can run it with Claude, but also with self-hosted models that have MCP client implementations.

## Building your first server

I'll use Python for the example, because the official Python SDK is well-shaped and most ops automation is written in it. The TypeScript SDK is equivalent if you prefer that side.

Install:

```bash
pip install mcp
```

Minimal server with one tool:

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("hello-server")

@mcp.tool()
def greet(name: str) -> str:
    """Return a friendly greeting for the given name."""
    return f"Hello, {name}!"

if __name__ == "__main__":
    mcp.run()
```

That's the whole server. The docstring becomes the tool description the model sees. Type hints become the input schema. Running this and pointing Claude Desktop at it gives the model a `greet` tool it can call.

To wire it into Claude Desktop, the config file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS) gets an entry like:

```json
{
  "mcpServers": {
    "hello": {
      "command": "python",
      "args": ["/path/to/your/server.py"]
    }
  }
}
```

Restart, ask Claude to greet someone, watch it call the tool. That's the loop.

## A useful example: read-only Proxmox

The hello-world is fine, but it doesn't illustrate why you'd bother. Here's a more honest example — a read-only MCP server that lets me ask Claude about my Proxmox cluster without giving it the ability to change anything.

```python
from mcp.server.fastmcp import FastMCP
from proxmoxer import ProxmoxAPI
import os

mcp = FastMCP("proxmox-readonly")

def _client() -> ProxmoxAPI:
    return ProxmoxAPI(
        host=os.environ["PROXMOX_HOST"],
        user=os.environ["PROXMOX_USER"],
        token_name=os.environ["PROXMOX_TOKEN_NAME"],
        token_value=os.environ["PROXMOX_TOKEN_VALUE"],
        verify_ssl=True,
    )

@mcp.tool()
def list_vms() -> list[dict]:
    """List all VMs across the Proxmox cluster with status and resource usage."""
    px = _client()
    out = []
    for node in px.nodes.get():
        for vm in px.nodes(node["node"]).qemu.get():
            out.append({
                "vmid": vm["vmid"],
                "name": vm["name"],
                "node": node["node"],
                "status": vm["status"],
                "cpu_pct": round(vm.get("cpu", 0) * 100, 1),
                "mem_mb": vm.get("mem", 0) // 1024 // 1024,
            })
    return out

@mcp.tool()
def get_vm_config(vmid: int, node: str) -> dict:
    """Return the configuration of a specific VM."""
    return _client().nodes(node).qemu(vmid).config.get()

if __name__ == "__main__":
    mcp.run()
```

Two tools, both read-only. Token auth, scoped to a read-only API user in Proxmox itself. Even if the model decided to misbehave, the worst case is reading data the operator already has access to.

Now I can ask: *"Which VMs are using more than 80% CPU?"* — and Claude calls `list_vms`, filters, and answers. No more flipping between five tabs.

## Security: the part nobody emphasises enough

The most important lesson from the first year of MCP: **the protocol gives you nothing for free on the security side**. The default posture for an MCP server is "exposes whatever you let it expose, to whatever model the user wires up." Everything below is on you:

1. **Principle of least privilege.** The token the server uses must be the *narrowest* role that does the job. Read-only by default. Write tools should require explicit human confirmation in the loop, not just a tool annotation.
2. **Tool descriptions are part of the attack surface.** The model decides which tool to call based on the description. An adversarial prompt + a loose description can cause the wrong tool to fire. Be precise.
3. **Indirect prompt injection.** This is the big one. Any content the agent reads — a ticket, an email, a webpage, a Confluence document — can contain instructions the model might follow. If the model has tools that touch your systems, untrusted content can become a write attempt. Either don't expose write tools, or gate them behind a human.
4. **Audit everything.** Log the tool name, arguments, return value, and the model identity that called it. The audit log is the only thing that gives you forensics when something goes sideways.
5. **Network egress.** If your MCP server has internet access, the model can exfiltrate. Server-side egress controls, not just trust.

A small heuristic I now use: *if I wouldn't give this tool to an unmonitored intern with a Bash prompt, I shouldn't expose it via MCP without a human-in-the-loop gate.*

## Where MCP is going

The MCP ecosystem in May 2026 is wider than it was even six months ago. Concretely:

- **Remote MCP servers over HTTP+SSE** — for tools that aren't local processes. This is what's enabling SaaS vendors to publish MCP endpoints directly.
- **Stronger primitives for authorisation.** OAuth-style flows for the user's identity, not just the server's token.
- **Tighter client integration.** Claude Code, Claude Desktop, Zed, several others — all speaking the same protocol means the same server works everywhere.

If you build infra tooling, exposing MCP servers for the read-only operations you already automate is, for the cost of a few hundred lines of Python, the closest thing to "force-multiplier" I've seen this year. The hard part is doing it without leaving the door open.

## A starting point

If I were learning this today, the path I'd take:

1. Read the [MCP spec](https://modelcontextprotocol.io). It's short, well-written, and answers most of the conceptual questions.
2. Clone one of the official reference servers (filesystem, GitHub, Slack) and run it against Claude Desktop. Get a feel for the loop.
3. Build your own read-only server for something in your stack. Internal monitoring, a wiki, a ticketing system — anywhere you currently lose time switching contexts.
4. *Only after that*: add a write tool, gated behind a confirmation step. Live with it for a while before adding the next one.

The temptation is to leap straight to "agent that does my job." The version that works is "agent that fetches the context I'd otherwise look up by hand." Start there. The rest follows.
