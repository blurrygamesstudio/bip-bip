/**
 * Bip Bip — Bot Discord généré par BotForge
 * Démarre avec : npm install && npm start
 */
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  EmbedBuilder,
  Events,
  REST,
  Routes,
} = require("discord.js");
const config = require("./config.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const commands = config.commands.filter((c) => c.enabled);
const automations = config.automations.filter((a) => a.enabled);
const cooldowns = new Map();

const slashCommands = commands.map((cmd) =>
  new SlashCommandBuilder()
    .setName(cmd.name)
    .setDescription(cmd.description || "Sans description")
    .toJSON()
);

client.once(Events.ClientReady, async (c) => {
  console.log(`✅ ${c.user.tag} est en ligne !`);
  if (config.bot.avatarUrl) {
    try {
      const res = await fetch(config.bot.avatarUrl);
      const buf = Buffer.from(await res.arrayBuffer());
      await c.user.setAvatar(buf);
      console.log("✅ Avatar mis à jour");
    } catch (e) {
      console.error("Erreur mise à jour avatar:", e.message);
    }
  }
  try {
    await new REST({ version: "10" })
      .setToken(process.env.DISCORD_TOKEN)
      .put(Routes.applicationCommands(c.user.id), { body: slashCommands });
    console.log(`✅ ${slashCommands.length} commande(s) slash enregistrée(s)`);
  } catch (err) {
    console.error("Erreur enregistrement commandes :", err);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = commands.find((c) => c.name === interaction.commandName);
  if (!cmd) return;

  const key = `${cmd.name}-${interaction.user.id}`;
  const now = Date.now();
  if (cooldowns.has(key) && now < cooldowns.get(key)) {
    const remaining = Math.ceil((cooldowns.get(key) - now) / 1000);
    await interaction.reply({ content: `⏳ Patiente ${remaining}s avant de réutiliser cette commande.`, ephemeral: true });
    return;
  }
  if (cmd.cooldown > 0) cooldowns.set(key, now + cmd.cooldown * 1000);

  if (cmd.responseType === "embed") {
    const embed = new EmbedBuilder()
      .setTitle(cmd.embedTitle || "")
      .setDescription(cmd.embedDescription || "")
      .setColor(cmd.embedColor);
    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: cmd.responseText || "Pas de réponse configurée." });
  }
});

async function handleAutomation(message, auto) {
  const text = auto.actionValue || "";
  if (auto.actionType === "reply") {
    await message.reply(text);
  } else if (auto.actionType === "send_message") {
    const ch = auto.targetChannel
      ? message.guild.channels.cache.get(auto.targetChannel)
      : message.channel;
    if (ch) await ch.send(text);
  } else if (auto.actionType === "add_role") {
    const role = message.guild.roles.cache.get(auto.actionValue);
    if (role) await message.member.roles.add(role);
  }
}

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  for (const auto of automations) {
    if (auto.triggerType === "keyword" && message.content === auto.triggerValue) {
      await handleAutomation(message, auto);
    } else if (auto.triggerType === "message_contains" && message.content.includes(auto.triggerValue)) {
      await handleAutomation(message, auto);
    }
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
  for (const auto of automations) {
    if (auto.triggerType === "member_join") {
      const ch = auto.targetChannel
        ? member.guild.channels.cache.get(auto.targetChannel)
        : member.guild.systemChannel;
      if (ch && (auto.actionType === "reply" || auto.actionType === "send_message")) {
        await ch.send(auto.actionValue.replace("{user}", member.toString()));
      } else if (auto.actionType === "add_role") {
        const role = member.guild.roles.cache.get(auto.actionValue);
        if (role) await member.roles.add(role);
      }
    }
  }
});

client.on(Events.GuildMemberRemove, async (member) => {
  for (const auto of automations) {
    if (auto.triggerType === "member_leave") {
      const ch = auto.targetChannel
        ? member.guild.channels.cache.get(auto.targetChannel)
        : member.guild.systemChannel;
      if (ch && (auto.actionType === "reply" || auto.actionType === "send_message")) {
        await ch.send(auto.actionValue.replace("{user}", member.user.tag));
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
