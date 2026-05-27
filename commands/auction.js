const generatePages = require("../utils/generatePages");

module.exports = {
  async execute(interaction) {
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
      .map((m) => m.trim())
      .filter(Boolean);

    const maxMembers = Math.min(
      limits.kartu > 0 ? Math.floor(items.kartu / limits.kartu) : Infinity,
      limits.illusion > 0
        ? Math.floor(items.illusion / limits.illusion)
        : Infinity,
      limits.lnd > 0 ? Math.floor(items.lnd / limits.lnd) : Infinity,
      limits.timespace > 0
        ? Math.floor(items.timespace / limits.timespace)
        : Infinity,
    );

    const selectedMembers = members.slice(0, maxMembers);

    const pages = generatePages(items);

    const allocation = allocateMembers(selectedMembers, limits, pages);

    const formatted = formatAllocation(allocation);

    const totalItems = Object.values(items).reduce((a, b) => a + b, 0);
    const totalPages = Math.ceil(totalItems / 4);

    const remain = {
      kartu: items.kartu - selectedMembers.length * limits.kartu,
      illusion: items.illusion - selectedMembers.length * limits.illusion,
      lnd: items.lnd - selectedMembers.length * limits.lnd,
      timespace: items.timespace - selectedMembers.length * limits.timespace,
    };

    const summary = `
Maksimal member full limit: ${maxMembers}

Total item: ${totalItems}
Total page: ${totalPages}

Sisa item:
Kartu: ${remain.kartu}
Illusion: ${remain.illusion}
LND: ${remain.lnd}
Time Space: ${remain.timespace}
`;

    await interaction.reply({
      content: `${summary}\n${formatted}`,
    });
  },
};
