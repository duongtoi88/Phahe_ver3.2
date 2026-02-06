// ================================
// PHẢ HỆ – FAMILY NODE [CHA | MẸ]
// FULL app.js – D3 v7
// ================================

// ---------- LOAD EXCEL ----------
window.onload = () => {
  fetch('input.xlsx')
    .then(res => res.arrayBuffer())
    .then(data => {
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const people = normalizeRows(rows);
      const families = buildFamilyNodes(people);
      const treeData = buildFamilyTree(families);

      drawTree(treeData);
    })
    .catch(err => console.error("Không đọc được Excel:", err));
};

// ---------- NORMALIZE ----------
function normalizeRows(rows) {
  return rows.map(r => ({
    id: String(r.ID).replace('.0',''),
    name: r["Họ và tên"] || "",
    birth: r["Năm sinh"] || "",
    death: r["Năm mất"] || "",
    father: r["ID cha"] ? String(r["ID cha"]).replace('.0','') : null,
    mother: r["ID mẹ"] ? String(r["ID mẹ"]).replace('.0','') : null,
    doi: r["Đời"] || ""
  }));
}

// ---------- BUILD FAMILY NODES ----------
function buildFamilyNodes(people) {
  const map = {};
  const families = [];

  people.forEach(p => {
    if (!p.father || !p.mother) return;

    const fid = `F_${p.father}_${p.mother}`;
    if (!map[fid]) {
      const father = people.find(x => x.id === p.father);
      const mother = people.find(x => x.id === p.mother);

      map[fid] = {
        id: fid,
        type: "family",
        fatherID: p.father,
        motherID: p.mother,
        fatherName: father?.name || "Cha ?",
        motherName: mother?.name || "Mẹ ?",
        children: []
      };
      families.push(map[fid]);
    }

    map[fid].children.push({
      ...p,
      type: "child"
    });
  });

  return families;
}

// ---------- BUILD TREE ----------
function buildFamilyTree(families) {
  return {
    id: "ROOT",
    type: "root",
    children: families
  };
}

// ---------- DRAW TREE ----------
function drawTree(treeData) {
  d3.select("#tree-container").selectAll("svg").remove();

  const nodeWidth = 180;
  const nodeHeight = 120;

  const root = d3.hierarchy(treeData, d => {
    if (d.type === "root") return d.children;
    if (d.type === "family") return d.children;
    return null;
  });

  const treeLayout = d3.tree()
    .nodeSize([nodeWidth, nodeHeight]);

  treeLayout(root);

  const nodes = root.descendants();
  const links = root.links();

  const minX = d3.min(nodes, d => d.x);
  const maxX = d3.max(nodes, d => d.x);
  const minY = d3.min(nodes, d => d.y);
  const maxY = d3.max(nodes, d => d.y);

  const width = maxX - minX + 400;
  const height = maxY - minY + 400;

  const svg = d3.select("#tree-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g")
    .attr("transform", `translate(${200 - minX},${200 - minY})`);

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
      const midY = (d.source.y + d.target.y) / 2;
      return `
        M ${d.source.x},${d.source.y}
        V ${midY}
        H ${d.target.x}
        V ${d.target.y}
      `;
    });

  // ---------- NODES ----------
  const node = g.selectAll(".node")
    .data(nodes.filter(d => d.data.type !== "root"))
    .enter()
    .append("g")
    .attr("class", d => `node ${d.data.type}`)
    .attr("transform", d => `translate(${d.x},${d.y})`);

  // FAMILY NODE [CHA | MẸ]
  const familyNode = node.filter(d => d.data.type === "family");

  familyNode.append("rect")
    .attr("x", -90)
    .attr("y", -30)
    .attr("width", 180)
    .attr("height", 60)
    .attr("rx", 8)
    .attr("fill", "#e7f1ff")
    .attr("stroke", "#0d6efd");

  familyNode.append("line")
    .attr("x1", 0).attr("y1", -25)
    .attr("x2", 0).attr("y2", 25)
    .attr("stroke", "#0d6efd");

  familyNode.append("text")
    .attr("x", -45)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("font-size", "12px")
    .text(d => d.data.fatherName);

  familyNode.append("text")
    .attr("x", 45)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("font-size", "12px")
    .text(d => d.data.motherName);

  // CHILD NODE
  const childNode = node.filter(d => d.data.type === "child");

  childNode.append("rect")
    .attr("x", -45)
    .attr("y", -22)
    .attr("width", 90)
    .attr("height", 44)
    .attr("rx", 6)
    .attr("fill", "#ffffff")
    .attr("stroke", "#333");

  childNode.append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("font-size", "12px")
    .text(d => d.data.name);

  // ---------- AUTO CENTER ----------
  setTimeout(() => {
    const container = document.getElementById("tree-container");
    container.scrollLeft = (width - container.clientWidth) / 2;
  }, 50);
}
