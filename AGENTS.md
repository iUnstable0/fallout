---
applyTo: '**'
---

Keep your changes as low impact as possible. You do not need to give me a summary of changes. You do not need to test the changes. Try to reference other parts of the codebase to ensure your changes are consistent with the existing code style and practices. Keep your responses concise and focused.

Read all context and instructions carefully before making changes. Code may be manually modified between messages. Do not suggest code that has been deleted or is no longer relevant.

This project uses ruby 3.4.4, rails 8.1.2 with React 19 and tailwind 4.1.18 through inertia-rails. Make sure to only suggest changes that are applicable to those versions. When possible, prefer to use the cli to generate boilerplate rather than editing files manually. You can always modify boilerplate generated from the cli.

Inertia acts as the internal bridge between rails and React. Please be careful what objects are passed across, as all attributes (even if unused in the frontend) are sent and can be viewed through developer tools. Inertia docs for LLMs is at: https://inertia-rails.dev/llms-full.txt

Pundit policies are also used and should be modified to fit. Please be careful as this pertains to security. If you are not sure about how to modify a policy, ask for clarification. Always ensure that you are following the principle of least privilege when modifying policies. Only give access to what is necessary for the feature to function properly. Do not give access to more than what is needed. Pundit documentation is available at: https://www.rubydoc.info/gems/pundit

We have two types of users, full users (who have authenticated through HCA), and trial users, who we have not confirmed the identity of. Trial users log in via an email, at the current state, trial users can only access their data, as we use a device cookie. Even if multiple people create trial accounts with the same email, they cannot access each other's data. Only full users can access their data across devices and access non public (available without auth) data. Trial users have limited access to features and data. When making changes, ensure that you are considering the implications for both types of users and modifying policies accordingly. Use pundit to enforce these access controls at a lower level.

Follow the principle of least access: by default, every action requires full HCA authentication, completed onboarding, and Pundit authorization. Only relax these defaults when explicitly necessary, and only for the specific actions that need it. When in doubt, deny access — it is always safer to require a user to be granted access than to accidentally expose an endpoint. Assume developers will forget to configure access on new actions, so the system must fail closed.

The guiding rule for `only:` vs `except:`: if a developer forgets to list a new action, the result must always be *less* access than intended, never *more*. Choose the keyword that makes forgetting fail toward restriction:

- **Directives that relax access** (`skip_authorization`, `skip_policy_scope`, `allow_unauthenticated_access`, `allow_trial_access`, `skip_onboarding_redirect`, `skip_before_action`): use `only:` — a forgotten action keeps the default restriction active.
- **Directives that add restrictions** (`before_action` enforcing a check like `require_admin!`): use `except:` or apply blanket — a forgotten action still gets the check.

Never use `except:` on a relaxing directive, and never use `only:` on a restricting `before_action`. Both mistakes would silently open access when a new action is added. Every access directive must also have an inline comment explaining why it is needed. When adding `allow_unauthenticated_access` or `allow_trial_access`, only grant the minimum access level required — prefer `allow_trial_access` over `allow_unauthenticated_access` unless the endpoint truly needs to be public.

Data must be preservable and reversible. When a feature involves deleting data, always ask the developer whether it should be soft-deleted or permanently destroyed — never assume either. Some data (like PII) should be truly deleted when a user expects it gone; other data should be soft-deleted for auditability. The developer makes this call every time. For values that change over time — especially currencies like koi — store each change as an individual record (e.g. a ledger entry: "+5 koi from ship review", "-10 koi from shop purchase") rather than mutating a single running total. The current balance is derived by replaying the history. This event-sourcing approach allows auditing, error correction, and reversal of individual transactions without data loss. Think of it like git: store the diffs, not the final state.

HCB controls money for the program, DO NOT EDIT ANY CODE RELATED TO HCB WITHOUT EXPLICIT WRITTEN APPROVAL. Alert in the chat that you're making changes to HCB code before doing so. Do not run any tests and console code containing stuff related without EXPLICIT WRITTEN APPROVAL.

When adding changes, use rails, inertia, React and pundit best practices and patterns. Use partials and helpers to keep code DRY. Use concerns to share code between models and controllers. Use inertia's features to keep the site experience high quality. Use React hooks and JSX patterns. Keep performance in mind and minimize database queries (e.g. use includes, avoid n+1 queries). Use background jobs for long running tasks. Use caching where appropriate. In rails, if you add the private keyword, please make sure to check nothing else is affected, as often there will be more existing code after your changes. Private methods should always be at the bottom of the class.

When modifying code, ensure that you maintain existing functionality and do not introduce bugs. Ensure that your changes are well-integrated with the existing codebase and follow the project's coding standards and conventions. Use `git diff` to see what you changed and run checks `bin/rubocop -f github` and `bin/brakeman --no-pager` before finishing to ensure code quality and security. In those checks, if there are issues that are unrelated to your changes, flag them, but you don't have to fix them.

If asked to change the requirements or behavior of a feature, make sure previous implementations that you suggested are also updated to reflect the new requirements. Always ask questions when needed.

Do not add comments unless they are absolutely necessary for clarity. Your code should describe what it does, not comments. If you do add comments, ensure they are clear, concise, and relevant to the code they accompany. Do not add huge blocks of comments. **Exception**: code that has non-obvious effects beyond its immediate file or scope — especially anything affecting security, access control, or authorization — MUST have an inline comment explaining why it exists. Examples include access directives, policy scoping, before_action filters that gate access, session/cookie manipulation, and any logic whose removal or modification would silently change who can access what. If someone reading the code in isolation couldn't tell why a line is there, comment it.
