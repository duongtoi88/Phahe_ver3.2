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
    drawMotherLinks(g, mothers,d);
    drawMotherNodes(g, mothers);
  }

  // --------------------------------------------------
  // Thu thập mẹ + ép lại tầng (CHUẨN 1/3 – 2/3)
  // --------------------------------------------------
  function collectMothers(root, d) {
	  const map = {};
	  const allNodes = root.descendants();
	
	  allNodes.forEach(child => {
	    const motherID = child.data.mother;
	    const fatherID = child.data.father;
	    if (!motherID || !fatherID) return;
	
	    const father = allNodes.find(n => n.data.id === fatherID);
	    if (!father) return;
	
	    if (!map[motherID]) {
	      map[motherID] = {
	        id: motherID,
	        father,
	        children: [],
	        x: father.x,
	        y: father.y + d / 3   // MẸ ở 1/3 khoảng cha–con
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
		m.y += i * 5; // vợ sau thấp hơn vợ trước 5px
      });
    });
  }

  // --------------------------------------------------
  // Vẽ đường nối GẤP KHÚC – ĐÚNG TỌA ĐỘ THẬT
  // --------------------------------------------------
  function drawMotherLinks(g, mothers, d) {
	  Object.values(mothers).forEach(m => {
	    const f = m.father;
	
	    // ===== CHA → MẸ (LUÔN VẼ) =====
	    g.append("path")
	      .attr("class", "link link-father-mother")
	      .attr("fill", "none")
	      .attr("stroke", "#555")
	      .attr("stroke-width", 2)
	      .attr("d", `
	        M ${f.x},${f.y + 60}
	        V ${m.y - 60}
	      `);
	
	    // ⛔ KHÔNG CÓ CON → KHÔNG VẼ MẸ–CON
	    if (!m.children || m.children.length === 0) return;
	
	    const children = m.children;
	
	    // ===== TÍNH TRỤC CHUNG =====
	    const yBranch = m.y + (d * 2 / 3) / 2;
	    const yBranchAdj = yBranch - 10;
	
	    // luôn tính X dựa trên mẹ + con (kể cả 1 con)
	    const xs = [m.x, ...children.map(c => c.x)];
	    const minX = Math.min(...xs);
	    const maxX = Math.max(...xs);
	
	    // ===== 1️⃣ DỌC: MẸ → TRỤC =====
	    g.append("path")
	      .attr("class", "link link-mother-branch")
	      .attr("fill", "none")
	      .attr("stroke", "#555")
	      .attr("stroke-width", 2)
	      .attr("d", `
	        M ${m.x},${m.y + 60}
	        V ${yBranchAdj}
	      `);
	
	    // ===== 2️⃣ NGANG: TRỤC CHUNG =====
	    g.append("path")
	      .attr("class", "link link-children-horizontal")
	      .attr("fill", "none")
	      .attr("stroke", "#555")
	      .attr("stroke-width", 2)
	      .attr("d", `
	        M ${minX},${yBranchAdj}
	        H ${maxX}
	      `);
	
	    // ===== 3️⃣ DỌC: TRỤC → TỪNG CON =====
	    children.forEach(c => {
	      g.append("path")
	        .attr("class", "link link-child-vertical")
	        .attr("fill", "none")
	        .attr("stroke", "#555")
	        .attr("stroke-width", 2)
	        .attr("d", `
	          M ${c.x},${yBranchAdj}
	          V ${c.y - 60}
	        `);
	    });
	  });
	}
  // --------------------------------------------------
  // Vẽ node mẹ
  // --------------------------------------------------
  function drawMotherNodes(g, mothers) {
	  const nodes = Object.values(mothers);
	
	  const group = g.selectAll(".mother-node")
	    .data(nodes, d => d.id);
	
	  const enter = group.enter()
	    .append("g")
	    .attr("class", "mother-node")
	    .attr("transform", d => `translate(${d.x},${d.y})`);
	
	  enter.append("rect")
	    .attr("x", -40)
	    .attr("y", -30)
	    .attr("width", 80)
	    .attr("height", 60)
	    .attr("rx", 10)
	    .attr("ry", 10)
	    .attr("fill", "#ffe5e5")
	    .attr("stroke", "#ff6666");
	
	  enter.append("text")
	    .attr("text-anchor", "middle")
	    .attr("dominant-baseline", "middle")
	    .text(d => d.id);
	
	  group.exit().remove();
	}

  // --------------------------------------------------
  return {
    render
  };

})();






