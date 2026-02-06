/**
 * MotherLayer module
 * - Không sửa tree layout
 * - Không sửa hierarchy
 * - Chỉ vẽ node mẹ + đường nối cha–mẹ–con
 * - Dùng nodeHeight làm d (khoảng cách cha–con)
 */

window.MotherLayer = (function () {

  function render(root, g, d) {
    if (!root || !g || !d) return;

    const mothers = collectMothers(root, d);
    layoutMultipleWives(mothers);
    drawMotherNodes(g, mothers);
    drawMotherLinks(g, mothers, d);
  }

  // --------------------------------------------------
  // Thu thập mẹ + gán vị trí cơ bản
  // --------------------------------------------------
  function collectMothers(root, d) {
    const map = {};

    root.descendants().forEach(child => {
      const motherID = child.data.mother;
      if (!motherID) return;

      const father = child.parent;
      if (!father) return;

      if (!map[motherID]) {
        map[motherID] = {
          id: motherID,
          father,
          children: [],
          x: father.x,
          y: father.y + d / 3   // mẹ nằm tại 1/3 d
        };
      }

      map[motherID].children.push(child);
    });

    return map;
  }

  // --------------------------------------------------
  // Nhiều vợ → cùng 1 hàng ngang
  // --------------------------------------------------
  function layoutMultipleWives(mothers) {
    const byFather = {};

    Object.values(mothers).forEach(m => {
      const fid = m.father.data.id;
      if (!byFather[fid]) byFather[fid] = [];
      byFather[fid].push(m);
    });

    Object.values(byFather).forEach(wives => {
      if (wives.length <= 1) return;

      const spacing = 120;
      wives.forEach((m, i) => {
        m.x = m.father.x + (i - (wives.length - 1) / 2) * spacing;
      });
    });
  }

  // --------------------------------------------------
  // Vẽ node mẹ
  // --------------------------------------------------
  function drawMotherNodes(g, mothers) {
    const data = Object.values(mothers);

    const nodes = g.selectAll(".node-mother")
      .data(data, d => d.id)
      .enter()
      .append("g")
      .attr("class", "node node-mother")
      .attr("transform", m => `translate(${m.x},${m.y})`);

    nodes.append("rect")
      .attr("x", -35)
      .attr("y", -45)
      .attr("width", 70)
      .attr("height", 90)
      .attr("rx", 10)
      .attr("ry", 10)
      .attr("fill", "#ffe0e6")
      .attr("stroke", "#d66");

    nodes.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "11px")
      .text(m => {
        if (!window.rawRows) return "";
        const p = window.rawRows.find(r =>
          String(r.ID).replace(".0", "") === m.id
        );
        return p ? p["Họ và tên"] : "";
      });
  }

  // --------------------------------------------------
  // Vẽ đường nối gấp khúc:
  // - Cha → Mẹ : 1/3 d
  // - Mẹ → Con : 2/3 d
  // --------------------------------------------------
  function drawMotherLinks(g, mothers, d) {
    Object.values(mothers).forEach(m => {
      const f = m.father;

      // Cha → Mẹ (1/3 d)
      g.append("path")
        .attr("class", "link link-father-mother")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-width", 2)
        .attr("d", `
          M ${f.x},${f.y}
          V ${f.y + d / 6}
          H ${m.x}
          V ${m.y}
        `);

      // Mẹ → Con (2/3 d)
      m.children.forEach(c => {
        g.append("path")
          .attr("class", "link link-mother-child")
          .attr("fill", "none")
          .attr("stroke", "#555")
          .attr("stroke-width", 2)
          .attr("d", `
            M ${m.x},${m.y}
            V ${m.y + d / 3}
            H ${c.x}
            V ${c.y}
          `);
      });
    });
  }

  // --------------------------------------------------
  return {
    render
  };

})();
