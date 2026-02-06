// mother-nodes.js
// Version: đúng luồng CHA → VỢ → CON

function renderMotherNodes(g, nodes, peopleMap) {
  if (!window.rawRows) return;

  const blocks = [];

  nodes.forEach(d => {
    const fatherID = d.data.id;
    const fatherX = d.x;
    const fatherY = d.y;

    // Lấy tất cả vợ của cha
    const wives = window.rawRows.filter(r =>
      String(r["ID chồng"] || "").replace(".0", "") === fatherID
    );

    wives.forEach((wife, wIndex) => {
      const wifeID = String(wife.ID).replace(".0", "");
      const wifePerson = peopleMap[wifeID];
      if (!wifePerson) return;

      // Lấy con của VỢ NÀY
      const children = window.rawRows.filter(r =>
        String(r["ID cha"] || "").replace(".0", "") === fatherID &&
        String(r["ID me"] || "").replace(".0", "") === wifeID
      );

      const fatherBottomY = fatherY + 60;
      const junctionY = fatherBottomY + 40 + wIndex * 180;

      blocks.push({
        wife: wifePerson,
        children,
        fatherX,
        fatherBottomY,
        junctionY
      });
    });
  });

  /* ====== VẼ VỢ ====== */
  const wifeNodes = g.selectAll(".wife-node")
    .data(blocks)
    .enter()
    .append("g")
    .attr("class", "wife-node")
    .attr("transform", d => `translate(${d.fatherX},${d.junctionY + 60})`)
    .on("click", (e, d) => openDetailTab(d.wife.id));

  wifeNodes.append("rect")
    .attr("x", -40)
    .attr("y", -60)
    .attr("width", 80)
    .attr("height", 120)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("class", "mother-rect");

  wifeNodes.append("text")
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text(d => d.wife.name);

  /* ====== CHA → VỢ ====== */
  g.selectAll(".link-father-wife")
    .data(blocks)
    .enter()
    .append("path")
    .attr("class", "link-father-wife")
    .attr("fill", "none")
    .attr("stroke", "#999")
    .attr("stroke-width", 2)
    .attr("d", d => `
      M ${d.fatherX},${d.fatherBottomY}
      V ${d.junctionY}
      V ${d.junctionY + 60}
    `);

  /* ====== VỢ → CON ====== */
  blocks.forEach(block => {
    const spacing = 100;
    const startX = block.fatherX - ((block.children.length - 1) * spacing) / 2;

    block.children.forEach((child, i) => {
      const childID = String(child.ID).replace(".0", "");
      const childNode = g.selectAll(".node")
        .filter(d => d.data.id === childID)
        .datum();

      if (!childNode) return;

      const childTopY = childNode.y - 60;
      const x = startX + i * spacing;

      g.append("path")
        .attr("class", "link-wife-child")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-width", 2)
        .attr("d", `
          M ${block.fatherX},${block.junctionY}
          H ${x}
          V ${childTopY}
        `);
    });
  });
}
