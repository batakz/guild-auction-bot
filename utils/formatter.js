function groupSlots(slots) {
  const grouped = {};

  for (const slot of slots) {
    if (!grouped[slot.page]) {
      grouped[slot.page] = [];
    }

    grouped[slot.page].push(slot.slot);
  }

  return grouped;
}

function formatPageText(grouped) {
  let text = "";

  for (const [page, slots] of Object.entries(grouped)) {
    const sorted = slots.sort((a, b) => a - b);

    let slotText = "";

    if (sorted.length === 1) {
      slotText = sorted[0];
    } else {
      slotText = `${sorted[0]}-${sorted[sorted.length - 1]}`;
    }

    text += `Page ${page} nomor ${slotText}\n`;
  }

  return text;
}

function formatAllocation(results) {
  let output = "";

  results.forEach((result, index) => {
    output += `${index + 1}. ${result.member}\n\n`;

    const labels = {
      kartu: "Kartu Fragment",
      illusion: "Illusion Fragment",
      lnd: "Light & Dark",
      timespace: "Time Space",
    };

    for (const [itemName, slots] of Object.entries(result.items)) {
      if (slots.length === 0) continue;

      output += `Ambil ${slots.length} ${labels[itemName]} di:\n`;

      const grouped = groupSlots(slots);

      output += formatPageText(grouped);
      output += "\n";
    }

    output += "━━━━━━━━━━━━━━\n";
  });

  return output;
}

module.exports = formatAllocation;
