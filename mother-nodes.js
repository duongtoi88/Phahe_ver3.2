const {
  GAP_FATHER_MOTHER,
  MOTHER_HEIGHT,
  GAP_MC_TOP,
  GAP_MC_BOTTOM
} = window.LayoutConfig;

function renderMotherNodes(g, nodes, peopleMap) {
  if (!window.rawRows) return;

  /* ===== CONFIG THEO YÊU CẦU ===== */
  const GAP_FATHER_MOTHER = 20;   // Cha → mẹ
  const MOTHER_HEIGHT = 160;      // Chiều cao node mẹ
  const GAP_MC_TOP = 20;          // Mẹ → con (đoạn dọc 1)
  const GAP_MC_BOTTOM = 100;      // Mẹ → con (đoạn dọc 2)
  const CHILD_HALF = 60;

  const mothers = [];

  /* ===== 1. THU THẬP VỢ ===== */
  nodes.forEach(d => {
    const fatherID = d.data.id;
    const fatherX = d.x;
    const fatherY = d.y;

    const fatherBottomY = fatherY + 60;

    // Cao độ HÀNG VỢ (CHUNG)
    const motherTopY = fatherBottomY + GAP_FATHER_MOTHER;
    const motherCenterY = motherTopY + MOTHER_HEIGHT / 2;

    // Lấy danh sách vợ
    const wives = window.rawRows.filter(r =>
      String(r["ID chồng"] || "").replace(".0", "") === fatherID
    );

    if (!wives.length) return;

    const spacingX = 120;
    const startX =
      fatherX - ((wives.length - 1) * spacingX) / 2;

    wives.forEach((wife, i) => {
      const wifeID = String(wife.ID).replace(".0", "");
      const wifePerson = peopleMap[wifeID];
      if (!wifePerson) return;

      mothers.push({
        mother: wifePerson,
        motherID: wifeID,

        x: startX + i * spacingX,
        y: motherCenterY,

        motherBottomY: motherTopY + MOTHER_HEIGHT
      });
    });
  });

  /* ===== 2. VẼ NODE MẸ ===== */
  const motherNodes = g.selectAll(".mother-node")
    .data(mothers, d => d.mother.id)
    .enter()
    .append("g")
    .attr("class", "mother-node")
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .on("click", (e, d) => openDetailTab(d.mother.id));

  motherNodes.append("rect")
    .attr("x", -40)
    .attr("y", -MOTHER_HEIGHT / 2)
    .attr("width", 80)
    .attr("height", MOTHER_HEIGHT)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("class", "mother-rect");

  motherNodes.append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("font-size", "12px")
    .text(d => d.mother.name);

  /* ===== 3. VẼ MẸ → CON ===== */
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

		let childNode = null;

		g.selectAll(".node").each(function(d) {
		  if (String(d.data.id) === String(childID)) {
			childNode = d;
		  }
		});

		if (!childNode) return;

      const childTopY = childNode.y - CHILD_HALF;
      const x = startX + i * spacing;

      g.append("path")
        .attr("class", "link-mother-child")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-width", 2)
        .attr("d", `
          M ${m.x},${m.motherBottomY}
          V ${m.motherBottomY + GAP_MC_TOP}
          H ${x}
          V ${childTopY}
        `);
    });
  });
}
