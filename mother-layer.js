/**
 * MotherLayer – FINAL CLEAN VERSION
 *
 * Quy ước:
 * - d = nodeHeight = khoảng cách CHA → CON
 * - Mẹ nằm tại 1/3 d
 * - Con nằm tại d (2/3 d dưới mẹ)
 * - Đường nối BẮT BUỘC gấp khúc
 * - Không phá tree, không sửa index/app
 */

window.MotherLayer = (function () {

  function render(root, g, d) {
    if (!root || !g || !d) return;

    const mothers = collectMothers(root, d);
    layoutMultipleWives(mothers);
    drawMotherLinks(g, mothers);
    drawMotherNodes(g, mothers);
  }

  // --------------------------------------------------
  // Thu thập mẹ + ép lại tầng (CHUẨN 1/3 – 2/3)
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
          y: father.y + d / 3   // MẸ = 1/3 d
        };
      }

      map[motherID].children.push(child);

      // ÉP CON XUỐNG ĐÚNG 2/3 d DƯỚI MẸ
      child.y = father.y + d;
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
  // Vẽ đường nối GẤP KHÚC – ĐÚNG TỌA ĐỘ THẬT
  // --------------------------------------------------
  function drawMotherLinks(g, mothers) {
    Object.values(mothers).forEach(m => {
      const f = m.father;

      // CHA → MẸ (1/3 d)
      g.append("path")
        .attr("class", "link link-father-mother")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-width", 2)
        .attr("d", `
          M ${f.x},${f.y}
          V ${m.y}
          H ${m.x}
        `);

      // MẸ → CON (2/3 d)
      m.children.forEach(c => {
        g.append("path")
          .attr("class", "link link-mother-child")
          .attr("fill", "none")
          .attr("stroke", "#555")
          .attr("stroke-width", 2)
          .attr("d", `
            M ${m.x},${m.y}
            V ${c.y}
            H ${c.x}
          `);
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
  return {
    render
  };

})();
