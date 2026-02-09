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
  // mother-layer v1.3.6 – MATCH EXCEL
	function collectMothers(root, d) {
	  const map = {};
	  const allNodes = root.descendants();
	
	  allNodes.forEach(child => {
	    const motherID = child.data["ID me"];
	    const fatherID = child.data["ID cha"];
	    if (!motherID || !fatherID) return;
	
	    // tìm cha theo ID cha
	    const father = allNodes.find(n => n.data.ID === fatherID);
	    if (!father) return;
	
	    // tìm mẹ theo ID me (để lấy TÊN)
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
  // mother-layer v1.3.2
function drawMotherLinks(g, mothers, d) {
  const NODE_HALF_H = 15; // 👈 nửa chiều cao node (phải khớp UI)

  Object.values(mothers).forEach(m => {
    const f = m.father;

    /* ========= CHA → MẸ (1/3 d) ========= */
// mother-layer v1.3.3
	const fatherBottomY = f.y + NODE_HALF_H;
	const motherTopY   = m.y - NODE_HALF_H;
	const midY = fatherBottomY + (motherTopY - fatherBottomY) / 2;
	
	g.append("path")
	  .attr("class", "link link-father-mother")
	  .attr("fill", "none")
	  .attr("stroke", "#555")
	  .attr("stroke-width", 2)
	  .attr("d", `
	    M ${f.x},${fatherBottomY}
	    V ${midY}
	    H ${m.x}
	    V ${motherTopY}
	  `);


    /* ======= KHÔNG CÓ CON → DỪNG ======= */
    if (!m.children || m.children.length === 0) return;

    const children = m.children;

    /* ========= TRỤC CHUNG (2/3 d) ========= */
    const yBranch = m.y + (d * 2 / 3) / 2;
    const yJoint = yBranch; // 👈 DÙNG 1 MỐC DUY NHẤT, KHÔNG TRỪ LỆCH

    const xs = [m.x, ...children.map(c => c.x)];
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);

    /* ========= MẸ → TRỤC ========= */
    g.append("path")
      .attr("class", "link link-mother-branch")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-width", 2)
      .attr("d", `
        M ${m.x},${m.y + NODE_HALF_H}
        V ${yJoint}
      `);

    /* ========= TRỤC NGANG ========= */
    g.append("path")
      .attr("class", "link link-children-horizontal")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-width", 2)
      .attr("d", `
        M ${minX},${yJoint}
        H ${maxX}
      `);

    /* ========= TRỤC → CON ========= */
    children.forEach(c => {
      g.append("path")
        .attr("class", "link link-child-vertical")
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
		  .text(d => d.name);
	
	  group.exit().remove();
	}

  // --------------------------------------------------
  return {
    render
  };

})();










