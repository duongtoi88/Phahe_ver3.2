// =====================================================
// Helper: đọc cột Excel an toàn với Unicode (ID mẹ, ID cha, …)
// DÁN NGAY TRÊN CÙNG – KHÔNG PHÁ LOGIC CŨ
// =====================================================
function getValue(row, key) {
  const target = key.normalize("NFC");
  for (const k in row) {
    if (k.normalize("NFC") === target) {
      return row[k];
    }
  }
  return null;
}

// =====================================================
// Tự động đọc file Excel khi trang vừa load
// =====================================================
window.onload = () => {
  fetch('input.xlsx')
    .then(res => res.arrayBuffer())
    .then(data => {
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      window.rawRows = json;

      // Tạo dropdown chọn ID gốc (Đinh x)
      const rootIDs = json
        .filter(r => r["Đinh"] === "x")
        .map(r => String(r.ID).replace('.0', ''));

      const select = document.createElement("select");
      select.id = "rootSelector";
      select.style.marginBottom = "10px";

      rootIDs.forEach(id => {
        const r = json.find(p => String(p.ID).replace('.0', '') === id);
        if (!r) return;
        const opt = document.createElement("option");
        opt.value = id;
        opt.text = `${r["Họ và tên"]} (Đời ${r["Đời"] || "-"})`;
        select.appendChild(opt);
      });

      // Thêm sự kiện chọn ID
      select.onchange = () => {
        const selectedID = select.value;
        const includeGirls = document.getElementById("showGirls").checked;
        const rootTree = convertToSubTree(json, selectedID, includeGirls);
        document.getElementById("tree-container").innerHTML = "";
        drawTree(rootTree);
      };

      // Thêm vào DOM
      document.body.insertBefore(
        select,
        document.getElementById("tree-container")
      );

      // Sự kiện tick "Cả Nam & Nữ"
      document.getElementById("showGirls").onchange = () => {
        const selectedID = document.getElementById("rootSelector").value;
        const includeGirls = document.getElementById("showGirls").checked;
        const rootTree = convertToSubTree(json, selectedID, includeGirls);
        document.getElementById("tree-container").innerHTML = "";
        drawTree(rootTree);
      };

      // Vẽ cây mặc định
      const defaultRoot = rootIDs[0];
      const treeData = convertToSubTree(json, defaultRoot, false);
      drawTree(treeData);
    })
    .catch(err => {
      console.error("Không thể đọc file Excel:", err);
    });
};

// =====================================================
// Duyệt cây con từ ID gốc (LOGIC GỐC – KHÔNG ĐỔI)
// =====================================================
function convertToSubTree(rows, rootID, includeGirls = false) {
  const people = {};
  const validIDs = new Set();

  rows.forEach(row => {
    const id = String(row.ID).replace('.0', '');
    people[id] = {
      id,
      name: row["Họ và tên"] || "",
      birth: row["Năm sinh"] || "",
      death: row["Năm mất"] || "",
      info: row["Thông tin chi tiết"] || "",
      father: getValue(row, "ID cha")
        ? String(getValue(row, "ID cha")).replace('.0', '')
        : null,
      mother: getValue(row, "ID mẹ")
        ? String(getValue(row, "ID mẹ")).replace('.0', '')
        : null,
      spouse: row["ID chồng"]
        ? String(row["ID chồng"]).replace('.0', '')
        : null,
      doi: row["Đời"] || "",
      dinh: row["Đinh"] || "",
      children: []
    };
  });

  function collectDescendants(id) {
    if (!people[id]) return;

    if (includeGirls || people[id].dinh === "x") {
      validIDs.add(id);
    }

    rows.forEach(r => {
      const childID = String(r.ID).replace('.0', '');
      const fatherID = getValue(r, "ID cha")
        ? String(getValue(r, "ID cha")).replace('.0', '')
        : null;

      if (fatherID === id) {
        if (includeGirls || r["Đinh"] === "x") {
          collectDescendants(childID);
        }
      }
    });
  }

  collectDescendants(rootID);

  // Nếu tick "Cả Nam & Nữ" → thêm vợ của các thành viên nam
  if (includeGirls) {
    const extraSpouses = rows.filter(r => {
      const idChong = r["ID chồng"]
        ? String(r["ID chồng"]).replace('.0', '')
        : "";
      return validIDs.has(idChong);
    });

    extraSpouses.forEach(r => {
      const id = String(r.ID).replace('.0', '');
      validIDs.add(id);
    });
  }

  const treePeople = {};
  validIDs.forEach(id => {
    if (people[id]) treePeople[id] = people[id];
  });

  Object.values(treePeople).forEach(p => {
    if (p.father && treePeople[p.father]) {
      treePeople[p.father].children.push(p);
    }
  });

  Object.values(treePeople).forEach(p => {
    p.children.sort((a, b) => {
      const aYear = parseInt(a.birth) || 9999;
      const bYear = parseInt(b.birth) || 9999;
      return aYear - bYear;
    });
  });

  return treePeople[rootID];
}
