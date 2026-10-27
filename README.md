# HawkDev

A Node.js moderation bot for Yapin with anti-raid monitoring, public-channel recovery, a configurable swear filter, economy commands, and server-scoped logs.

## Start

1. Install **Node.js 18 or newer**.
2. Create `token.txt` beside `bot.js` and paste your **Yapin bot token**. Alternatively set `YAPPER_BOT_TOKEN` or paste it at the launcher prompt.
3. Double-click **START HAWK.cmd**, or run `npm start`.
4. Add the bot to your server and grant the permissions required by the features you use.
5. Run `!setlogs` in a private staff text channel, then `!logtest`. Use `!help 1` for commands.

No server ID or user ID needs to be entered. Server owners and current members with a role whose `perms.administrator` is true can use moderation/configuration commands. Economy and selected informational/fun commands are available to members.

## Included

- **65 built-in commands**, plus capacity for **500 custom text-response commands** per server.
- Join-raid, flood, and mass-mention containment.
- Configurable swear filtering with timeout length, word exceptions, and channel exceptions.
- Recovery snapshots and public-channel recreation.
- Role quarantine and restoration for a **verified** attacker.
- Fictional economy: rewards, work, payments, banking, shop, and inventory.
- Persistent moderation cases and queued in-server log delivery.

Read [UPGRADE.md](UPGRADE.md) for command usage and operating details.

## Practical limits

The SDK does not expose reliable audit attribution for channel deletion, mass bans, or kicks. Hawk cannot automatically identify the responsible admin: verify responsibility before using `!quarantine USER_ID`.

Channel recovery cannot restore messages, original IDs, exact positions, or deleted roles. Private channels are skipped to prevent exposing permissions incorrectly. Lost visibility can look like channel deletion: keep bot access stable, or disable automatic recovery for staff-reviewed restores. Never run `!backup confirm` during an attack.

The swear filter is heuristic and cannot recognize every language or context. Administrators are exempt. Bot permissions and role hierarchy still apply to moderation. Economy coins have no cash value.

Keep one running process per data directory and back up that directory separately. The bot cannot prevent server owners removing it or local users deleting its files.

## Tests and private data

Run `npm test`. The project has **26 offline tests** covering permissions, isolation, filtering, economy, persistence, custom commands, and log delivery. Test live platform behavior in a private disposable server before relying on protection.

Tokens, environment files, `data/`, logs, and local backups are excluded by `.gitignore`. No token or private server data is included in this repository.

The bundled `yapper.js` SDK is supplied by [Yapin](https://www.yapin.gg/developers). No license for that third-party SDK is asserted here.
