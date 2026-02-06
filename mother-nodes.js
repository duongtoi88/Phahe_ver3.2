// mother-nodes.js
// Version 3.2 – Render mother nodes (không ảnh hưởng tree chính)

/**
 * Vẽ node me cạnh node CHA
 * @param {d3.Selection} g - group SVG gốc
 * @param {Array} nodes - root.descendants()
 * @param {Object} peopleMap - map people từ app.js
 */
function renderMotherNodes(g, nodes, peopleMap) {
  const motherData = [];

  nodes.forEach(d => {
    const motherID = d.data.mother;
    if (motherID && peopleMap[motherID]) {
      motherData.push({
        mother: peopleMap[motherID],
        x: d.x,     // lệch ngang so với cha
        y: d.y+20
      });
    }
  });

  const motherGroup = g.selectAll(".mother-node")
    .data(motherData)
    .enter()
    .append("g")
    .attr("class", "mother-node")
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .on("click", (e, d) => openDetailTab(d.mother.id));

  motherGroup.append("rect")
    .attr("x", -35)
    .attr("y", -50)
    .attr("width", 70)
    .attr("height", 100)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("class", "mother-rect");

  motherGroup.append("text")
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .text(d => d.mother.name);
}

