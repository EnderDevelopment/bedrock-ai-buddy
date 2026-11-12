import { world, system } from "@minecraft/server";

const GUARDIAN = "guardianai:guardian";
const SHADOW = "guardianai:shadow";
const guardians = new Map();
const modes = new Map();
const attackCooldowns = new Map();
const messages = {
  help: "Guardian commands: !status, !follow, !guard, !summon guardian, !summon shadow",
  follow: "I will stay close and protect you.",
  guard: "I will hold this area and watch for Shadows.",
  status: "I am watching your back. Shadows are my priority.",
  guardian: "Guardian AI online. Stay behind me!",
  shadow: "Threat detected. Keep moving and let me handle it.",
  unknown: "I did not understand that. Say !help for commands."
};

function distanceSquared(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

function say(player, text) {
  player.sendMessage(`§b[Guardian]§r ${text}`);
}

function spawnGuardian(player) {
  const existing = player.dimension.getEntities({ type: GUARDIAN, location: player.location, maxDistance: 8 });
  if (existing.length > 0) {
    guardians.set(player.id, existing[0]);
    return existing[0];
  }
  const guardian = player.dimension.spawnEntity(GUARDIAN, {
    x: player.location.x + 1.5,
    y: player.location.y,
    z: player.location.z + 1.5
  });
  guardian.nameTag = "Guardian AI";
  guardians.set(player.id, guardian);
  modes.set(player.id, "follow");
  say(player, messages.guardian);
  return guardian;
}

function getGuardian(player) {
  let guardian = guardians.get(player.id);
  if (!guardian || !guardian.isValid) guardian = spawnGuardian(player);
  return guardian;
}

function nearestEnemy(guardian) {
  const enemies = guardian.dimension.getEntities({ type: SHADOW, location: guardian.location, maxDistance: 20 });
  let nearest;
  let nearestDistance = Infinity;
  for (const enemy of enemies) {
    const distance = distanceSquared(guardian.location, enemy.location);
    if (distance < nearestDistance) {
      nearest = enemy;
      nearestDistance = distance;
    }
  }
  return nearest;
}

function attack(attacker, target, damage, cooldownKey) {
  const now = system.currentTick;
  const lastAttack = attackCooldowns.get(cooldownKey) ?? 0;
  if (now - lastAttack < 18 || !attacker.isValid || !target.isValid) return;
  if (distanceSquared(attacker.location, target.location) > 12.25) return;
  attackCooldowns.set(cooldownKey, now);
  target.applyDamage(damage, { damagingEntity: attacker });
}

function maintainGuardian(player) {
  const guardian = getGuardian(player);
  if (!guardian.isValid) return;
  const enemy = nearestEnemy(guardian);
  if (enemy) {
    attack(guardian, enemy, 7, `${guardian.id}:enemy`);
    return;
  }
  if (modes.get(player.id) !== "follow") return;
  if (distanceSquared(guardian.location, player.location) > 64) {
    guardian.teleport({ x: player.location.x + 1, y: player.location.y, z: player.location.z + 1 }, {
      dimension: player.dimension,
      facingLocation: player.location
    });
  }
}

function handleChat(event) {
  const message = event.message.trim().toLowerCase();
  if (!message.startsWith("!")) return;
  const command = message.slice(1);
  const player = event.sender;
  const guardian = getGuardian(player);
  if (command === "help") {
    say(player, messages.help);
  } else if (command === "status") {
    say(player, messages.status);
  } else if (command === "follow") {
    modes.set(player.id, "follow");
    say(player, messages.follow);
  } else if (command === "guard") {
    modes.set(player.id, "guard");
    say(player, messages.guard);
  } else if (command === "summon guardian") {
    const extraGuardian = player.dimension.spawnEntity(GUARDIAN, {
      x: player.location.x + 1.5,
      y: player.location.y,
      z: player.location.z + 1.5
    });
    extraGuardian.nameTag = "Guardian AI";
    say(player, "A second Guardian is ready to defend you.");
  } else if (command === "summon shadow") {
    player.dimension.spawnEntity(SHADOW, {
      x: player.location.x + 5,
      y: player.location.y,
      z: player.location.z + 5
    });
    say(player, messages.shadow);
  } else {
    say(player, messages.unknown);
  }
  event.cancel = true;
  guardian.nameTag = modes.get(player.id) === "guard" ? "Guardian AI [GUARDING]" : "Guardian AI";
}

world.afterEvents.playerSpawn.subscribe((event) => {
  if (event.initialSpawn) system.runTimeout(() => spawnGuardian(event.player), 30);
});

world.beforeEvents.chatSend.subscribe(handleChat);

world.afterEvents.entityHurt.subscribe((event) => {
  const victim = event.hurtEntity;
  if (!victim || victim.typeId !== "minecraft:player") return;
  const guardian = guardians.get(victim.id);
  const attacker = event.damageSource.damagingEntity;
  if (guardian?.isValid && attacker?.isValid && attacker.typeId === SHADOW) {
    attack(guardian, attacker, 7, `${guardian.id}:retaliate`);
  }
});

system.runInterval(() => {
  for (const player of world.getAllPlayers()) maintainGuardian(player);
  for (const dimension of [world.getDimension("overworld"), world.getDimension("nether"), world.getDimension("the_end")]) {
    for (const shadow of dimension.getEntities({ type: SHADOW })) {
      const targets = world.getAllPlayers().filter((player) => player.dimension.id === shadow.dimension.id);
      let target;
      let targetDistance = Infinity;
      for (const candidate of targets) {
        const distance = distanceSquared(shadow.location, candidate.location);
        if (distance < targetDistance && distance < 32 * 32) {
          target = candidate;
          targetDistance = distance;
        }
      }
      if (target) attack(shadow, target, 6, `${shadow.id}:player`);
    }
  }
}, 10);
