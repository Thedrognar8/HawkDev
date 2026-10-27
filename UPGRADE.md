# HawkDev upgrade: filter, economy and custom commands

Restart START HAWK.cmd to load this update. No packages need installing.

60 built-in commands are now available. The supplied Yapin SDK caps registered commands at 100; Hawk also supports up to 500 additional custom text-response commands per server using the ! prefix. These custom commands are not registered in the slash-command menu. This is capacity for 500 custom commands, not 500 prewritten features.

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
Restart START HAWK.cmd. In your private staff text channel run !setlogs, then !logtest. The channel must already exist and Hawk needs access and Send Messages permission. Only current Administrators/server owner can configure or inspect logging.

New commands:
- !setlogs -- use current channel; saved per server, no ID entry needed
- !logs -- status, queued count, destination, last error/success
- !logtest -- enqueue and attempt delivery of a test event
- !logsoff -- pause server delivery (local audit remains)
- !logson -- resume delivery

Records moderation cases, swear/spam timeouts and action failures, channel recovery, protection alerts, economy admin changes, configuration changes, and member joins/leaves. Logs show only available attribution; a member_leave event does not prove a kick or identify its actor. Private conversations and every ordinary message are not copied.

Outbox is stored in each server's existing JSON state, is bounded to 500 entries, and sends up to five queued entries per protection poll. Failed sends remain queued and !logs displays the error. Delivery is at least once: a process crash after sending but before saving can duplicate an entry. Overflow is counted; applicable moderation cases remain in the local audit. Logs start after !setlogs; earlier local cases are not backfilled. Paused/unconfigured logging does not enqueue new server entries. Mentions are neutralized. Recovered log channels are followed through saved replacement IDs, if the original channel was recoverable.

bot.js is the main entry point used by START HAWK.cmd and npm start. bot.js.backup is a spare copy. Neither can be made undeletable by this bot: someone with filesystem deletion rights can still remove files. The launcher reports a missing bot.js. Restrict file access using your computer's account permissions if needed. The bot cannot prevent a server owner/admin from removing the bot when Yapin permits it.

65 built-in commands. 26 tests passed, including log retry, channel validation, mention suppression, pause behavior and concurrent delivery serialization. Logging was verified offline; no test messages were sent to a real server during this update.
