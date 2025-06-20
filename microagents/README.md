# OpenReplica Microagents

Microagents are specialized prompts that enhance OpenReplica with domain-specific knowledge and task-specific workflows. They help developers by providing expert guidance, automating common tasks, and ensuring consistent practices across projects. Each microagent is designed to excel in a specific area, from Git operations to code review processes.

## Sources of Microagents

OpenReplica loads microagents from two sources:

### 1. Shareable Microagents (Public)
This directory (`OpenReplica/microagents/`) contains shareable microagents that are:
- Available to all OpenReplica users
- Maintained in the OpenReplica repository
- Perfect for reusable knowledge and common workflows

Directory structure:
```
OpenReplica/microagents/
├── # Keyword-triggered expertise
│   ├── git.md         # Git operations
│   ├── testing.md     # Testing practices
│   └── docker.md      # Docker guidelines
└── # These microagents are always loaded
    ├── pr_review.md   # PR review process
    ├── bug_fix.md     # Bug fixing workflow
    └── feature.md     # Feature implementation
```

### 2. Repository Instructions (Private)
Each repository can have its own instructions in `.openreplica/microagents/repo.md`. These instructions are:
- Private to that repository
- Automatically loaded when working with that repository
- Perfect for repository-specific guidelines and team practices

Example repository structure:
```
your-repository/
└── .openreplica/
    └── microagents/
        └── repo.md    # Repository-specific instructions
        └── ...        # Private micro-agents that are only available inside this repo
```


## Loading Order

When OpenReplica works with a repository, it:
1. Loads repository-specific instructions from `.openreplica/microagents/repo.md` if present
2. Loads relevant knowledge agents based on keywords in conversations

## Types of Microagents

Most microagents use markdown files with YAML frontmatter. For repository agents (repo.md), the frontmatter is optional - if not provided, the file will be loaded with default settings as a repository agent.


### 1. Knowledge Agents

Knowledge agents provide specialized expertise that's triggered by keywords in conversations. They help with:
- Language best practices
- Framework guidelines
- Common patterns
- Tool usage

Key characteristics:
- **Trigger-based**: Activated by specific keywords in conversations
- **Context-aware**: Provide relevant advice based on file types and content
- **Reusable**: Knowledge can be applied across multiple projects
- **Versioned**: Support multiple versions of tools/frameworks

You can see an example of a knowledge-based agent in [OpenReplica's github microagent](https://github.com/All-Hands-AI/OpenReplica/tree/main/microagents/github.md).

### 2. Repository Agents

Repository agents provide repository-specific knowledge and guidelines. They are:
- Loaded from `.openreplica/microagents/repo.md`
- Specific to individual repositories
- Automatically activated for their repository
- Perfect for team practices and project conventions

Key features:
- **Project-specific**: Contains guidelines unique to the repository
- **Team-focused**: Enforces team conventions and practices
- **Always active**: Automatically loaded for the repository
- **Locally maintained**: Updated with the project

You can see an example of a repo agent in [the agent for the OpenReplica repo itself](https://github.com/All-Hands-AI/OpenReplica/blob/main/.openreplica/microagents/repo.md).


## Contributing

### When to Contribute

1. **Knowledge Agents** - When you have:
   - Language/framework best practices
   - Tool usage patterns
   - Common problem solutions
   - General development guidelines


2. **Repository Agents** - When you need:
   - Project-specific guidelines
   - Team conventions and practices
   - Custom workflow documentation
   - Repository-specific setup instructions

### Best Practices

1. **For Knowledge Agents**:
   - Choose distinctive triggers
   - Focus on one area of expertise
   - Include practical examples
   - Use file patterns when relevant
   - Keep knowledge general and reusable


2. **For Repository Agents**:
   - Document clear setup instructions
   - Include repository structure details
   - Specify testing and build procedures
   - List environment requirements
   - Maintain up-to-date team practices
   - YAML frontmatter is optional - files without frontmatter will be loaded with default settings

### Submission Process

1. Create your agent file in the appropriate directory:
   - `microagents/` for expertise (public, shareable)
   - Note: Repository-specific agents should remain in their respective repositories' `.openreplica/microagents/` directory
2. Test thoroughly
3. Submit a pull request to OpenReplica


## License

All microagents are subject to the same license as OpenReplica. See the root LICENSE file for details.
