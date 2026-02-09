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
	        y: father.y + d / 3
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
  function drawMotherLinks(g, mothers,d) {
    Object.values(mothers).forEach(m => {
      const f = m.father;

      // CHA → MẸ (1/3 d)
		g.append("path")
		  .attr("class", "link link-father-mother")
		  .attr("fill", "none")
		  .attr("stroke", "#555")
		  .attr("stroke-width", 2)
		  .attr("d", `
		    M ${f.x},${f.y + 60}
		    V ${m.y - 60}
		  `);

      // MẸ → CON (2/3 d)
    // ===== MẸ → CÁC CON (VẼ 1 TRỤC CHUNG) =====
		if (m.children.length > 0) {
		  const children = m.children;
		if (!Number.isFinite(d)) return;
		  const yBranch = m.y + (d * 2 / 3) / 2;
			const yBranchAdj = yBranch - 20;
		  const minX = Math.min(...children.map(c => c.x));
		  const maxX = Math.max(...children.map(c => c.x));

		  // 1️⃣ Trục dọc từ mẹ xuống đường ngang
		  g.append("path")
			.attr("class", "link link-mother-branch")
			.attr("fill", "none")
			.attr("stroke", "#555")
			.attr("stroke-width", 2)
			.attr("d", `
			  M ${m.x},${m.y + 60}
			  V ${yBranchAdj}
			`);

		  // 2️⃣ Đường ngang CHUNG nối các con
			// ===== MẸ → CON =====
			if (children.length === 1) {
			  // CHỈ 1 CON → KHÔNG VẼ ĐƯỜNG NGANG
			  const c = children[0];
			
			  g.append("path")
			    .attr("class", "link link-mother-single-child")
			    .attr("fill", "none")
			    .attr("stroke", "#555")
			    .attr("stroke-width", 2)
			    .attr("d", `
			      M ${m.x},${yBranchAdj}
			      V ${c.y - 60}
			    `);
			
			} else {
			  // NHIỀU CON → VẼ ĐƯỜNG NGANG CHUNG
			  const minX = Math.min(...children.map(c => c.x));
			  const maxX = Math.max(...children.map(c => c.x));
			
			  // Đường ngang
			  g.append("path")
			    .attr("class", "link link-children-horizontal")
			    .attr("fill", "none")
			    .attr("stroke", "#555")
			    .attr("stroke-width", 2)
			    .attr("d", `
			      M ${minX},${yBranchAdj}
			      H ${maxX}
			    `);
			
			  // Nhánh dọc xuống từng con
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








