---
id: "ai-kol-on-x"
title: "AI KOL Network Analysis"
subtitle: "Mapping information flow through AI Twitter's opinion leaders"
date: "2026-01-11"
summary: "An interactive visualization tool that maps how information flows between AI Key Opinion Leaders on X/Twitter—revealing hidden clusters, bridge influencers, and the structure of AI discourse."
tags: [visualization, data, network-analysis, d3js, python, nextjs]
---

## AI KOL Network Analysis

> Who influences the AI conversation? And how does information really flow between communities?

**Live Demo:** [ai-kol-network-analysis.youware.app](https://ai-kol-network-analysis.youware.app/)

![AI KOL](/images/ai_kol.jpg)

---

### The Question

AI Twitter is a dense, fast-moving ecosystem. Researchers, founders, investors, and engineers all share ideas—but the structure of this network is invisible. Who are the true connectors? Which clusters exist? How does content travel from original thinkers to mass audiences?

This project makes that structure visible.

### How It Works

The system uses a **snowball sampling** approach starting from seed accounts (Karpathy, Yann LeCun, Sam Altman, and ~40 others):

1. **Data Collection**: For each seed, fetch their recent retweets and quote-tweets
2. **Network Expansion**: Find who they interact with, filter to personal accounts with 10K+ followers
3. **Graph Construction**: Build a directed graph where edges represent retweet relationships
4. **Community Detection**: Apply the Louvain algorithm to discover natural clusters
5. **Flow Analysis**: Compute how content moves between communities

### Key Features

- **Force-Directed Network Graph**: Explore the full KOL network with D3.js—nodes sized by influence, colored by community
- **Community Clusters**: Automatically detected groups like "AI Researchers", "AI Founders", "OpenAI Ecosystem"
- **Content Flow Visualization**: See which communities produce vs. consume content
- **Bridge Detection**: Identify users who connect disparate communities
- **Leader/Consumer Scoring**: Each node shows whether they're a content source (orange border) or amplifier (blue border)

### Technical Stack

| Layer | Technology |
|-------|------------|
| Data Collection | Python + twitterapi.io |
| Graph Analysis | NetworkX + Louvain + scikit-learn |
| Frontend | Next.js + TypeScript |
| Visualization | D3.js force simulation |
| Deployment | YouWare |

### What I Learned

- **Clusters are real**: The algorithm consistently finds ~10 distinct communities
- **Bridges matter**: A handful of accounts (often not the biggest) connect otherwise isolated groups
- **Flow is asymmetric**: Some communities produce original content; others primarily amplify
- **The graph is smaller than expected**: Core AI Twitter is ~400-500 highly connected accounts

---

The visualization is fully interactive—click any node to open their X profile, hover to see connections, or toggle to Flow view to see the Sankey diagram of inter-community content flow.
