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

function renderMotherNodes(g, nodes, peopleMap) {
  const motherData = [];

    nodes.forEach(d => {
      const motherID = d.data.mother;
      if (!motherID) return;
  
      const mother = peopleMap[motherID];
      if (!mother) return;
  
      motherData.push({
        mother,
        x: d.x + 120,   // lệch phải so với cha
        y: d.y
      });
    });
  
    const mg = g.selectAll(".mother-node")
      .data(motherData, d => d.mother.id)
      .enter()
      .append("g")
      .attr("class", "mother-node")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .on("click", (e, d) => openDetailTab(d.mother.id));
  
    mg.append("rect")
      .attr("x", -40)
      .attr("y", -60)
      .attr("width", 80)
      .attr("height", 120)
      .attr("rx", 10)
      .attr("ry", 10)
      .attr("class", "mother-rect");
  
    mg.append("text")
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .text(d => d.mother.name);
  }


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


