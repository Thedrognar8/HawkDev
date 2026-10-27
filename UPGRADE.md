# Vigil upgrade: filter, economy and custom commands

Restart START VIGIL.cmd to load this update. No packages need installing.

60 built-in commands are now available. The supplied Yapin SDK caps registered commands at 100; Vigil also supports up to 500 additional custom text-response commands per server using the ! prefix. These custom commands are not registered in the slash-command menu. This is capacity for 500 custom commands, not 500 prewritten features.

## Swear filter
Enabled by default. A match attempts to delete the message and timeout the author for five minutes. Administrators and server owner are exempt. The bot needs Manage Messages and Timeout permissions and must be permitted to act on the member. Failed actions are recorded in cases/audit. The filter does not claim to recognize every language, spelling, or context. Its explicit list includes common English and selected Dutch/French/German/Spanish profanity/slurs; word matching avoids innocent substrings. It also detects selected leetspeak, zero-width and separator obfuscations, plus fuckyou. Never promise zero false positives: use exceptions when needed.

Administrator commands:
- !filter on / !filter off / !filter status
- !filtertime MINUTES (1-1440)
- !filteradd WORD
- !filterallow WORD
- !filterwords
- !filterignore (current channel)
- !filterunignore (current channel)
- !filterstats

Settings and violation counts persist in each server's data file. No notification message is posted on each violation, to avoid generating additional spam. Check !cases for enforcement outcomes.

## Economy (available to members)
- !balance / !bank / !profile
- !daily: 1,000 coins every 24 hours
- !weekly: 5,000 coins every seven days
- !monthly: 15,000 coins every 30 days
- !work: 100-250 coins every five minutes
- !cooldowns
- !pay USER_ID AMOUNT
- !deposit AMOUNT / !withdraw AMOUNT
- !richest
- !shop / !buy ITEM [QUANTITY] / !sell ITEM [QUANTITY]
- !inventory / !economy

Coins are fictional, have no cash value, and cannot be purchased with real money. Transfers are server-local. Balances, inventories and cooldowns persist. Economy transactions are serialized and roll back in memory if saving fails. Keep one bot process per data directory. Sales return 60% of purchase price.

Administrator economy commands:
- !addmoney USER_ID AMOUNT
- !removemoney USER_ID AMOUNT
- !resetmoney USER_ID confirm (clears that member's economy account, including cooldowns)

## Custom commands
- !customadd rules Please read the server rules before chatting.
- !rules now replies with that saved text.
- !customdelete rules
- !customlist [PAGE]
- !commandcount

Creating/deleting requires Administrator. Anyone can invoke a saved custom command. Text responses cannot execute code, call APIs, grant permissions or ping everyone. Limit: 500 commands per server, 1500 characters per response. Built-in names cannot be overwritten through customadd. Replies have a per-user cooldown.

## Other additions
!serverinfo, !avatar, !coinflip, !roll [SIDES]. !help PAGE lists 12 commands at a time. Every command is rate-limited. Existing moderation commands remain restricted to current Administrator roles/server owner. Help and new economy/fun/custom-list commands are public.

22 offline tests pass. Tests cover filtering/word exceptions, permissions, server isolation, persistence, concurrent reward claims, economy conservation, purchase/sale checks, rollback on save failure, enforcement calls, custom-command limits and registration budget. This upgrade was not tested by muting real members or changing live balances.

## Server logging and bot.js
Restart START VIGIL.cmd. In your private staff text channel run !setlogs, then !logtest. The channel must already exist and Vigil needs access and Send Messages permission. Only current Administrators/server owner can configure or inspect logging.

New commands:
- !setlogs -- use current channel; saved per server, no ID entry needed
- !logs -- status, queued count, destination, last error/success
- !logtest -- enqueue and attempt delivery of a test event
- !logsoff -- pause server delivery (local audit remains)
- !logson -- resume delivery

Records moderation cases, swear/spam timeouts and action failures, channel recovery, protection alerts, economy admin changes, configuration changes, and member joins/leaves. Logs show only available attribution; a member_leave event does not prove a kick or identify its actor. Private conversations and every ordinary message are not copied.

Outbox is stored in each server's existing JSON state, is bounded to 500 entries, and sends up to five queued entries per protection poll. Failed sends remain queued and !logs displays the error. Delivery is at least once: a process crash after sending but before saving can duplicate an entry. Overflow is counted; applicable moderation cases remain in the local audit. Logs start after !setlogs; earlier local cases are not backfilled. Paused/unconfigured logging does not enqueue new server entries. Mentions are neutralized. Recovered log channels are followed through saved replacement IDs, if the original channel was recoverable.

bot.js is the main entry point used by START VIGIL.cmd and npm start. bot.js.backup is a spare copy. Neither can be made undeletable by this bot: someone with filesystem deletion rights can still remove files. The launcher reports a missing bot.js. Restrict file access using your computer's account permissions if needed. The bot cannot prevent a server owner/admin from removing the bot when Yapin permits it.

65 built-in commands. 26 tests passed, including log retry, channel validation, mention suppression, pause behavior and concurrent delivery serialization. Logging was verified offline; no test messages were sent to a real server during this update.

## Configurable support tickets

Restart the bot after updating. Tickets are off until an Administrator configures them:

1. Create a Support role in Yapin and assign it to your support staff.
2. Run !ticketsetup SUPPORT_ROLE_ID (a role mention also works). Vigil creates a Vigil Support category and enables tickets.
3. In the public help channel, run !ticketpanel to post instructions.
4. Members type !ticket, then send details to Vigil in DMs. Vigil relays text to a private staff channel. Staff use !ticketreply TEXT in that room to reply privately.

Yapin's bundled SDK exposes role-based channel access, not per-member channel access. These are DM-bridged tickets: members do NOT join the staff channel. Vigil opens an initially empty generic ticket channel, applies the support role's private ACL, verifies it is private, and only then posts any ticket details. If privacy setup fails, no conversation is relayed. A failed setup may leave an empty channel marked failed in local state. The bot must retain access to private ticket channels; an Administrator bot role may be needed under platform permission rules. Members must allow DMs from Vigil.

Administrator configuration:
- !ticketsetup SUPPORT_ROLE_ID -- create category if needed, choose staff role and enable
- !ticketrole SUPPORT_ROLE_ID -- role for FUTURE ticket rooms
- !ticketcategory CATEGORY_ID -- category for FUTURE ticket rooms
- !tickettoggle on|off -- enable/disable new tickets; existing tickets continue
- !ticketlimit 1|2|3 -- open tickets per member per server
- !ticketsettings -- show configuration
- !ticketpanel -- post instructions in current channel

Member commands:
- !ticket -- open a ticket
- !tickets -- list YOUR open tickets
- !ticketclose [T-xxxxxxxx] -- close your own ticket from the original server
- In DMs, ordinary text is relayed when exactly one ticket is open. If several are open, use !ticketmsg T-xxxxxxxx YOUR MESSAGE. This DM command is text-based, not registered in the slash menu.

Support-role or Administrator commands, inside a private ticket staff room:
- !ticketclaim -- claim an unassigned ticket
- !ticketunclaim -- clear your assignment (Administrators may clear others)
- !ticketreply TEXT -- send a reply to the member's DM
- !ticketclose -- close and archive the current ticket
- !ticketrename NAME -- rename staff room
- !tickettranscript [PAGE] -- read saved transcript pages

Replies, claims and settings are stored per server. Current support-role membership is checked for staff commands. When changing the configured role, existing room permissions are NOT automatically rewritten: review those channels separately. Transcripts store at most 500 text messages per ticket; oldest entries expire beyond that limit. Attachments are not relayed automatically. There is a three-second per-ticket incoming-message cooldown. Transcripts and channels remain after closing; closed rooms are private/read-only. Treat local data backups as private support records.

Ticket logs record IDs/actions without copying private conversation text into the general staff log. Live ticket delivery has not been tested with real members. 32 offline tests passed, including failed privacy setup, blocked DMs, duplicate opens, sender ownership, privacy changes, staff roles, replies and archival. There are now 80 registered built-in commands, plus the DM !ticketmsg router and capacity for 500 custom text-response commands.

## Embeds and 50 more commands

Restart Vigil after updating. All ordinary chat responses now use purple VIGIL embeds, errors use red cards, and logs use teal cards. This includes command replies, ticket messages, moderation notices and custom responses. Already-built embed messages are preserved. The terminal launcher remains terminal text. Embedded descriptions are limited to 4000 characters and mentions are neutralized.

There are now **130 built-in commands**. Yapin's SDK caps menu registration at 100. The remaining 30 are handled by the same authorization/rate-limit layer when typed with ! (or a typed / prefix if Yapin delivers it as an ordinary message). They will not all appear in the slash composer. Use !help PAGE or !commandcount. Custom response capacity remains 500 per server; this is separate from the built-in count.

New PUBLIC economy shortcuts:
!eco = !economy; !bal = !balance; !dep = !deposit; !with = !withdraw; !inv = !inventory; !lb = !richest.

New PUBLIC commands:
- wallet, networth, rank, richbank, milestone
- item ITEM, sellprice RESOURCE, prices, payhelp
- hourly, salary
- fish, mine, forage, hunt, harvest (one-minute individual cooldowns)
- resources, recipes, craft rod|pickaxe|backpack
- sellresource RESOURCE QUANTITY
- xp, level, achievements, taskstats, quests, claimquest gatherer|trader
- pickjob courier|farmer|engineer, jobs, job, resign
- business, businesses, buybusiness kiosk|cafe|warehouse, collectbusiness, upgradebusiness
- donate AMOUNT, donations (fictional coins only)
- membercount, rolelist, channelinfo, uptime, botinfo

New ADMIN commands:
- setnickname USER_ID NICKNAME
- clearnickname USER_ID

Economy progression: gather resources, sell them or craft gear for triple gathering yield. Quest rewards can be claimed once. Pick a job and collect hourly salary; changing jobs does not reset the salary cooldown. Own one business, collect whole hours of income (up to 24 accrued hours), and upgrade to tier 5. Collect before upgrading: upgrading restarts accrual. No real-money purchases, payments or gambling are involved. All new economy mutations share the existing serialized transaction/rollback mechanism.

Economy/help commands are public. Sensitive moderation, money administration, configuration and logs remain Administrator-only. Support-role commands retain ticket-specific permissions. Public access never grants the member the bot's server permissions.

37 offline tests pass. New checks verify embed conversion and metadata, command-menu cap/fallback, public command access, one-time quests, gathering cooldowns, job cooldown continuity and invalid catalog-key rejection. This update did not send messages, change nicknames or spend live server coins during development.

## Private ban notices

/ban USER_ID reason (or !ban) opens a DM before removing the shared-server relationship, applies the ban, then sends a red embed: 'You have been banned from SERVER NAME', with the reason. If opening or sending the DM fails, the ban still succeeds and the moderator response/log records the delivery failure. If the ban fails, no false ban confirmation is sent. No real member was banned during development; 41 offline tests pass.

## Latest: honeypot and moderation expansion

Current total: 243 built-in command names including aliases, 100 composer entries and 143 typed commands. 72 offline tests plus an isolated actual-module bootstrap check pass. See README.md for current setup, COMMANDS.md for the authoritative catalog, and REQUEST-COVERAGE.md for all 210 supplied ideas and their limits.

The honeypot is opt-in and starts disabled. Use !honeypot create, !honeypot action log|timeout, !honeypot time MINUTES, !honeypot off/on/status/test. Kick or ban modes require an extra confirm argument. The channel gets a warning before it is armed. Non-staff messages trigger the configured action; staff/bots are exempt. Settings are server-local and persistent; logs record outcomes rather than assuming success.

Temporary bans and roles use persistent scheduled tasks. !tasks lists pending/failed actions; !canceltask ID cancels a pending task. Due work is processed in small batches while online; it resumes after restart. Scheduling retries three times with backoff. External bans/role edits cannot be reliably observed: cancel conflicting tasks manually. A cancelled temporary-role task does not immediately remove the role; a cancelled unban does not lift the ban.

Batch operations are deliberately bounded. massban/masskick/unbanall/voicemoveall process at most 20 targets. lockall/unlockall target up to 20 public text channels. Role all/bots/humans/removeall process a 20-member batch with an explicit next cursor. Filtered purges inspect only the last 100 visible messages. Channel cloning excludes private/read-only channels and does not copy history. deletechannel refuses logs/tickets/honeypot channels and flags intentional removals so recovery does not recreate them.

Warning thresholds apply when a new warning is issued; expiry is stored on future warnings and removed on polling. Warning appeals and member reports are saved to the staff review queue. Case deletion hides a record from history instead of destroying the original append-only audit. Notes, reports, exports and ticket records are private server data.

Automod master enable/disable and whitelist exemptions cover the swear/flood/additional-content filters, not honeypot or manual moderation. Antiraid and the temporary welcome gate are separate. Additional content-filter punishment can be log-only or timeout; existing swear/spam/mention controls retain their own enforcement settings. Scam/phishing controls use your configured domain blacklist, not a third-party threat reputation feed. Regex filtering and NSFW image classification are not implemented.

Log category toggles: !logs TYPE on|off or !logs disable TYPE, where TYPE is joins, leaves, voice, moderation, protection or general. Local audit is retained even with server delivery disabled. Voice logging depends on the SDK's exposed join/leave event fields. Platform-wide role/member/message-edit/deletion/invite/bans audit events are not invented.

## Vigil branding, operations terminal and responsiveness

The bot's live Yapin display name is Vigil. Reply embeds, logs and terminal labels now use Vigil. START VIGIL.cmd launches the redesigned operations console; START HAWK.cmd remains a compatible shortcut. Storage/import file names stay compatible with existing installations and server data.

The launcher has a VIGIL ASCII identity, four themes (Nebula/Glacier/Solar/Phosphor), short boot animation, concurrent startup-file checks, a command finder, local data overview, tests, and an offline speed benchmark. The overview shows aggregate counts from up to 20 state files and does not print user identities, conversations or tokens. Token formatting is checked locally; API connectivity is not falsely marked online before startup. Use --no-animation, --start, --check, --test or --benchmark for direct modes.

Permission lookups run independent server/member/role requests concurrently. Current-owner commands need one fresh owner lookup. Async request-local memoization removes repeated lookups inside nested aliases without retaining permission decisions between incoming events. An alias consumes one incoming command-rate-limit slot. Removed admin access and owner transfers are checked again on the next event.

Moderation cases and their queued server-log entry now share a state-file save. Server log delivery is kicked off in the background after persistence, avoiding an extra foreground save and a wait for server-log delivery. The persistent outbox still survives restarts and honors delivery errors/rate limits. Polling provides retry fallback. Server discovery runs at most three workers at once, and one server's initialization failure does not block others.

72 offline tests and the actual-module isolated bootstrap check pass. The optional benchmark uses a labeled simulated API delay; no live speed improvement percentage is claimed. Actual response time also depends on the platform/network and its API limits.
