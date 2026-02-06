// mother-nodes.js
// Ver 3.3.1 – Multiple wives in ONE ROW (below father)

function renderMotherNodes(g, nodes, peopleMap) {
  if (!window.rawRows) return;

  const motherData = [];

  nodes.forEach(d => {
    const fatherID = d.data.id;

    // Lấy tất cả vợ của cha này
    const wives = window.rawRows.filter(r => {
      const idChong = r["ID chồng"]
        ? String(r["ID chồng"]).replace(".0", "")
        : null;
      return idChong === fatherID;
    });

    if (!wives.length) return;

    const wifeCount = wives.length;
    const spacing = 100; // khoảng cách giữa các vợ
    const startX = d.x - ((wifeCount - 1) * spacing) / 2;

    wives.forEach((wife, index) => {
      const wifeID = String(wife.ID).replace(".0", "");
      const wifePerson = peopleMap[wifeID];
      if (!wifePerson) return;

      motherData.push({
        mother: wifePerson,
        x: startX + index * spacing,
        y: d.y + 150,   // DƯỚI CHA
        fatherX: d.x,
        fatherY: d.y
      });
    });
  });

  /* ===== NODE VỢ ===== */
  const mg = g.selectAll(".mother-node")
    .data(motherData, d => d.mother.id)
    .enter()
    .append("g")
    .attr("class", "mother-node")
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .on("click", (e, d) => openDetailTab(d.mother.id));

  mg.append("rect")
    .attr("x", -40)
    .attr("y", -60)
    .attr("width", 80)
    .attr("height", 120)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("class", "mother-rect");

  mg.append("text")
    .attr("text-anchor", "middle")
    .attr("fill", "black")
    .style("font-size", "12px")
    .text(d => d.mother.name);

  /* ===== ĐƯỜNG NỐI CHA → VỢ ===== */
  g.selectAll(".link-wife")
    .data(motherData)
    .enter()
    .append("path")
    .attr("class", "link-wife")
    .attr("fill", "none")
    .attr("stroke", "#999")
    .attr("stroke-width", 2)
    .attr("d", d => {
      const x1 = d.fatherX;
      const y1 = d.fatherY + 60;   // đáy cha
      const x2 = d.x;
      const y2 = d.y - 60;         // đỉnh vợ
      const midY = (y1 + y2) / 2;

      return `
        M ${x1},${y1}
        V ${midY}
        H ${x2}
        V ${y2}
      `;
    });
}
