// ======================================================
// mother-layer.js
// Version: 1.1.0-stable-multi-wife
// ======================================================

const MotherLayer = (() => {

  // =========================
  // CONFIG
  // =========================
  const NODE_WIDTH  = 80;
  const NODE_HEIGHT = 60;
  const NODE_HALF_H = NODE_HEIGHT / 2;

  // =========================
  // MAIN ENTRY
  // =========================
  function render(root, g, d) {
    const mothers = collectMothers(root, d);
    console.log("MOTHERS:", mothers); // 👈 LOG ĐÚNG CHỖ
    layoutMultipleWives(mothers);     // 👈 nhiều vợ (GIỮ LOGIC CŨ)
    drawMotherLinks(g, mothers, d);
    drawMotherNodes(g, mothers);
  }

  // =========================
  // COLLECT MOTHERS (MATCH EXCEL)
  // =========================
  function collectMothers(root, d) {
    const map = {};
    const allNodes = root.descendants();
  
    allNodes.forEach(child => {
      const fatherID = child.data["ID cha"];
      if (!fatherID) return;
  
      const father = allNodes.find(n => n.data.ID === fatherID);
      if (!father) return;
  
      const motherID = child.data["ID me"];
      if (!motherID) return; // chỉ không tạo mẹ, KHÔNG bỏ con
  
      const motherNode = allNodes.find(n => n.data.ID === motherID);
  
      if (!map[motherID]) {
        map[motherID] = {
          id: motherID,
          name: motherNode ? motherNode.data["Họ và tên"] : String(motherID),
          father,
          children: [],
          x: father.x,
          y: father.y + d / 3
        };
      }
  
      map[motherID].children.push(child);
    });
  
    return map;
  }

  // =========================
  // MULTI-WIFE LAYOUT (GIỮ TINH THẦN CODE CŨ)
  // =========================
  function layoutMultipleWives(mothers) {
    const byFather = {};

    Object.values(mothers).forEach(m => {
      const fid = m.father.data.ID;
      if (!byFather[fid]) byFather[fid] = [];
      byFather[fid].push(m);
    });

    Object.values(byFather).forEach(wives => {
      if (wives.length <= 1) return;

      const spacing = 120;
      const baseX = wives[0].father.x;

      wives.forEach((m, i) => {
        m.x = baseX + (i - (wives.length - 1) / 2) * spacing;
        // ❌ KHÔNG sửa m.y (tránh loạn đường)
      });
    });
  }

  // =========================
  // DRAW LINKS
  // =========================
  function drawMotherLinks(g, mothers, d) {
    Object.values(mothers).forEach(m => {
      const f = m.father;

      // ===== CHA → MẸ (GẤP KHÚC) =====
      const fatherBottomY = f.y + NODE_HALF_H;
      const motherTopY   = m.y - NODE_HALF_H;
      const midY = fatherBottomY + (motherTopY - fatherBottomY) / 2;

      g.append("path")
        .attr("class", "link father-mother")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-width", 2)
        .attr("d", `
          M ${f.x},${fatherBottomY}
          V ${midY}
          H ${m.x}
          V ${motherTopY}
        `);

      // ===== KHÔNG CÓ CON =====
      if (!m.children || m.children.length === 0) return;

      const children = m.children;

      // ===== TRỤC CHUNG =====
      const yJoint = m.y + d / 3;

      const xs = [m.x, ...children.map(c => c.x)];
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);

      // ===== MẸ → TRỤC =====
      g.append("path")
        .attr("class", "link mother-branch")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-width", 2)
        .attr("d", `
          M ${m.x},${m.y + NODE_HALF_H}
          V ${yJoint}
        `);

      // ===== TRỤC NGANG =====
      g.append("path")
        .attr("class", "link children-horizontal")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-width", 2)
        .attr("d", `
          M ${minX},${yJoint}
          H ${maxX}
        `);

      // ===== TRỤC → CON =====
      children.forEach(c => {
        g.append("path")
          .attr("class", "link child-vertical")
          .attr("fill", "none")
          .attr("stroke", "#555")
          .attr("stroke-width", 2)
          .attr("d", `
            M ${c.x},${yJoint}
            V ${c.y - NODE_HALF_H}
          `);
      });
    });
  }

  // =========================
  // DRAW MOTHER NODES
  // =========================
  function drawMotherNodes(g, mothers) {
    const data = Object.values(mothers);

    const sel = g.selectAll(".mother-node")
      .data(data, d => d.id);

    const enter = sel.enter()
      .append("g")
      .attr("class", "mother-node")
      .attr("transform", d => `translate(${d.x},${d.y})`);

    enter.append("rect")
      .attr("x", -NODE_WIDTH / 2)
      .attr("y", -NODE_HEIGHT / 2)
      .attr("width", NODE_WIDTH)
      .attr("height", NODE_HEIGHT)
      .attr("rx", 10)
      .attr("ry", 10)
      .attr("fill", "#ffeaea")
      .attr("stroke", "#ff6666");

    enter.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", 12)
      .text(d => d.name || d.id);

    sel.exit().remove();
  }

  // =========================
  // EXPORT
  // =========================
  return {
    render
  };

})();


