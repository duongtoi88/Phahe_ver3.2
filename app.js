// ===== Helper đọc cột Excel an toàn Unicode =====
function getValue(row, key) {
  const target = key.normalize("NFC");
  for (const k in row) {
    if (k.normalize("NFC") === target) return row[k];
  }
  return null;
}

// ===== Load Excel =====
window.onload = () => {
  fetch("input.xlsx")
    .then(res => res.arrayBuffer())
    .then(data => {
      const wb = XLSX.read(data, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      window.rawRows = rows;

      const rootIDs = rows
        .filter(r => r["Đinh"] === "x")
        .map(r => String(r.ID));

      const select = document.createElement("select");
      select.id = "rootSelector";

      rootIDs.forEach(id => {
        const r = rows.find(p => String(p.ID) === id);
        const opt = document.createElement("option");
        opt.value = id;
        opt.text = `${r["Họ và tên"]} (Đời ${r["Đời"] || "-"})`;
        select.appendChild(opt);
      });

      document.body.insertBefore(select, document.getElementById("tree-container"));

      select.onchange = redraw;
      document.getElementById("showGirls").onchange = redraw;

      redraw();

      function redraw() {
        const rootID = select.value;
        const includeGirls = document.getElementById("showGirls").checked;
        const treeData = convertToSubTree(rows, rootID, includeGirls);

        document.getElementById("tree-container").innerHTML = "";
        drawTree(treeData);
      }
    });
};

// ===== Convert dữ liệu =====
function convertToSubTree(rows, rootID, includeGirls) {
  const people = {};
  const valid = new Set();

  rows.forEach(r => {
    const id = String(r.ID);
    people[id] = {
      id,
      name: r["Họ và tên"] || "",
      father: getValue(r, "ID cha") ? String(getValue(r, "ID cha")) : null,
      mother: getValue(r, "ID mẹ") ? String(getValue(r, "ID mẹ")) : null,
      dinh: r["Đinh"] || "",
      children: []
    };
  });

  function collect(id) {
    if (!people[id]) return;
    if (includeGirls || people[id].dinh === "x") valid.add(id);

    rows.forEach(r => {
      const cid = String(r.ID);
      const fid = getValue(r, "ID cha") ? String(getValue(r, "ID cha")) : null;
      if (fid === id) collect(cid);
    });
  }

  collect(rootID);

  valid.forEach(id => {
    const p = people[id];
    if (p.father && valid.has(p.father)) {
      people[p.father].children.push(p);
    }
  });

  return people[rootID];
}

// ===== Vẽ tree =====
function drawTree(data) {
  const root = d3.hierarchy(data);
  window.treeRoot = root;

  const nodeWidth = 120;
  const nodeHeight = 200;

  d3.tree().nodeSize([nodeWidth, nodeHeight])(root);

  const nodes = root.descendants();
  const minX = d3.min(nodes, d => d.x);
  const maxX = d3.max(nodes, d => d.x);
  const maxY = d3.max(nodes, d => d.y);

  const svg = d3
    .select("#tree-container")
    .append("svg")
    .attr("width", maxX - minX + 200)
    .attr("height", maxY + 300);

  const g = svg
    .append("g")
    .attr("transform", `translate(${100 - minX}, 100)`);

  window.treeGroup = g;

  g.selectAll(".link")
    .data(root.links())
    .enter()
    .append("path")
    .attr("class", "link")
    .attr("d", d => {
      const m = (d.source.y + d.target.y) / 2;
      return `M${d.source.x},${d.source.y} V${m} H${d.target.x} V${d.target.y}`;
    });

  const node = g
    .selectAll(".node")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", d =>
      d.data.dinh === "x" ? "node dinh-x" : "node dinh-thuong"
    )
    .attr("transform", d => `translate(${d.x},${d.y})`);

  node.append("rect")
    .attr("x", -40)
    .attr("y", -60)
    .attr("width", 80)
    .attr("height", 120)
    .attr("rx", 10);

  node.append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text(d => d.data.name);

  // ===== gọi overlay mẹ =====
  if (window.drawMotherNodes) {
    window.drawMotherNodes();
  }
}
