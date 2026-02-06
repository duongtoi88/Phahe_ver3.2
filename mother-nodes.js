// =======================================
// mother-nodes.js
// CÁCH A1: CHA – (N MẸ) – HUB – CON
// - Tree gốc: CHA → CON (giữ nguyên)
// - Overlay: mỗi (CHA + MẸ) = 1 HUB
// - Hỗ trợ nhiều vợ, KHÔNG link ngang dài
// =======================================

(function () {

  // expose để app.js gọi sau mỗi drawTree()
  window.drawMotherNodes = drawMotherNodes;

  function drawMotherNodes() {
    if (!window.treeRoot || !window.treeGroup || !window.rawRows) {
      return;
    }

    const g = window.treeGroup;
    const rows = window.rawRows;

    // ===== MAP RAW ROWS THEO ID =====
    const peopleById = {};
    rows.forEach(r => {
      const id = String(r.ID).replace('.0', '');
      peopleById[id] = r;
    });

    // ===== MAP NODE TREE THEO ID =====
    const nodeById = {};
    window.treeRoot.descendants().forEach(d => {
      nodeById[d.data.id] = d;
    });

    // ===== GOM CON THEO (CHA → MẸ) =====
    // familyMap[fatherId][motherId] = [childNode, ...]
    const familyMap = {};

    window.treeRoot.descendants().forEach(d => {
      const fatherId = d.data.id;
      const children = d.children || [];

      children.forEach(c => {
        const motherId = c.data.mother;
        if (!motherId) return;

        familyMap[fatherId] ??= {};
        familyMap[fatherId][motherId] ??= [];
        familyMap[fatherId][motherId].push(c);
      });
    });

    // ===== VẼ CHA → (N MẸ) → HUB → CON =====
    Object.entries(familyMap).forEach(([fatherId, wives]) => {
      const fatherNode = nodeById[fatherId];
      if (!fatherNode) return;

      const wifeIds = Object.keys(wives);

      const spacingX = 120; // khoảng cách ngang giữa các mẹ
      const offsetMotherY = 90;  // mẹ dưới cha
      const offsetHubY = 120;    // hub dưới mẹ

      wifeIds.forEach((motherId, index) => {
        const mother = peopleById[motherId];
        if (!mother) return;

        // căn các mẹ quanh trục cha
        const x =
          fatherNode.x +
          (index - (wifeIds.length - 1) / 2) * spacingX;

        const motherY = fatherNode.y + offsetMotherY;
        const hubY = fatherNode.y + offsetHubY;

        // ===== NODE MẸ =====
        const mg = g.append("g")
          .attr("class", "node mother")
          .attr("transform", `translate(${x},${motherY})`);

        mg.append("rect")
          .attr("x", -40)
          .attr("y", -25)
          .attr("width", 80)
          .attr("height", 50)
          .attr("rx", 6)
          .attr("ry", 6)
          .attr("fill", "#ffe6ee")
          .attr("stroke", "#c2185b")
          .attr("stroke-width", 1.5);

        mg.append("text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .style("font-size", "12px")
          .text(mother["Họ và tên"] || "");

        // ===== LINK CHA → MẸ =====
        g.append("line")
          .attr("x1", fatherNode.x)
          .attr("y1", fatherNode.y + 60)
          .attr("x2", x)
          .attr("y2", motherY - 25)
          .attr("stroke", "#c2185b")
          .attr("stroke-width", 1.2);

        // ===== HUB (điểm nối) =====
        g.append("circle")
          .attr("cx", x)
          .attr("cy", hubY)
          .attr("r", 2.5)
          .attr("fill", "#c2185b");

        // ===== LINK MẸ → HUB =====
        g.append("line")
          .attr("x1", x)
          .attr("y1", motherY + 25)
          .attr("x2", x)
          .attr("y2", hubY)
          .attr("stroke", "#c2185b")
          .attr("stroke-width", 1.2);

        // ===== LINK HUB → CON =====
        wives[motherId].forEach(childNode => {
          g.append("path")
            .attr("fill", "none")
            .attr("stroke", "#c2185b")
            .attr("stroke-width", 1.2)
            .attr("d", () => {
              const x1 = x;
              const y1 = hubY;
              const x2 = childNode.x;
              const y2 = childNode.y;
              const midY = (y1 + y2) / 2;
              return `M ${x1},${y1} V ${midY} H ${x2} V ${y2}`;
            });
        });
      });
    });
  }

})();
