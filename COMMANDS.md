# Vigil command catalog

Generated from the actual offline-bootstrapped handlers: **243 command names**, including aliases and shortcuts. The first 100 are composer-registered; the rest work when typed with `!`. Use `!help PAGE` inside Yapin. Public dispatch commands such as ticket still enforce permissions on their administrative subcommands. Bots cannot bypass platform permissions/role hierarchy.

| Command | Access | Usage / behavior |
|---|---|---|
| `!help` | Public | Paginated commands: PAGE |
| `!ping` | Administrator | Check connection |
| `!status` | Administrator | Protection status |
| `!backup` | Administrator | Replace baseline: confirm |
| `!restore` | Administrator | Recreate missing public channels |
| `!quarantine` | Administrator | Strip confirmed attacker roles: USER_ID |
| `!release` | Administrator | Restore roles: USER_ID confirm |
| `!ban` | Administrator | Ban USER_ID reason and notify them privately |
| `!kick` | Administrator | kick USER_ID reason |
| `!unban` | Administrator | unban USER_ID reason |
| `!timeout` | Administrator | USER_ID MINUTES reason |
| `!untimeout` | Administrator | Clear timeout: USER_ID |
| `!warn` | Administrator | USER_ID reason |
| `!warnings` | Administrator | View warnings: USER_ID |
| `!clearwarnings` | Administrator | Clear warnings: USER_ID |
| `!cases` | Administrator | Recent cases |
| `!case` | Administrator | NUMBER \| edit NUMBER reason \| delete NUMBER confirm |
| `!bans` | Administrator | List bans |
| `!userinfo` | Administrator | Inspect USER_ID |
| `!slowmode` | Administrator | Set SECONDS in this channel |
| `!lock` | Administrator | Lock current channel |
| `!unlock` | Administrator | Restore posting settings |
| `!purge` | Administrator | Delete 1-100 recent messages |
| `!raidmode` | Administrator | on\|off: temporary newcomer timeouts |
| `!ticketsetup` | Administrator | SUPPORT_ROLE_ID: enable private DM tickets |
| `!ticketrole` | Administrator | SUPPORT_ROLE_ID: change role for future tickets |
| `!ticketcategory` | Administrator | CATEGORY_ID: category for future tickets |
| `!tickettoggle` | Administrator | on\|off: allow new tickets |
| `!ticketlimit` | Administrator | 1-3: open tickets per member per server |
| `!ticketsettings` | Administrator | Show ticket configuration |
| `!ticketpanel` | Administrator | Post ticket instructions here |
| `!ticket` | Public | open\|close\|setup\|transcript\|claim\|reply |
| `!tickets` | Public | List your open tickets |
| `!ticketclaim` | Support/Admin | Assign this ticket to yourself |
| `!ticketunclaim` | Support/Admin | Remove your ticket assignment |
| `!ticketreply` | Support/Admin | TEXT: send a private reply to ticket owner |
| `!ticketclose` | Public | Close current staff ticket or your own ticket [ID] |
| `!tickettranscript` | Support/Admin | PAGE: saved text transcript in staff room |
| `!ticketrename` | Support/Admin | NAME: rename current staff room |
| `!balance` | Public | Your coin balance |
| `!bank` | Public | Your bank balance |
| `!daily` | Public | Claim 1,000 coins every 24 hours |
| `!weekly` | Public | Claim 5,000 coins every seven days |
| `!monthly` | Public | Claim 15,000 coins every 30 days |
| `!work` | Public | Earn coins every five minutes |
| `!pay` | Public | USER_ID AMOUNT: transfer coins |
| `!deposit` | Public | AMOUNT: wallet to bank |
| `!withdraw` | Public | AMOUNT: bank to wallet |
| `!richest` | Public | Top ten coin balances |
| `!shop` | Public | Coin item catalog |
| `!buy` | Public | ITEM [QUANTITY] |
| `!sell` | Public | ITEM [QUANTITY]: sell for 60% |
| `!inventory` | Public | Your purchased items |
| `!profile` | Public | Your economy profile |
| `!cooldowns` | Public | Remaining reward cooldowns |
| `!economy` | Public | Economy quick guide |
| `!addmoney` | Administrator | USER_ID AMOUNT |
| `!removemoney` | Administrator | USER_ID AMOUNT |
| `!resetmoney` | Administrator | USER_ID confirm |
| `!filter` | Administrator | on\|off\|status |
| `!filtertime` | Administrator | Timeout length: 1-1440 minutes |
| `!filteradd` | Administrator | Add a blocked word |
| `!filterallow` | Administrator | Allow an otherwise blocked word |
| `!filterwords` | Administrator | List custom words and exceptions |
| `!filterignore` | Administrator | Exempt this channel |
| `!filterunignore` | Administrator | Enable filter in this channel |
| `!filterstats` | Administrator | Swear violation counts |
| `!customadd` | Administrator | NAME RESPONSE: save custom command |
| `!customdelete` | Administrator | NAME: remove custom command |
| `!customlist` | Public | List custom commands: PAGE |
| `!commandcount` | Public | Count built-in and custom commands |
| `!serverinfo` | Public | Server details |
| `!avatar` | Public | Your profile picture |
| `!coinflip` | Public | Flip a coin |
| `!roll` | Public | Roll a die: SIDES |
| `!eco` | Public | Shortcut for !economy |
| `!bal` | Public | Shortcut for !balance |
| `!dep` | Public | Shortcut for !deposit |
| `!with` | Public | Shortcut for !withdraw |
| `!inv` | Public | Shortcut for !inventory |
| `!lb` | Public | Shortcut for !richest |
| `!wallet` | Public | Wallet coins only |
| `!networth` | Public | Wallet plus bank |
| `!rank` | Public | Your position on the server wealth board |
| `!richbank` | Public | Top ten bank savers |
| `!milestone` | Public | Your distance to the next wealth milestone |
| `!item` | Public | ITEM: catalog details |
| `!sellprice` | Public | RESOURCE: quote sale price |
| `!prices` | Public | All resource prices |
| `!payhelp` | Public | How to transfer coins |
| `!hourly` | Public | Claim 150 coins every hour |
| `!salary` | Public | Job payout every hour |
| `!fish` | Public | Gather fish every minute |
| `!mine` | Public | Gather ore every minute |
| `!forage` | Public | Gather herbs every minute |
| `!hunt` | Public | Gather hide every minute |
| `!harvest` | Public | Gather wheat every minute |
| `!resources` | Public | Your crafting resources |
| `!recipes` | Public | Crafting recipes |
| `!craft` | Public | rod\|pickaxe\|backpack: craft gathering gear |
| `!sellresource` | Public | RESOURCE QUANTITY: sell gathered materials |
| `!xp` | Public | Your activity XP |
| `!level` | Public | Your gathering level |
| `!achievements` | Public | View economy milestones |
| `!taskstats` | Public | Your gathered/sold totals |
| `!quests` | Public | Available one-time economy quests |
| `!claimquest` | Public | gatherer\|trader: claim a completed quest |
| `!pickjob` | Public | courier\|farmer\|engineer |
| `!jobs` | Public | Jobs and hourly salary |
| `!job` | Public | Your selected job |
| `!resign` | Public | Leave your selected job |
| `!business` | Public | Your business status |
| `!businesses` | Public | Business purchase prices / hourly base income |
| `!buybusiness` | Public | kiosk\|cafe\|warehouse: own one business |
| `!collectbusiness` | Public | Collect whole accrued business hours |
| `!upgradebusiness` | Public | Upgrade your business (maximum tier 5) |
| `!donate` | Public | AMOUNT: contribute to fictional server fund |
| `!donations` | Public | Your contribution and server fund |
| `!membercount` | Public | Server member count, when supplied by Yapin |
| `!rolelist` | Public | List role names and IDs |
| `!channelinfo` | Public | Current visible channel details |
| `!uptime` | Public | Bot process uptime |
| `!botinfo` | Public | Installed bot features and command count |
| `!setnickname` | Administrator | USER_ID NICKNAME: update member nickname |
| `!clearnickname` | Administrator | USER_ID: remove member nickname |
| `!honeypot` | Administrator | create\|set\|on\|off\|status\|time\|action\|test |
| `!antispam` | Administrator | on\|off: configure spam |
| `!antimention` | Administrator | on\|off: configure mentions |
| `!antieveryone` | Administrator | on\|off: configure everyone |
| `!antilink` | Administrator | on\|off: configure links |
| `!antiinvite` | Administrator | on\|off: configure invites |
| `!antiinviteadvert` | Administrator | on\|off: configure invites |
| `!anticaps` | Administrator | on\|off: configure caps |
| `!antiemoji` | Administrator | on\|off: configure emoji |
| `!antiduplicate` | Administrator | on\|off: configure duplicate |
| `!antizalgo` | Administrator | on\|off: configure zalgo |
| `!antiscam` | Administrator | on\|off: configure phishing |
| `!antiphishing` | Administrator | on\|off: configure phishing |
| `!automod` | Administrator | enable\|disable\|status\|test\|punishment\|ignore\|logs |
| `!linkwhitelist` | Administrator | add\|remove\|list DOMAIN |
| `!linkblacklist` | Administrator | add\|remove\|list DOMAIN |
| `!whitelist` | Administrator | add\|remove\|list user\|role\|channel ID |
| `!setlogs` | Administrator | Use this channel for Vigil logs |
| `!logs` | Administrator | status\|setup\|disable TYPE\|TYPE on\|off |
| `!logtest` | Administrator | Send a test log entry |
| `!logsoff` | Administrator | Pause server log delivery |
| `!logson` | Administrator | Resume server log delivery |
| `!tempban` | Administrator | USER_ID DURATION reason: scheduled unban |
| `!silentban` | Administrator | USER_ID reason: ban without a private notice |
| `!hackban` | Administrator | Ban by user ID; target need not currently be a member |
| `!banlist` | Administrator | Alias for !bans |
| `!baninfo` | Administrator | USER_ID: local ban history |
| `!massban` | Administrator | ID1,ID2 confirm reason (maximum 20) |
| `!masskick` | Administrator | ID1,ID2 confirm reason (maximum 20) |
| `!unbanall` | Administrator | confirm: unban at most 20 current bans per batch |
| `!tasks` | Administrator | List pending and failed scheduled tasks |
| `!canceltask` | Administrator | TASK_ID: cancel a pending action |
| `!unwarn` | Administrator | USER_ID WARNING_NUMBER |
| `!clearwarns` | Administrator | Alias for !clearwarnings |
| `!warnlist` | Administrator | Warning counts across the server |
| `!warnleaderboard` | Administrator | Members with the most local warnings |
| `!warnthreshold` | Administrator | COUNT [TIMEOUT_MINUTES]; 0 disables |
| `!warnexpire` | Administrator | DAYS; 0 means no expiry for new warnings |
| `!warnreason` | Administrator | USER_ID WARNING_NUMBER TEXT |
| `!warnnote` | Administrator | USER_ID WARNING_NUMBER TEXT |
| `!warnlog` | Administrator | USER_ID: copy local warning summaries to logs |
| `!warnmute` | Administrator | USER_ID reason |
| `!warnban` | Administrator | USER_ID reason |
| `!warnreset` | Administrator | confirm: clear all local warnings |
| `!warnappeal` | Public | WARNING_NUMBER TEXT: submit your appeal |
| `!mute` | Administrator | USER_ID DURATION reason |
| `!tempmute` | Administrator | USER_ID DURATION reason |
| `!unmute` | Administrator | Alias for !untimeout |
| `!mutelist` | Administrator | Timeouts tracked by Vigil |
| `!extendmute` | Administrator | USER_ID DURATION: extend a Vigil-tracked timeout |
| `!purgebots` | Administrator | Filter the last 100 visible messages |
| `!purgelinks` | Administrator | Filter the last 100 visible messages |
| `!purgeimages` | Administrator | Filter the last 100 visible messages |
| `!purgeembeds` | Administrator | Filter the last 100 visible messages |
| `!purgeinvites` | Administrator | Filter the last 100 visible messages |
| `!purgeattachments` | Administrator | Filter the last 100 visible messages |
| `!clean` | Administrator | Filter the last 100 visible messages |
| `!purgeuser` | Administrator | USER_ID: scan last 100 messages |
| `!purgecontains` | Administrator | TEXT: scan last 100 messages |
| `!purgeafter` | Administrator | MESSAGE_ID [SECOND_ID]: IDs must be in last 100 |
| `!purgebefore` | Administrator | MESSAGE_ID [SECOND_ID]: IDs must be in last 100 |
| `!purgebetween` | Administrator | MESSAGE_ID [SECOND_ID]: IDs must be in last 100 |
| `!pin` | Administrator | MESSAGE_ID: current channel |
| `!unpin` | Administrator | MESSAGE_ID: current channel |
| `!slowmodeoff` | Administrator | Disable slowmode |
| `!createchannel` | Administrator | NAME: create a public text channel |
| `!renamechannel` | Administrator | NAME: rename current channel |
| `!movechannel` | Administrator | CATEGORY_ID: move current channel |
| `!deletechannel` | Administrator | confirm: delete current non-system channel |
| `!clonechannel` | Administrator | NAME: clone public channel settings, not messages |
| `!archive` | Administrator | Lock current channel; history remains |
| `!lockall` | Administrator | confirm: lock up to 20 public text channels |
| `!unlockall` | Administrator | confirm: restore up to 20 public text channels |
| `!lockdown` | Administrator | Alias for !lockall |
| `!unlockdown` | Administrator | Alias for !unlockall |
| `!hide` | Administrator | ROLE_ID confirm: make current public channel private |
| `!unhide` | Administrator | Restore a channel hidden by Vigil to public |
| `!voicekick` | Administrator | USER_ID: disconnect from voice |
| `!voicemove` | Administrator | USER_ID VOICE_CHANNEL_ID |
| `!voicemoveall` | Administrator | SOURCE_ID DESTINATION_ID confirm: up to 20 |
| `!role` | Administrator | add\|remove\|info\|members\|all\|bots\|humans\|removeall |
| `!roleinfo` | Administrator | ROLE_ID: inspect role |
| `!temprole` | Administrator | USER_ID ROLE_ID DURATION |
| `!autorole` | Administrator | ROLE_ID\|off: safe role on join |
| `!verification` | Administrator | setup ROLE_ID\|off: opt-in role verification |
| `!verify` | Public | Opt in to the configured non-privileged role |
| `!unverify` | Administrator | USER_ID: remove configured verification role |
| `!whois` | Administrator | Alias for !userinfo |
| `!lookup` | Administrator | Alias for !userinfo |
| `!unquarantine` | Administrator | Alias for !release |
| `!wordfilter` | Administrator | Alias for !filter |
| `!banner` | Public | USER_ID (optional): profile banner |
| `!joined` | Public | Your server join timestamp, when exposed |
| `!accountage` | Public | Your account age, when creation date is exposed |
| `!modlogs` | Administrator | USER_ID: local moderation history |
| `!history` | Administrator | USER_ID: local moderation history |
| `!modstats` | Administrator | USER_ID: local moderator action totals |
| `!notes` | Administrator | USER_ID: staff notes |
| `!note` | Administrator | add\|remove USER_ID TEXT\|NUMBER |
| `!report` | Public | USER_ID reason: submit a report |
| `!reports` | Administrator | [REPORT_ID [close]]: staff review queue |
| `!reactionrole` | Administrator | MESSAGE_ID EMOJI ROLE_ID \| remove MESSAGE_ID EMOJI \| list |
| `!reason` | Administrator | CASE_NUMBER NEW_REASON |
| `!duration` | Administrator | USER_ID DURATION: replace an active tracked timeout |
| `!auditlog` | Administrator | View local Vigil cases (not the platform audit) |
| `!exportlogs` | Administrator | Save local case export on the bot host |
| `!announce` | Administrator | TEXT: send an embed in this channel |
| `!say` | Administrator | TEXT: send an embed in this channel |
| `!embed` | Administrator | TEXT: send an embed in this channel |
| `!badword` | Administrator | add\|remove\|list WORD |
| `!blacklist` | Administrator | word WORD: add a word to the swear filter |
| `!antiraid` | Administrator | enable\|disable: automatic join-surge timeouts |
| `!joinlimit` | Administrator | COUNT WINDOW_SECONDS: join-surge trigger |
| `!antinuke` | Administrator | on\|off\|status: public-channel recovery |
| `!welcomegate` | Administrator | on\|off: two-minute review timeout on join |
| `!modmail` | Public | Show private support instructions |
| `!joinlog` | Administrator | on\|off: configure server log category |
| `!leavelog` | Administrator | on\|off: configure server log category |
