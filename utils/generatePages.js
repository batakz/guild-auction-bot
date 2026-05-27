function generatePages(items) {
  const orderedItems = ["kartu", "illusion", "lnd", "timespace"];

  const slots = [];

  for (const itemName of orderedItems) {
    const qty = items[itemName] || 0;

    for (let i = 0; i < qty; i++) {
      slots.push(itemName);
    }
  }

  return slots.map((item, index) => {
    return {
      item,
      page: Math.floor(index / 4) + 1,
      slot: (index % 4) + 1,
      taken: false,
    };
  });
}

module.exports = generatePages;
