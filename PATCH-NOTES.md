# Vigil — Protection Update

## Updates
- Join-raid detection now counts unique accounts instead of repeated gateway events.
- When a join surge triggers protection, temporary containment includes the recent arrivals that formed the surge, not just later arrivals.
- Join containment runs in sequence, skips current administrators, and avoids repeating successful timeouts within two minutes.
- A failed timeout for one member does not prevent attempts for the remaining arrivals.
- Existing antiraid, joinlimit and manual raidmode commands remain available.

## Anti-swear filter patches
- Added exact-word variants including fuh, dih, puh, dic, dik, fuk, fuq, phuck, shyt, bih and bytch.
- Added explicit adult-content keywords such as nsfw, porn, hentai and nudes. This filters text; it does not classify images or videos.
- Short variants match whole tokens, preserving ordinary words such as dictionary and publish. Custom word exceptions remain supported.
- Message deletion and flood timeouts are attempted independently and their outcomes are logged.

Restart the hosted bot after deploying. Existing filter exemptions and settings remain in effect. False matches can be exempted with /filterallow WORD.

## Role panels
- Renamed /rolebutton to /reactroles.
- A role mention alone now creates a panel: /reactroles @Announcements Ping.
- The button label defaults to the role name; custom labels and messages remain optional.
- Existing posted buttons and saved panels remain compatible. Elevated roles remain blocked.
