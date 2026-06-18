# Public Repository Safety

Habit-Tracking is a public repository. Do not commit real environment
information to tracked files.

## Do Not Commit

Never commit real values for:

- deployment domains or callback URLs,
- public or private server IP addresses,
- SSH ports, server usernames, or panel/admin URLs,
- database hosts, database names, database usernames, or passwords,
- cloud account identifiers or registry account identifiers,
- WeChat AppID, AppSecret, merchant IDs, certificate serial numbers, or keys,
- API keys, token secrets, private keys, certificates, or whitelist values,
- real production logs, request payloads, response payloads, or screenshots that
  expose private deployment data.

This rule applies to source code, README files, API docs, examples, tests,
validation scripts, task artifacts, commit messages, and release notes.

## Use Placeholders

Tracked files must use placeholders, for example:

```text
<DEPLOY_DOMAIN>
<SERVER_PUBLIC_IP>
<APP_ID>
<APP_SECRET>
<TOKEN_SECRET>
https://example.com
```

## Store Real Values Outside Git

Real values may only live in ignored local files, server environment variables,
panel/cloud provider configuration, or a password manager.

Examples:

```text
.env
.env.*
apps/miniprogram/app.local.config.js
```

## Before Commit

Before committing deployment or platform-integration work:

1. Search the changed files for real deployment values.
2. Confirm tracked files contain placeholders only.
3. Confirm real local config files are covered by `.gitignore`.
4. If real values entered Git history, rewrite the affected history and verify
   with a full-history search before pushing.
