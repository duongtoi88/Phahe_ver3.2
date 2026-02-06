// =======================================
// PHẢ HỆ – FAMILY NODE [CHA | MẸ]
// - Node dựng dọc
// - Cha (dọc) bên trái | Mẹ (dọc) bên phải
// - Ép khoảng cách theo đời (KHÔNG đè)
// D3 v7
// =======================================

// ---------- LOAD EXCEL ----------
window.onload = () => {
  fetch("input.xlsx")
    .then(res => res.arrayBuffer())
    .then(buf => {
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const people = normalizeRows(rows);
      const families = buildFamilyNodes(people);
      const treeData = buildTree(families);

      drawTree(treeData);
    })
    .catch(err => console.error("Excel load error:", err));
};

// ---------- NORMALIZE ----------
function normalizeRows(rows) {
  return rows.map(r => ({
    id: String(r.ID).replace(".0", ""),
    name: r["Họ và tên"] || "",
    father: r["ID cha"] ? String(r["ID cha"]).replace(".0", "") : null,
    mother: r["ID mẹ"] ? String(r["ID mẹ"]).replace(".0", "") : null
  }));
}

// ---------- BUILD FAMILY ----------
function buildFamilyNodes(people) {
  const map = {};
  const list = [];

  people.forEach(p => {
    if (!p.father || !p.mother) return;

    const fid = `F_${p.father}_${p.mother}`;
    if (!map[fid]) {
      const father = people.find(x => x.id === p.father);
      const mother = people.find(x => x.id === p.mother);

      map[fid] = {
        id: fid,
        type: "family",
        fatherName: father?.name || "Cha ?",
        motherName: mother?.name || "Mẹ ?",
        children: []
      };
      list.push(map[fid]);
    }

    map[fid].children.push({
      id: p.id,
      type: "child",
      name: p.name
    });
  });

  return list;
}

// ---------- BUILD TREE ----------
function buildTree(families) {
  return {
    id: "ROOT",
    type: "root",
    children: families
  };
}

// ---------- DRAW ----------
function drawTree(treeData) {
  d3.select("#tree-container").selectAll("svg").remove();

  const NODE_X = 90;      // khoảng cách ngang
  const LEVEL_Y = 240;   // khoảng cách giữa các đời (QUAN TRỌNG)

  const root = d3.hierarchy(treeData, d => {
    if (d.type === "root") return d.children;
    if (d.type === "family") return d.children;
    return null;
  });

  const treeLayout = d3.tree().nodeSize([NODE_X, LEVEL_Y]);
  treeLayout(root);

  // 👉 ÉP Y THEO ĐỜI (KHÔNG ĐÈ NODE)
  root.descendants().forEach(d => {
    d.y = d.depth * LEVEL_Y;
  });

  const nodes = root.descendants().filter(d => d.data.type !== "root");
  const links = root.links();

  const minX = d3.min(nodes, d => d.x);
  const maxX = d3.max(nodes, d => d.x);
  const minY = d3.min(nodes, d => d.y);
  const maxY = d3.max(nodes, d => d.y);

  const width = maxX - minX + 300;
  const height = maxY - minY + 300;

  const svg = d3.select("#tree-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g")
    .attr("transform", `translate(${150 - minX},${150 - minY})`);

  // ---------- LINKS ----------
  g.selectAll(".link")
    .data(links)
    .enter()
    .append("path")
    .attr("class", "link")
    .attr("fill", "none")
    .attr("stroke", "#666")
    .attr("stroke-width", 1.5)
    .attr("d", d => {
      const midY = d.source.y + LEVEL_Y / 2;
      return `
        M ${d.source.x},${d.source.y}
        V ${midY}
        H ${d.target.x}
        V ${d.target.y}
      `;
    });

  // ---------- NODES ----------
  const node = g.selectAll(".node")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", d => `node ${d.data.type}`)
    .attr("transform", d => `translate(${d.x},${d.y})`);

  // ---------- FAMILY NODE ----------
  const family = node.filter(d => d.data.type === "family");

  family.append("rect")
    .attr("x", -40)
    .attr("y", -90)
    .attr("width", 80)
    .attr("height", 180)
    .attr("rx", 8)
    .attr("fill", "#e7f1ff")
    .attr("stroke", "#0d6efd")
    .attr("stroke-width", 2);

  // CHA (trái, dọc)
  family.append("text")
    .attr("x", -18)
    .attr("y", 0)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("writing-mode", "vertical-rl")
    .attr("text-orientation", "mixed")
    .style("font-size", "12px")
    .text(d => d.data.fatherName);

  // ĐƯỜNG PHÂN CÁCH |
  family.append("line")
    .attr("x1", 0)
    .attr("y1", -80)
    .attr("x2", 0)
    .attr("y2", 80)
    .attr("stroke", "#0d6efd")
    .attr("stroke-width", 1.5);

  // MẸ (phải, dọc)
  family.append("text")
    .attr("x", 18)
    .attr("y", 0)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("writing-mode", "vertical-rl")
    .attr("text-orientation", "mixed")
    .style("font-size", "12px")
    .text(d => d.data.motherName);

  // ---------- CHILD NODE ----------
  const child = node.filter(d => d.data.type === "child");

  child.append("rect")
    .attr("x", -30)
    .attr("y", -45)
    .attr("width", 60)
    .attr("height", 90)
    .attr("rx", 6)
    .attr("fill", "#fff")
    .attr("stroke", "#333");

  child.append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("writing-mode", "vertical-rl")
    .attr("text-orientation", "mixed")
    .style("font-size", "11px")
    .text(d => d.data.name);

  // ---------- AUTO CENTER ----------
  setTimeout(() => {
    const c = document.getElementById("tree-container");
    c.scrollLeft = (width - c.clientWidth) / 2;
  }, 50);
}
