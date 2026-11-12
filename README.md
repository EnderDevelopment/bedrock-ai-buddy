# Minecraft Bedrock AI Companion Addon

AI Bedrock Buddy is a Minecraft Bedrock addon with a protective AI companion and a hostile AI enemy. The Guardian follows and defends players, responds to chat commands, and fights nearby Shadows; Shadows hunt players and Guardians.

## Install

1. Copy `GuardianAI_BP` into the world’s behavior packs folder and `GuardianAI_RP` into its resource packs folder, or import both packs if they are packaged together as an `.mcaddon`.
2. Activate the behavior pack and resource pack for your world, and accept the resource pack dependency when prompted.
3. Use a Bedrock Edition version that supports Minecraft `@minecraft/server` 2.0.0 and the pack’s minimum engine version, 1.21.0. Enable the required Script API experiment if your version asks for it.
4. Enter the world. A Guardian should appear beside each player when they join.

## Use

Type these commands in chat:

- `!help` — show the available commands.
- `!status` — ask the Guardian for its current mission.
- `!follow` — set the Guardian to follow you.
- `!guard` — set the Guardian to hold its area.
- `!summon guardian` — summon an additional Guardian.
- `!summon shadow` — summon a Shadow enemy.

The Guardian automatically attacks nearby Shadows and can retaliate when a Shadow hurts its player. Shadows target players and Guardians.

---

More Minecraft mod projects by EnderDevelopment: https://github.com/EnderDevelopment

Project page: https://dash.enderdevelopment.com/community/870e3288-4000-414a-ac01-4dcf4f857a80?utm_source=github&utm_medium=readme&utm_campaign=auto_publish&utm_content=870e3288-4000-414a-ac01-4dcf4f857a80
