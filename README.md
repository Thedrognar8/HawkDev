![Vigil](assets/vigil-banner.png)

# Vigil — moderation, tickets and economy for Yapin

A Node.js community bot with **243 built-in command names** (including aliases), embedded responses, private support tickets, economy progression, configurable moderation, and a clearly marked honeypot.

## Start

1. Install Node.js 18 or newer.
2. Put your Yapin bot token in `token.txt` beside `bot.js`, or set `YAPPER_BOT_TOKEN`.
3. Open **START VIGIL.cmd** and choose **1**. Use `node bot.js --start` for direct startup.
4. Give the bot the permissions and role hierarchy needed for your enabled features.
5. In a private staff channel run `!setlogs`, then `!logtest`.

Server and owner IDs are detected automatically. Administrators can configure moderation; support-role staff can manage tickets; ordinary members can use economy and selected public commands. The first **100** commands are registered in Yapin's composer. The other **143** still work when typed with `!`.

Read [COMMANDS.md](COMMANDS.md) for the generated command catalog, [REQUEST-COVERAGE.md](REQUEST-COVERAGE.md) for a feature-by-feature review of the 210 supplied ideas, and [UPGRADE.md](UPGRADE.md) for previous changes.

## Vigil operations terminal

Open **START VIGIL.cmd**. The terminal includes a short boot sequence, four accent themes, parallel preflight checks, command search, a read-only local ticket/log/task overview, the test suite, and an offline speed benchmark. No user IDs or tokens are printed by the overview.

Responsiveness improvements: independent permission reads run concurrently; the current owner needs only a fresh owner check; duplicate reads/alias checks are reused only within one incoming event. The next event rechecks permissions. Cases and log-outbox entries are saved together, then server log delivery runs in the background. Server discovery is bounded to three concurrent workers. Platform API latency and rate limits still apply.

Run `npm run benchmark` or choose **08** for a simulated-latency benchmark. It makes no network calls and is not a measurement of live Yapin response speed. Node 22+ supports the SDK's WebSocket gateway; older supported versions can use its polling fallback.

## Honeypot

The honeypot starts disabled. Run `!honeypot create` to create an armed `do-not-post` channel with a warning. Default enforcement deletes a non-staff post and applies a **10-minute timeout**, with an audit/log entry. Bots and staff are exempt.

- `!honeypot status`, `!honeypot off`, `!honeypot on`
- `!honeypot time 5` — timeout minutes
- `!honeypot action log` — observation only; no deletion or punishment
- `!honeypot action timeout` — use configured timeout
- `!honeypot action kick confirm` or `!honeypot action ban confirm`
- `!honeypot test` — dry-run log; does not punish anyone
- `!honeypot set confirm` — use the current dedicated decoy channel instead

## New moderation examples

- `!tempban USER_ID 2h reason`, `!tasks`, `!canceltask TASK_ID`
- `!massban ID1,ID2 confirm reason` — at most 20 targets, protected targets checked first
- `!mute USER_ID 10m reason`, `!extendmute USER_ID 5m`
- `!warnthreshold 3 10`, `!warnexpire 7`, `!unwarn USER_ID 1`
- `!purgeuser USER_ID`, `!purgelinks` — scans only the last 100 visible messages
- `!role add USER_ID ROLE_ID`, `!temprole USER_ID ROLE_ID 1h`
- `!autorole ROLE_ID`, `!verification setup ROLE_ID`, `!verify`
- `!reactionrole MESSAGE_ID EMOJI ROLE_ID`
- `!report USER_ID reason`, `!reports`, `!note add USER_ID TEXT`
- `!automod status`, `!automod test TEXT`, `!antilink on`, `!linkwhitelist add example.com`
- `!logs voice on`, `!logs disable joins`

Automatic/self-assigned/timed/reaction/bulk roles must be non-privileged. Use real platform timeouts for muting; a cosmetic mute role is not claimed to enforce permissions. Destructive batch/channel commands require a typed confirmation and have documented limits.

## Limits

Yapin is not Discord. This bot does not invent unsupported APIs for voice deafening, channel topics, role creation, deleted-message sniping, platform audit attribution, or NSFW image classification. See the coverage report for exact supported, partial and unavailable features.

Channel recovery recreates supported public-channel settings, not messages, original IDs, deleted roles, or private access lists. Lost visibility can look like deletion. Review `autoRestore` before production use; never replace the recovery baseline during an attack.

Scheduled unbans and temporary-role removal are persisted and resume after restart, with retries and failure records. They cannot run while the bot is offline. **Cancel a pending unban before intentionally replacing that ban outside Vigil**, since external ban actions cannot be reliably attributed by this SDK. Run one process per data directory.

The filter is heuristic; staff review and exceptions may be needed. Verification is an opt-in role, not a captcha or proof of identity. Logs and staff history describe local Vigil actions unless explicitly identified otherwise. Ticket conversations use a DM bridge to private staff rooms; attachments are not automatically relayed.

## Tests

- `npm test` — **72 offline tests**
- `npm run integration` — boots the actual bot module against a fake SDK/filesystem; verifies menu-limit routing, public economy, blocked unauthorized moderation and embed output. This uses Node's experimental VM-module test facility; the running bot does not require that flag.

No real members were banned, muted, kicked or assigned roles by these development checks. Test live permissions in a private server before enabling enforcement.

## Private files

`token.txt`, `.env` files, `data/`, exports, logs and local backups must stay private. They are excluded from Git. Server state includes staff notes, reports, ticket transcripts and scheduled actions. Keep external backups; no bot can make local files undeletable or stop a server owner from removing it.

The bundled `yapper.js` SDK is supplied by [Yapin](https://www.yapin.gg/developers). No license for that third-party SDK is asserted here.

## Profile and project cleanup

The main runtime and configuration are `vigil.js` and `vigil.config.json`. The selected [avatar](assets/vigil-avatar.png) and [banner](assets/vigil-banner.png) match the purple glitch lettering; their built-in ImageGen prompts are in [assets/PROFILE.md](assets/PROFILE.md). The profile assets are applied to the bot.

Obsolete starters, Python samples/SDK, one-off probes and source backups were moved out of the active project into a local `.archive/` folder. That archive is excluded from Git and is not required to run Vigil. Credentials, server data and historical audit entries are retained. `npm run docs` regenerates COMMANDS.md using the isolated bootstrap, without a live API connection.

## Quick setup update

- Run /ticketsetup: creates a support category with administrator-only private ticket rooms. Optional: /ticketsetup Support (role name, mention or ID). Members run /ticket and DM Vigil; staff use /ticketreply TEXT. DMs must be enabled.
- Run /honeypot setup: creates a clearly warned decoy channel. Default: 10-minute timeout; staff and bots exempt. /honeypot status and /honeypot off manage it.
- /autowarn on|off controls saved automatic language warnings; /filtertest TEXT previews matching. Existing /warnthreshold and /warnexpire apply. Standard filter timeouts remain enabled independently of autowarn.
- /avatar removed. Commands addressed to other bots are ignored. Exact slurs, leetspeak and separated variants are filtered; innocent short fragments such as ni are not blocked by default.

Vigil v2.3: /help automatically sends the complete command guide with descriptions and the running version. Long guides continue in bounded embeds without manual page commands.

If /honeypot setup reports missing Manage Channels, grant that permission to Vigil or create a dedicated decoy channel manually and use /honeypot setup channel CHANNEL_ID. Existing-channel setup still verifies the server and posts the warning before arming. It never silently converts your current chat into a trap. Timeout enforcement still needs moderation permission.

Role buttons: /rolebutton ROLE_ID Announcements Ping | Click to toggle announcement notifications. Posts an embed with a toggle button. /rolebutton list shows panel IDs; /rolebutton remove PANEL_ID disables one. Setup requires Administrator; clicking is public. Elevated roles are rejected both at setup and on each click. Vigil needs Manage Roles and sufficient role hierarchy.
