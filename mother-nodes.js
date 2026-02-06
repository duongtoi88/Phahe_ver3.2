// =======================================
// mother-nodes.js
// VẼ NODE MẸ – KHÔNG ẢNH HƯỞNG TREE
// =======================================

(function () {
  // chờ app.js vẽ xong
  setTimeout(drawMotherNodes, 300);

  function drawMotherNodes() {
    if (!window.treeRoot || !window.treeGroup || !window.rawPeople) {
      console.warn("Mother nodes: missing dependency");
      return;
    }

    const g = window.treeGroup;
    const people = window.rawPeople;

    // map dữ liệu theo ID
    const peopleById = {};
    people.forEach(p => (peopleById[p.id] = p));

    // map node tree theo ID
    const nodeById = {};
    window.treeRoot.descendants().forEach(d => {
      nodeById[d.data.id] = d;
    });

    // vẽ node mẹ cho từng node con
    Object.values(nodeById).forEach(d => {
      const motherId = d.data.mother;
      if (!motherId) return;

      const mother = peopleById[motherId];
      if (!mother) return;

      const x = d.x;
      const y = d.y + 90; // 👈 dưới node bố ~5–10px (tùy chiều cao node)

      const mg = g.append("g")
        .attr("class", "node mother")
        .attr("transform", `translate(${x},${y})`);

      // rect mẹ
      mg.append("rect")
        .attr("x", -40)
        .attr("y", -25)
        .attr("width", 80)
        .attr("height", 40)
        .attr("rx", 6)
        .attr("ry", 6)
        .attr("fill", "#ffe6ee")
        .attr("stroke", "#c2185b");

      // text mẹ
      mg.append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("font-size", "12px")
        .text(mother.name || "");

      // link mẹ → con
      g.append("line")
        .attr("x1", x)
        .attr("y1", y - 25)
        .attr("x2", d.x)
        .attr("y2", d.y)
        .attr("stroke", "#c2185b")
        .attr("stroke-width", 1.2);
    });
  }
})();
