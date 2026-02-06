(function () {

  window.drawMotherNodes = function () {
    if (!window.treeRoot || !window.treeGroup || !window.rawRows) return;

    const g = window.treeGroup;

    // ===== layer riêng =====
    let layer = g.select("g.mother-layer");
    if (!layer.empty()) layer.remove();
    layer = g.append("g").attr("class", "mother-layer");

    // ===== map raw =====
    const people = {};
    window.rawRows.forEach(r => {
      people[String(r.ID)] = r;
    });

    // ===== map node =====
    const nodeById = {};
    window.treeRoot.descendants().forEach(d => {
      nodeById[d.data.id] = d;
    });

    // ===== gom mẹ theo cha =====
    const motherMap = {};
    window.treeRoot.descendants().forEach(d => {
      const fatherId = d.data.id;
      (d.children || []).forEach(c => {
        if (!c.data.mother) return;
        motherMap[fatherId] ??= new Set();
        motherMap[fatherId].add(c.data.mother);
      });
    });

    // ===== vẽ mẹ (ngoài vùng tree) =====
    const TREE_NODE_HEIGHT = 200;
    const offsetY = TREE_NODE_HEIGHT + 40;
    const spacingX = 120;

    Object.entries(motherMap).forEach(([fatherId, set]) => {
      const fatherNode = nodeById[fatherId];
      if (!fatherNode) return;

      const ids = Array.from(set);

      ids.forEach((mid, i) => {
        const m = people[mid];
        if (!m) return;

        const x =
          fatherNode.x +
          (i - (ids.length - 1) / 2) * spacingX;
        const y = fatherNode.y + offsetY;

        const mg = layer.append("g")
          .attr("class", "mother-node")
          .attr("transform", `translate(${x},${y}) rotate(90)`);

        mg.append("rect")
          .attr("x", -70)
          .attr("y", -22)
          .attr("width", 140)
          .attr("height", 44)
          .attr("rx", 6);

        mg.append("text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .text(m["Họ và tên"] || "");
      });
    });
  };

})();
