require("dotenv").config();

const { REST, Routes } = require("discord.js");

const {
  Client,
  GatewayIntentBits,
  Collection,
  SlashCommandBuilder,
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

const commands = [
  new SlashCommandBuilder()

    .setName("auction")
    .setDescription("Generate guild auction allocation")

    // ITEM GUILD AUCTION

    .addIntegerOption((option) =>
      option
        .setName("kartu")
        .setDescription("Jumlah kartu fragment")
        .setRequired(true),
    )

    .addIntegerOption((option) =>
      option
        .setName("illusion")
        .setDescription("Jumlah illusion fragment")
        .setRequired(true),
    )

    .addIntegerOption((option) =>
      option
        .setName("lnd")
        .setDescription("Jumlah light and dark")
        .setRequired(true),
    )

    .addIntegerOption((option) =>
      option
        .setName("timespace")
        .setDescription("Jumlah time space")
        .setRequired(true),
    )

    // LIMIT PER MEMBER

    .addIntegerOption((option) =>
      option
        .setName("limit_kartu")
        .setDescription("Limit kartu per member")
        .setRequired(true),
    )

    .addIntegerOption((option) =>
      option
        .setName("limit_illusion")
        .setDescription("Limit illusion per member")
        .setRequired(true),
    )

    .addIntegerOption((option) =>
      option
        .setName("limit_lnd")
        .setDescription("Limit LND per member")
        .setRequired(true),
    )

    .addIntegerOption((option) =>
      option
        .setName("limit_timespace")
        .setDescription("Limit Time Space per member")
        .setRequired(true),
    )

    // MEMBER LIST

    .addStringOption((option) =>
      option
        .setName("members")
        .setDescription("Pisahkan nama member dengan koma")
        .setRequired(true),
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });

    console.log("Slash command registered");
  } catch (error) {
    console.error(error);
  }
})();

client.once("clientReady", () => {
  console.log(`Bot online sebagai ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.commandName === "auction") {
    console.log("COMMAND START");

    await interaction.deferReply();

    const items = {
      kartu: interaction.options.getInteger("kartu"),
      illusion: interaction.options.getInteger("illusion"),
      lnd: interaction.options.getInteger("lnd"),
      timespace: interaction.options.getInteger("timespace"),
    };

    const limits = {
      kartu: interaction.options.getInteger("limit_kartu"),
      illusion: interaction.options.getInteger("limit_illusion"),
      lnd: interaction.options.getInteger("limit_lnd"),
      timespace: interaction.options.getInteger("limit_timespace"),
    };

    const members = interaction.options
      .getString("members")
      .split(",")
      .map((m) => m.trim());

    // =========================
    // HITUNG MAX MEMBER
    // =========================

    const calculations = [];

    for (const itemName of Object.keys(items)) {
      const itemQty = items[itemName];
      const limitQty = limits[itemName];

      // skip item kosong
      if (itemQty <= 0 || limitQty <= 0) {
        continue;
      }

      calculations.push(Math.floor(itemQty / limitQty));
    }

    const maxMembers = calculations.length > 0 ? Math.min(...calculations) : 0;

    const selectedMembers = members;

    // =========================
    // GENERATE PAGE SLOT
    // =========================
    console.log("GENERATE PAGES");

    const orderedItems = ["kartu", "illusion", "lnd", "timespace"];

    const allSlots = [];

    for (const itemName of orderedItems) {
      for (let i = 0; i < items[itemName]; i++) {
        allSlots.push(itemName);
      }
    }

    const pages = allSlots.map((item, index) => {
      return {
        item,
        page: Math.floor(index / 4) + 1,
        slot: (index % 4) + 1,
        taken: false,
      };
    });

    // =========================
    // ALLOCATION
    // =========================
    const remainingItems = {
      kartu: items.kartu,
      illusion: items.illusion,
      lnd: items.lnd,
      timespace: items.timespace,
    };

    const results = [];

    for (const member of selectedMembers) {
      const kartuLeft = pages.filter(
        (p) => p.item === "kartu" && !p.taken,
      ).length;

      if (kartuLeft < limits.kartu) {
        break;
      }
      const memberData = {
        member,
        items: {},
      };

      for (const [itemName, limit] of Object.entries(limits)) {
        const available = pages
          .filter((p) => p.item === itemName && !p.taken)
          .slice(0, limit);

        available.forEach((a) => {
          a.taken = true;
        });

        memberData.items[itemName] = available;
        remainingItems[itemName] -= available.length;
      }

      results.push(memberData);
    }

    // =========================
    // FORMAT OUTPUT
    // =========================
    console.log("FORMAT OUTPUT");

    const itemLabels = {
      kartu: "kartu fragment",
      illusion: "illusion fragment",
      lnd: "Light & Dark",
      timespace: "Time Space",
    };

    function groupPages(slots) {
      const grouped = {};

      for (const slot of slots) {
        if (!grouped[slot.page]) {
          grouped[slot.page] = [];
        }

        grouped[slot.page].push(slot.slot);
      }

      return grouped;
    }

    let output = "";

    results.forEach((result, index) => {
      output += `${index + 1}. ${result.member}\n`;

      for (const [itemName, slots] of Object.entries(result.items)) {
        if (slots.length === 0) continue;

        output += `Ambil ${slots.length} ${itemLabels[itemName]} di:\n`;

        const grouped = groupPages(slots);

        for (const [page, slotList] of Object.entries(grouped)) {
          const sorted = slotList.sort((a, b) => a - b);

          let slotText = "";

          if (sorted.length === 1) {
            slotText = `${sorted[0]}`;
          } else {
            slotText = `${sorted[0]}-${sorted[sorted.length - 1]}`;
          }

          output += `Page ${page} nomor ${slotText}\n`;
        }

        output += "\n";
      }

      output += "━━━━━━━━━━━━━━\n\n";
    });
    console.log("SEND MESSAGE");

    const messages = [];

    let currentMessage = "";

    results.forEach((result, index) => {
      let memberText = "";

      memberText += `${index + 1}. ${result.member}\n`;

      for (const [itemName, slots] of Object.entries(result.items)) {
        if (slots.length === 0) continue;

        memberText += `Ambil ${slots.length} ${itemLabels[itemName]} di:\n`;

        const grouped = groupPages(slots);

        for (const [page, slotList] of Object.entries(grouped)) {
          const sorted = slotList.sort((a, b) => a - b);

          let slotText = "";

          if (sorted.length === 1) {
            slotText = `${sorted[0]}`;
          } else {
            slotText = `${sorted[0]}-${sorted[sorted.length - 1]}`;
          }

          memberText += `Page ${page} nomor ${slotText}\n`;
        }

        memberText += "\n";
      }

      memberText += "━━━━━━━━━━━━━━\n\n";

      // split message discord limit
      if ((currentMessage + memberText).length > 1900) {
        messages.push(currentMessage);

        currentMessage = memberText;
      } else {
        currentMessage += memberText;
      }
    });

    // push terakhir
    if (currentMessage.length > 0) {
      messages.push(currentMessage);
    }

    // =========================
    // SUMMARY SISA ITEM
    // =========================

    let summary = "\n📦 Sisa Item Guild Auction:\n";

    summary += `🃏 Kartu Fragment: ${remainingItems.kartu}\n`;
    summary += `🎴 Illusion Fragment: ${remainingItems.illusion}\n`;
    summary += `🕊️ Light & Dark: ${remainingItems.lnd}\n`;
    summary += `🐦 Time Space: ${remainingItems.timespace}\n`;

    messages.push(summary);

    // =========================
    // SEND MESSAGE
    // =========================

    console.log("SEND MESSAGE");

    await interaction.editReply(messages[0]);

    for (let i = 1; i < messages.length; i++) {
      await interaction.followUp(messages[i]);
    }
  }
});

client.login(process.env.TOKEN);
