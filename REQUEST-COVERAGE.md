# Coverage of the supplied 210 command ideas

This is a per-idea report, not a claim that every Discord feature exists on Yapin. The bot has 243 command names including aliases. Items marked Partial have narrower, explicit behavior; Unavailable items are not registered as fake-success commands.

Available: **119** · Partial: **41** · Unavailable: **50**

| # | Requested idea | Status | Implementation / limit |
|---|---|---|---|
| 1 | `/ban` | Available | Use !ban. See COMMANDS.md and command help for arguments and limits. |
| 2 | `/unban` | Available | Use !unban. See COMMANDS.md and command help for arguments and limits. |
| 3 | `/tempban` | Available | Use !tempban. See COMMANDS.md and command help for arguments and limits. |
| 4 | `/softban` | Unavailable | The SDK cannot request deletion of a banned user's message history; a ban/unban alone is not advertised as a history wipe. |
| 5 | `/massban` | Available | Use !massban. See COMMANDS.md and command help for arguments and limits. |
| 6 | `/hackban` | Available | Use !hackban. See COMMANDS.md and command help for arguments and limits. |
| 7 | `/silentban` | Available | Use !silentban. See COMMANDS.md and command help for arguments and limits. |
| 8 | `/banlist` | Available | Use !banlist. See COMMANDS.md and command help for arguments and limits. |
| 9 | `/baninfo` | Partial | Shows local Vigil ban/unban history, not a platform audit. |
| 10 | `/unbanall` | Available | Use !unbanall. See COMMANDS.md and command help for arguments and limits. |
| 11 | `/kick` | Available | Use !kick. See COMMANDS.md and command help for arguments and limits. |
| 12 | `/masskick` | Available | Use !masskick. See COMMANDS.md and command help for arguments and limits. |
| 13 | `/kickinactive` | Unavailable | No reliable member last-active history is exposed; inactivity is not guessed. |
| 14 | `/voicekick` | Available | Use !voicekick. See COMMANDS.md and command help for arguments and limits. |
| 15 | `/banappeal` | Unavailable | No dedicated post-ban appeal submission command is implemented. Existing DMs/tickets depend on platform DM access. |
| 16 | `/warn` | Available | Use !warn. See COMMANDS.md and command help for arguments and limits. |
| 17 | `/unwarn` | Available | Use !unwarn. See COMMANDS.md and command help for arguments and limits. |
| 18 | `/warnings` | Available | Use !warnings. See COMMANDS.md and command help for arguments and limits. |
| 19 | `/clearwarns` | Available | Use !clearwarns. See COMMANDS.md and command help for arguments and limits. |
| 20 | `/warnlist` | Available | Use !warnlist. See COMMANDS.md and command help for arguments and limits. |
| 21 | `/warnthreshold` | Available | Use !warnthreshold. See COMMANDS.md and command help for arguments and limits. |
| 22 | `/warnexpire` | Available | Use !warnexpire. See COMMANDS.md and command help for arguments and limits. |
| 23 | `/warnreason` | Available | Use !warnreason. See COMMANDS.md and command help for arguments and limits. |
| 24 | `/warnlog` | Available | Use !warnlog. See COMMANDS.md and command help for arguments and limits. |
| 25 | `/warnmute` | Available | Use !warnmute. See COMMANDS.md and command help for arguments and limits. |
| 26 | `/warnban` | Available | Use !warnban. See COMMANDS.md and command help for arguments and limits. |
| 27 | `/warnleaderboard` | Available | Use !warnleaderboard. See COMMANDS.md and command help for arguments and limits. |
| 28 | `/warnreset` | Available | Use !warnreset. See COMMANDS.md and command help for arguments and limits. |
| 29 | `/warnnote` | Available | Use !warnnote. See COMMANDS.md and command help for arguments and limits. |
| 30 | `/warnappeal` | Available | Use !warnappeal. See COMMANDS.md and command help for arguments and limits. |
| 31 | `/mute` | Available | Use !mute. See COMMANDS.md and command help for arguments and limits. |
| 32 | `/unmute` | Available | Use !unmute. See COMMANDS.md and command help for arguments and limits. |
| 33 | `/tempmute` | Available | Use !tempmute. See COMMANDS.md and command help for arguments and limits. |
| 34 | `/timeout` | Available | Use !timeout. See COMMANDS.md and command help for arguments and limits. |
| 35 | `/untimeout` | Available | Use !untimeout. See COMMANDS.md and command help for arguments and limits. |
| 36 | `/mutelist` | Partial | Only timeouts tracked by Vigil appear; externally applied timeouts are not inferred. |
| 37 | `/muterole` | Unavailable | Vigil uses platform timeouts. The SDK cannot guarantee a deny-speaking mute-role configuration across channels. |
| 38 | `/voicemute` | Unavailable | No participant voice-mute endpoint in the supplied SDK. |
| 39 | `/voiceunmute` | Unavailable | No participant voice-unmute endpoint. |
| 40 | `/deafen` | Unavailable | No participant deafen endpoint. |
| 41 | `/undeafen` | Unavailable | No participant undeafen endpoint. |
| 42 | `/muteall` | Unavailable | No voice mute endpoint; no fake mass-mute action. |
| 43 | `/unmuteall` | Unavailable | No voice unmute endpoint. |
| 44 | `/extendmute` | Partial | Extends a currently Vigil-tracked timeout. |
| 45 | `/mutesetup` | Unavailable | Cannot configure comprehensive role/channel permission denies through this SDK. |
| 46 | `/purge` | Available | Use !purge. See COMMANDS.md and command help for arguments and limits. |
| 47 | `/purgeuser` | Available | Use !purgeuser. See COMMANDS.md and command help for arguments and limits. |
| 48 | `/purgebots` | Available | Use !purgebots. See COMMANDS.md and command help for arguments and limits. |
| 49 | `/purgelinks` | Available | Use !purgelinks. See COMMANDS.md and command help for arguments and limits. |
| 50 | `/purgeimages` | Partial | Filters only metadata present in the last 100 visible messages. |
| 51 | `/purgeembeds` | Partial | Filters only the last 100 visible messages. |
| 52 | `/purgecontains` | Available | Use !purgecontains. See COMMANDS.md and command help for arguments and limits. |
| 53 | `/purgeafter` | Partial | Anchor must be in the last 100 visible messages. |
| 54 | `/purgebefore` | Partial | Anchor must be in the last 100 visible messages. |
| 55 | `/purgebetween` | Partial | Both anchors must be in the last 100 visible messages. |
| 56 | `/purgeinvites` | Available | Use !purgeinvites. See COMMANDS.md and command help for arguments and limits. |
| 57 | `/purgeattachments` | Partial | Filters only metadata present in the last 100 visible messages. |
| 58 | `/purgereactions` | Unavailable | The SDK can remove the bot's own reactions, not clear everyone's reactions. |
| 59 | `/nuke` | Unavailable | Not added as a one-step clone-and-wipe. Use explicit public clonechannel and confirmed deletechannel; history cannot be restored. |
| 60 | `/pin` | Available | Use !pin. See COMMANDS.md and command help for arguments and limits. |
| 61 | `/unpin` | Available | Use !unpin. See COMMANDS.md and command help for arguments and limits. |
| 62 | `/unpinall` | Unavailable | No complete pinned-message listing exposed; pin/unpin by message ID are supported. |
| 63 | `/snipe` | Unavailable | No deleted-message event/payload exposed. |
| 64 | `/editsnipe` | Unavailable | No message-edit event/history exposed. |
| 65 | `/clean` | Available | Use !clean. See COMMANDS.md and command help for arguments and limits. |
| 66 | `/lock` | Available | Use !lock. See COMMANDS.md and command help for arguments and limits. |
| 67 | `/unlock` | Available | Use !unlock. See COMMANDS.md and command help for arguments and limits. |
| 68 | `/lockall` | Partial | Processes up to 20 public non-system text channels. |
| 69 | `/unlockall` | Partial | Restores up to 20 public text channels with saved settings. |
| 70 | `/lockdown` | Partial | Alias of bounded lockall; does not shut off all server capabilities. |
| 71 | `/unlockdown` | Partial | Alias of bounded unlockall. |
| 72 | `/slowmode` | Available | Use !slowmode. See COMMANDS.md and command help for arguments and limits. |
| 73 | `/slowmodeoff` | Available | Use !slowmodeoff. See COMMANDS.md and command help for arguments and limits. |
| 74 | `/hide` | Available | Use !hide. See COMMANDS.md and command help for arguments and limits. |
| 75 | `/unhide` | Available | Use !unhide. See COMMANDS.md and command help for arguments and limits. |
| 76 | `/archive` | Partial | Locks a channel in place; retains history. |
| 77 | `/clonechannel` | Partial | Clones public writable settings only, not history or private access. |
| 78 | `/deletechannel` | Available | Use !deletechannel. See COMMANDS.md and command help for arguments and limits. |
| 79 | `/createchannel` | Available | Use !createchannel. See COMMANDS.md and command help for arguments and limits. |
| 80 | `/renamechannel` | Available | Use !renamechannel. See COMMANDS.md and command help for arguments and limits. |
| 81 | `/setnsfw` | Unavailable | No documented NSFW-channel flag setter. |
| 82 | `/settopic` | Unavailable | Channel topic editing is not exposed. |
| 83 | `/movechannel` | Available | Use !movechannel. See COMMANDS.md and command help for arguments and limits. |
| 84 | `/voicelimit` | Unavailable | No voice user-limit setter. |
| 85 | `/voicelock` | Unavailable | No supported voice-connect permission override setter. |
| 86 | `/voiceunlock` | Unavailable | No supported voice-connect override restoration. |
| 87 | `/voicemove` | Available | Use !voicemove. See COMMANDS.md and command help for arguments and limits. |
| 88 | `/voicemoveall` | Partial | At most 20 eligible participants per invocation. |
| 89 | `/threadlock` | Unavailable | No thread API exposed. |
| 90 | `/threadarchive` | Unavailable | No thread API exposed. |
| 91 | `/role add` | Available | Use !role add. See COMMANDS.md and command help for arguments and limits. |
| 92 | `/role remove` | Available | Use !role remove. See COMMANDS.md and command help for arguments and limits. |
| 93 | `/role create` | Unavailable | Role creation is not exposed. Create roles in the Yapin app. |
| 94 | `/role delete` | Unavailable | Role deletion is not exposed. |
| 95 | `/role rename` | Unavailable | Role-name editing is not exposed. |
| 96 | `/role color` | Unavailable | Role-color editing is not exposed. |
| 97 | `/role info` | Available | !role info ROLE_ID |
| 98 | `/role members` | Partial | Inspects one member page (up to 200); supply an after cursor to continue. |
| 99 | `/role all` | Partial | Non-privileged role; 20-member batch with a next cursor. |
| 100 | `/role bots` | Partial | Non-privileged role; filters the current 20-member batch. |
| 101 | `/role humans` | Partial | Non-privileged role; filters the current 20-member batch. |
| 102 | `/role removeall` | Partial | Non-privileged role; 20-member batch with a next cursor. |
| 103 | `/role permissions` | Partial | Read-only inspection; cannot edit permissions. |
| 104 | `/role hoist` | Unavailable | Role-hoist editing is not exposed. |
| 105 | `/role mentionable` | Unavailable | Role-mentionability editing is not exposed. |
| 106 | `/temprole` | Available | Use !temprole. See COMMANDS.md and command help for arguments and limits. |
| 107 | `/autorole` | Available | Use !autorole. See COMMANDS.md and command help for arguments and limits. |
| 108 | `/reactionrole` | Available | Use !reactionrole. See COMMANDS.md and command help for arguments and limits. |
| 109 | `/rolelist` | Available | Use !rolelist. See COMMANDS.md and command help for arguments and limits. |
| 110 | `/rolesync` | Unavailable | Role permission editing/synchronization is not exposed. |
| 111 | `/userinfo` | Available | Use !userinfo. See COMMANDS.md and command help for arguments and limits. |
| 112 | `/whois` | Partial | Profile via userinfo; local history is available separately through history/modlogs. |
| 113 | `/avatar` | Available | Use !avatar. See COMMANDS.md and command help for arguments and limits. |
| 114 | `/banner` | Available | Use !banner. See COMMANDS.md and command help for arguments and limits. |
| 115 | `/serverinfo` | Available | Use !serverinfo. See COMMANDS.md and command help for arguments and limits. |
| 116 | `/roleinfo` | Available | Use !roleinfo. See COMMANDS.md and command help for arguments and limits. |
| 117 | `/channelinfo` | Available | Use !channelinfo. See COMMANDS.md and command help for arguments and limits. |
| 118 | `/joined` | Partial | Displays a join timestamp only if returned by the platform. |
| 119 | `/accountage` | Partial | Displays age only if the platform supplies a valid creation date. |
| 120 | `/modlogs` | Available | Use !modlogs. See COMMANDS.md and command help for arguments and limits. |
| 121 | `/modstats` | Available | Use !modstats. See COMMANDS.md and command help for arguments and limits. |
| 122 | `/history` | Available | Use !history. See COMMANDS.md and command help for arguments and limits. |
| 123 | `/notes` | Available | Use !notes. See COMMANDS.md and command help for arguments and limits. |
| 124 | `/note add` | Available | !note add USER_ID TEXT |
| 125 | `/note remove` | Available | !note remove USER_ID NUMBER |
| 126 | `/altcheck` | Unavailable | No reliable alternate-account linkage data; identity is not guessed. |
| 127 | `/invitedby` | Unavailable | Invite attribution is not exposed. |
| 128 | `/inviteinfo` | Unavailable | Invite lookup metadata is not exposed. |
| 129 | `/membercount` | Available | Use !membercount. See COMMANDS.md and command help for arguments and limits. |
| 130 | `/lookup` | Available | Use !lookup. See COMMANDS.md and command help for arguments and limits. |
| 131 | `/automod enable` | Available | !automod enable |
| 132 | `/automod disable` | Available | !automod disable |
| 133 | `/antispam` | Available | Use !antispam. See COMMANDS.md and command help for arguments and limits. |
| 134 | `/antilink` | Available | Use !antilink. See COMMANDS.md and command help for arguments and limits. |
| 135 | `/antiinvite` | Available | Use !antiinvite. See COMMANDS.md and command help for arguments and limits. |
| 136 | `/anticaps` | Available | Use !anticaps. See COMMANDS.md and command help for arguments and limits. |
| 137 | `/antimention` | Available | Use !antimention. See COMMANDS.md and command help for arguments and limits. |
| 138 | `/antiemoji` | Available | Use !antiemoji. See COMMANDS.md and command help for arguments and limits. |
| 139 | `/antiduplicate` | Available | Use !antiduplicate. See COMMANDS.md and command help for arguments and limits. |
| 140 | `/antizalgo` | Available | Use !antizalgo. See COMMANDS.md and command help for arguments and limits. |
| 141 | `/antinsfw` | Unavailable | No image-classification service is configured. |
| 142 | `/antiscam` | Partial | Checks your configured domain blacklist; not an external reputation/classification feed. |
| 143 | `/antiphishing` | Partial | Checks configured domains; not a phishing intelligence service. |
| 144 | `/antighostping` | Unavailable | No message-delete/edit events for reliable ghost-ping tracking. |
| 145 | `/antieveryone` | Available | Use !antieveryone. See COMMANDS.md and command help for arguments and limits. |
| 146 | `/antiinviteadvert` | Partial | Uses the invite-link rule, not general advertising classification. |
| 147 | `/badword add` | Available | !badword add WORD |
| 148 | `/badword remove` | Available | !badword remove WORD |
| 149 | `/badword list` | Available | !badword list |
| 150 | `/wordfilter` | Available | Use !wordfilter. See COMMANDS.md and command help for arguments and limits. |
| 151 | `/regexfilter` | Unavailable | Arbitrary user-supplied regex filters are not implemented; explicit word/domain rules are supported. |
| 152 | `/whitelist` | Available | Use !whitelist. See COMMANDS.md and command help for arguments and limits. |
| 153 | `/blacklist` | Partial | Only blacklist word WORD is implemented; no user blacklist action. |
| 154 | `/linkwhitelist` | Available | Use !linkwhitelist. See COMMANDS.md and command help for arguments and limits. |
| 155 | `/linkblacklist` | Available | Use !linkblacklist. See COMMANDS.md and command help for arguments and limits. |
| 156 | `/automod punishment` | Available | !automod punishment log\|timeout [MINUTES] |
| 157 | `/automod ignore` | Available | !automod ignore user\|role\|channel ID |
| 158 | `/automod logs` | Partial | Uses the existing !setlogs destination; no separate automod-only destination. |
| 159 | `/automod status` | Available | !automod status |
| 160 | `/automod test` | Available | !automod test TEXT |
| 161 | `/antiraid enable` | Available | !antiraid enable |
| 162 | `/antiraid disable` | Available | !antiraid disable |
| 163 | `/raidmode` | Available | Use !raidmode. See COMMANDS.md and command help for arguments and limits. |
| 164 | `/joinlimit` | Available | Use !joinlimit. See COMMANDS.md and command help for arguments and limits. |
| 165 | `/minage` | Unavailable | The SDK does not guarantee account creation timestamps; no automatic age gate is claimed. |
| 166 | `/antibot` | Unavailable | No reliable unauthorized-bot-add attribution or inviter event is exposed. |
| 167 | `/antinuke` | Partial | Public-channel-loss monitoring/recovery, not attacker attribution or deleted-message recovery. |
| 168 | `/antiwebhook` | Unavailable | No documented webhook-creation audit/attribution feed is exposed. |
| 169 | `/verification setup` | Partial | Configures a safe opt-in role; not a captcha or identity check. |
| 170 | `/verify` | Partial | Grants a configured non-privileged opt-in role; not proof of identity. |
| 171 | `/unverify` | Available | Use !unverify. See COMMANDS.md and command help for arguments and limits. |
| 172 | `/captcha` | Unavailable | No real captcha provider is integrated; opt-in verification is clearly labeled. |
| 173 | `/verifylevel` | Unavailable | Discord verification levels are not part of this Yapin SDK. |
| 174 | `/quarantine` | Available | Use !quarantine. See COMMANDS.md and command help for arguments and limits. |
| 175 | `/unquarantine` | Available | Use !unquarantine. See COMMANDS.md and command help for arguments and limits. |
| 176 | `/quarantinerole` | Unavailable | Quarantine removes removable roles and records them; automatic deny-role setup is not exposed. |
| 177 | `/screening` | Unavailable | No platform screening-rules API exposed. |
| 178 | `/welcomegate` | Available | Use !welcomegate. See COMMANDS.md and command help for arguments and limits. |
| 179 | `/joinlog` | Available | Use !joinlog. See COMMANDS.md and command help for arguments and limits. |
| 180 | `/leavelog` | Available | Use !leavelog. See COMMANDS.md and command help for arguments and limits. |
| 181 | `/logs setup` | Partial | Sets the current staff channel as destination; does not create a channel tree. |
| 182 | `/logs messages` | Unavailable | No message edit/delete event feed. |
| 183 | `/logs members` | Unavailable | No complete member-update event feed; join/leave logs are available. |
| 184 | `/logs roles` | Unavailable | No role update event feed. |
| 185 | `/logs channels` | Partial | Protection alerts report observed missing channels. No complete channel-update event feed. |
| 186 | `/logs voice` | Available | !logs voice on\|off |
| 187 | `/logs moderation` | Available | !logs moderation on\|off |
| 188 | `/logs bans` | Partial | Local bot ban actions are logged under moderation; external ban/unban events are unavailable. |
| 189 | `/logs invites` | Unavailable | No invite creation/use event feed. |
| 190 | `/logs disable` | Available | !logs disable TYPE |
| 191 | `/auditlog` | Partial | Shows local Vigil cases only, explicitly labeled as not the platform audit. |
| 192 | `/exportlogs` | Partial | Writes a local case export on the bot host; no attachment upload endpoint is used. |
| 193 | `/ticket setup` | Available | !ticket setup SUPPORT_ROLE_ID |
| 194 | `/ticket open` | Available | !ticket open |
| 195 | `/ticket close` | Available | !ticket close |
| 196 | `/ticket add` | Unavailable | Per-member ticket channel access is not exposed. Tickets use DMs and a support role. |
| 197 | `/ticket remove` | Unavailable | Per-member ticket channel access is not exposed. |
| 198 | `/ticket transcript` | Available | !ticket transcript [PAGE] |
| 199 | `/report` | Available | Use !report. See COMMANDS.md and command help for arguments and limits. |
| 200 | `/reports` | Available | Use !reports. See COMMANDS.md and command help for arguments and limits. |
| 201 | `/case` | Available | Use !case. See COMMANDS.md and command help for arguments and limits. |
| 202 | `/case edit` | Available | !case edit NUMBER REASON |
| 203 | `/case delete` | Partial | Hides a case from history while preserving the original append-only audit. |
| 204 | `/reason` | Available | Use !reason. See COMMANDS.md and command help for arguments and limits. |
| 205 | `/duration` | Partial | Changes a currently Vigil-tracked timeout only. |
| 206 | `/staffonline` | Unavailable | A complete, reliable staff presence feed is not exposed. |
| 207 | `/modmail` | Partial | Uses the existing private ticket/DM workflow; command provides instructions. |
| 208 | `/announce` | Available | Use !announce. See COMMANDS.md and command help for arguments and limits. |
| 209 | `/say` | Available | Use !say. See COMMANDS.md and command help for arguments and limits. |
| 210 | `/embed` | Available | Use !embed. See COMMANDS.md and command help for arguments and limits. |
