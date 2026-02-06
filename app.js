// =======================================
// PHẢ HỆ – BẢN CHUẨN
// - 1 node = 1 người
// - Có node MẸ (phụ, dưới bố 5px)
// - CON nối từ MẸ
// - GIỮ NGUYÊN D3 TREE GỐC
// =======================================

window.onload = () => {
  fetch("input.xlsx")
    .then(res => res.arrayBuffer())
    .then(buf => {
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const people = normalize(rows);
      const treeData = buildTreeByFather(people);

      drawTree(treeData, people);
    });
};

// ---------- NORMALIZE ----------
function normalize(rows) {
  return rows.map(r => ({
    id: String(r.ID).replace(".0", ""),
    name: r["Họ và tên"] || "",
    father: r["ID cha"] ? String(r["ID cha"]).replace(".0", "") : null,
    mother: r["ID mẹ"] ? String(r["ID mẹ"]).replace(".0", "") : null
  }));
}

// ---------- TREE: CHA → CON ----------
function buildTreeByFather(people) {
  const map = {};
  people.forEach(p => (map[p.id] = { ...p, children: [] }));

  let root = null;

  people.forEach(p => {
    if (p.father && map[p.father]) {
      map[p.father].children.push(map[p.id]);
    } else {
      root = map[p.id]; // thủy tổ
    }
  });

  return root;
}

// ---------- DRAW ----------
function drawTree(treeData, people) {
  d3.select("#tree-container").selectAll("svg").remove();

  const dx = 120;
  const dy = 120;

  const root = d3.hierarchy(treeData);
  const tree = d3.tree().nodeSize([dx, dy]);
  tree(root);

  const nodes = root.descendants();
  const links = root.links();

  const svg = d3.select("#tree-container")
    .append("svg")
    .attr("width", 3000)
    .attr("height", 2000);

  const g = svg.append("g")
    .attr("transform", "translate(200,100)");

  // ---------- LINK CHA → CON ----------
  g.selectAll(".link")
    .data(links)
    .enter()
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-width", 1.5)
    .attr("d", d3.linkVertical()
      .x(d => d.x)
      .y(d => d.y)
    );

  // ---------- NODE CHA / CON ----------
  const node = g.selectAll(".node")
    .data(nodes)
    .enter()
    .append("g")
    .attr("transform", d => `translate(${d.x},${d.y})`);

  node.append("rect")
    .attr("x", -50)
    .attr("y", -20)
    .attr("width", 100)
    .attr("height", 40)
    .attr("rx", 6)
    .attr("fill", "#ffffff")
    .attr("stroke", "#333");

  node.append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("font-size", "12px")
    .text(d => d.data.name);

  // ============================
  // VẼ NODE MẸ (NODE PHỤ)
  // ============================

  const motherMap = {};
  people.forEach(p => {
    if (p.mother) motherMap[p.id] = p.mother;
  });

  const nodeById = {};
  nodes.forEach(n => nodeById[n.data.id] = n);

  Object.keys(motherMap).forEach(childId => {
    const motherId = motherMap[childId];
    const childNode = nodeById[childId];
    const mother = people.find(p => p.id === motherId);

    if (!childNode || !mother) return;

    const mx = childNode.x;
    const my = childNode.y - 5; // 👈 dưới bố 5px

    // NODE MẸ
    const mg = g.append("g")
      .attr("transform", `translate(${mx},${my})`);

    mg.append("rect")
      .attr("x", -50)
      .attr("y", 25)
      .attr("width", 100)
      .attr("height", 40)
      .attr("rx", 6)
      .attr("fill", "#ffe6ee")
      .attr("stroke", "#c2185b");

    mg.append("text")
      .attr("y", 45)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("font-size", "12px")
      .text(mother.name);

    // LINK MẸ → CON
    g.append("line")
      .attr("x1", mx)
      .attr("y1", my + 65)
      .attr("x2", childNode.x)
      .attr("y2", childNode.y)
      .attr("stroke", "#c2185b")
      .attr("stroke-width", 1.2);
  });
}
