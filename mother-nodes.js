// =======================================
// mother-nodes.js
// MẸ XOAY DỌC – KHÔNG LINK
// - Giữ tree cha → con
// - Mẹ là node hiển thị độc lập
// - Hỗ trợ nhiều vợ
// =======================================

(function () {

  window.drawMotherNodes = drawMotherNodes;

  function drawMotherNodes() {
    if (!window.treeRoot || !window.treeGroup || !window.rawRows) {
      return;
    }

    const g = window.treeGroup;
    const rows = window.rawRows;

    // map raw rows theo ID
    const peopleById = {};
    rows.forEach(r => {
      const id = String(r.ID).replace('.0', '');
      peopleById[id] = r;
    });

    // map node tree theo ID
    const nodeById = {};
    window.treeRoot.descendants().forEach(d => {
      nodeById[d.data.id] = d;
    });

    // gom mẹ theo cha
    const motherMap = {};
    window.treeRoot.descendants().forEach(d => {
      const fatherId = d.data.id;
      const children = d.children || [];

      children.forEach(c => {
        const motherId = c.data.mother;
        if (!motherId) return;

        motherMap[fatherId] ??= new Set();
        motherMap[fatherId].add(motherId);
      });
    });

    // vẽ node mẹ (xoay dọc)
    Object.entries(motherMap).forEach(([fatherId, motherSet]) => {
      const fatherNode = nodeById[fatherId];
      if (!fatherNode) return;

      const motherIds = Array.from(motherSet);
      const spacingX = 110;
      const offsetY = 100;

      motherIds.forEach((motherId, index) => {
        const mother = peopleById[motherId];
        if (!mother) return;

        const x =
          fatherNode.x +
          (index - (motherIds.length - 1) / 2) * spacingX;
        const y = fatherNode.y + offsetY;

        // ===== NODE MẸ (XOAY DỌC) =====
        const mg = g.append("g")
          .attr("class", "node mother")
          .attr(
            "transform",
            `translate(${x},${y}) rotate(0)`
          );

        mg.append("rect")
          .attr("x", -25)
          .attr("y", -40)
          .attr("width", 80)
          .attr("height", 140)
          .attr("rx", 6)
          .attr("ry", 6);

        mg.append("text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .style("font-size", "12px")
          .text(mother["Họ và tên"] || "");
      });
    });
  }

})();
