# Project workflow

- Read this file before working on this project.
- Inspect git status first. When requested, run git pull --ff-only before changes. Preserve local edits; never reset or force-push without authorization.
- Use the exact Git branch name requested by the user; do not automatically prepend codex/.
- Read affected code and callers. Reuse existing components and dependencies; make the smallest complete change.
- Proceed with authorized work without routine confirmation. Ask only for missing decisions or destructive actions outside the request.
- Spec-kit is optional. When unavailable, proceed without initialization if the user authorizes it.
- Preserve the Pages Router, existing browser storage keys, configuration, topics, and message history unless an explicit migration is requested.
- Check official upgrade documentation. Update Next.js with compatible React and lint tooling; update Firebase browser and service-worker SDK versions together.
- Keep dependency manifests and their lockfiles consistent. Never report an upgrade as complete after a failed install.
- Use a calm responsive dashboard with Firebase accents, accessible labels, visible keyboard focus, light/dark themes, and reduced-motion support.
- Use reference websites for inspiration. Do not copy paid source or assets without an available license.
- Never commit credentials or print secret values. Treat service-account JSON as sensitive; the existing browser-stored credentials are for local development only.
- Run lint and a production build. Add a small meaningful check for new nontrivial logic. Review desktop/mobile and both themes when browser tools are available.
- Report changes, checks, skipped checks, and material risks. Do not commit, push, or deploy unless requested.
