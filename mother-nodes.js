// =======================================
// mother-nodes.js
// VẼ NODE MẸ (OVERLAY)
// - Giữ nguyên tree cha → con
// - Hỗ trợ 1 cha – N vợ
// - Con nối từ ĐÚNG mẹ
// =======================================

(function () {

  // expose để app.js gọi lại sau mỗi drawTree()
  window.drawMotherNodes = drawMotherNodes;

  function drawMotherNodes() {
    // kiểm tra dependency
    if (!window.treeRoot || !window.treeGroup || !window.rawRows) {
      console.warn("Mother nodes: missing dependency");
      return;
    }

    const g = window.treeGroup;
    const rows = window.rawRows;

    // ==============================
    // MAP RAW ROWS THEO ID (CHUẨN)
    // ==============================
    const peopleById = {};
    rows.forEach(r => {
      const id = String(r.ID).replace('.0', '');
      peopleById[id] = r;
    });

    // ==============================
    // MAP NODE TREE THEO ID
    // ==============================
    const nodeById = {};
    window.treeRoot.descendants().forEach(d => {
      nodeById[d.data.id] = d;
    });

    // ==============================
    // GOM CON THEO (CHA → MẸ)
    // familyMap[fatherId][motherId] = [childNode, ...]
    // ==============================
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

    // ==============================
    // VẼ NODE MẸ (XẾP NGANG)
    // ==============================
    Object.entries(familyMap).forEach(([fatherId, wives]) => {
      const fatherNode = nodeById[fatherId];
      if (!fatherNode) return;

      const wifeIds = Object.keys(wives);
      const spacingX = 100;   // khoảng cách ngang giữa các vợ
      const offsetY = 140;    // khoảng cách dọc so với cha

      wifeIds.forEach((motherId, index) => {
        const mother = peopleById[motherId];
        if (!mother) return;

        // căn giữa nhiều vợ
        const x =
          fatherNode.x +
          (index - (wifeIds.length - 1) / 2) * spacingX;
        const y = fatherNode.y + offsetY;

        // ===== NODE MẸ =====
        const mg = g.append("g")
          .attr("class", "node mother")
          .attr("transform", `translate(${x},${y})`);

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

        // ===== LINK MẸ → CON =====
        wives[motherId].forEach(childNode => {
          g.append("path")
            .attr("fill", "none")
            .attr("stroke", "#c2185b")
            .attr("stroke-width", 1.2)
            .attr("d", () => {
              const x1 = x;
              const y1 = y - 25;
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
