window.MotherNodes = (function () {

  function render(g, mothers) {

    const nodes = Object.values(mothers);

    const group = g.selectAll(".mother-node")
      .data(nodes, d => d.id);

    const enter = group.enter()
      .append("g")
      .attr("class", "mother-node")
      .attr("transform", d => `translate(${d.x},${d.y+5})`);

    enter.append("rect")
      .attr("x", -40)
      .attr("y", -50)
      .attr("width", 80)
      .attr("height", 100)
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

  return { render };

})();





