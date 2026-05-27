function allocateMembers(members, limits, pages) {
  const results = [];

  for (const member of members) {
    const allocation = {
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

      allocation.items[itemName] = available;
    }

    results.push(allocation);
  }

  return results;
}

module.exports = allocateMembers;
