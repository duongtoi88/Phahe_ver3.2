// mother-nodes.js
// FINAL VERSION
// - KHÔNG vẽ nối mẹ–con
// - Mẹ chỉ nằm trong đoạn dọc thứ 1 (cha → junction)
// - Nhiều vợ, xếp gọn, không phá luồng con

function renderMotherNodes(g, nodes, peopleMap) {
  if (!window.rawRows) return;

  const mothers = [];

  nodes.forEach(d => {
    const fatherID = d.data.id;
    const fatherX = d.x;
    const fatherY = d.y;

    // Lấy tất cả vợ của người cha này
    const wives = window.rawRows.filter(r =>
      String(r["ID chồng"] || "").replace(".0", "") === fatherID
    );

    if (!wives.length) return;

    // Tọa độ đáy node cha
    const fatherBottomY = fatherY + 60;

    // JunctionY PHẢI trùng với junction trong app.js
    // (app.js đang dùng: fatherBottomY + 160)
    const junctionY = fatherBottomY + 160;

    // Chiều cao node mẹ
    const motherHeight = 120;

    // Khoảng không gian đoạn dọc thứ 1
    const trunkHeight = junctionY - fatherBottomY;

    // Vị trí trung tâm cho mẹ (nằm trọn trong đoạn dọc 1)
    const centerY = fatherBottomY + trunkHeight / 2;

    // Nếu nhiều vợ → xếp so le rất nhẹ theo X (KHÔNG chen luồng con)
    const offsetX = 90;

    wives.forEach((wife, index) => {
      const wifeID = String(wife.ID).replace(".0", "");
      const wifePerson = peopleMap[wifeID];
      if (!wifePerson) return;

      mothers.push({
        mother: wifePerson,
        x: fatherX + (index - (wives.length - 1) / 2) * offsetX,
        y: centerY
      });
    });
  });

  /* ====== VẼ NODE MẸ ====== */
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
}
