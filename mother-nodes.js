// mother-nodes.js
// FINAL LOGIC
// - Vẽ CHA → MẸ
// - Vẽ MẸ → CON (theo ID me)
// - KHÔNG vẽ CHA → CON (đã ẩn ở app.js)
// - KHÔNG phá d3.tree()

function renderMotherNodes(g, nodes, peopleMap) {
  if (!window.rawRows) return;

  const mothers = [];

  /* =========================================================
     1. THU THẬP DANH SÁCH MẸ (VỢ) THEO TỪNG CHA
     ========================================================= */
  nodes.forEach(d => {
    const fatherID = d.data.id;
    const fatherX = d.x;
    const fatherY = d.y;

    // Tọa độ đáy CHA
    const fatherBottomY = fatherY + 60;

    // Junction phải khớp app.js (CHA → CON)
    // app.js đang dùng: fatherBottomY + 160
    const junctionY = fatherBottomY + 160;

    // Lấy tất cả vợ của cha
    const wives = window.rawRows.filter(r =>
      String(r["ID chồng"] || "").replace(".0", "") === fatherID
    );

    if (!wives.length) return;

    // Nếu nhiều vợ → xếp dọc, KHÔNG lệch trục
    const spacingY = 140;
    const baseCenterY = fatherBottomY + (junctionY - fatherBottomY) / 2;

    wives.forEach((wife, index) => {
      const wifeID = String(wife.ID).replace(".0", "");
      const wifePerson = peopleMap[wifeID];
      if (!wifePerson) return;

      const centerY =
        baseCenterY + (index - (wives.length - 1) / 2) * spacingY;

      mothers.push({
        mother: wifePerson,
        motherID: wifeID,
        fatherX,
        fatherBottomY,
        x: fatherX,     // KHÓA TRỤC CHA
        y: centerY
      });
    });
  });

  /* =========================================================
     2. VẼ NODE MẸ
     ========================================================= */
  const motherNodes = g.selectAll(".mother-node")
    .data(mothers, d => d.mother.id)
    .enter()
    .append("g")
    .attr("class", "mother-node")
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .on("click", (e, d) => openDetailTab(d.mother.id));

  motherNodes.append("rect")
    .attr("x", -40)
    .attr("y", -60)
    .attr("width", 80)
    .attr("height", 120)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("class", "mother-rect");

  motherNodes.append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("font-size", "12px")
    .text(d => d.mother.name);

  /* =========================================================
     3. VẼ ĐƯỜNG CHA → Mẹ
     ========================================================= */
  g.selectAll(".link-father-mother")
    .data(mothers)
    .enter()
    .append("path")
    .attr("class", "link-father-mother")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-width", 2)
    .attr("d", d => `
      M ${d.fatherX},${d.fatherBottomY}
      V ${d.y - 60}
    `);

  /* =========================================================
     4. VẼ ĐƯỜNG MẸ → CON (THEO ID me)
     ========================================================= */
  mothers.forEach(m => {
    const children = window.rawRows.filter(r =>
      String(r["ID me"] || "").replace(".0", "") === m.motherID
    );

    if (!children.length) return;

    const spacing = 100;
    const startX =
      m.x - ((children.length - 1) * spacing) / 2;

    children.forEach((child, i) => {
      const childID = String(child.ID).replace(".0", "");

      // Lấy node con đã được d3.tree vẽ
      const childNode = g.selectAll(".node")
        .filter(d => d.data.id === childID)
        .datum();

      if (!childNode) return;

      const childTopY = childNode.y - 60;
      const x = startX + i * spacing;

      g.append("path")
        .attr("class", "link-mother-child")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-width", 2)
        .attr("d", `
          M ${m.x},${m.y + 60}
          H ${x}
          V ${childTopY}
        `);
    });
  });
}
