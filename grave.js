function renderGraveTab() {

  const container = document.getElementById("graveSection");
  if (!container) return;

  const data = window.rawRows || [];

  if (!data.length) {
    container.innerHTML = "Chưa có dữ liệu.";
    return;
  }

  // ===============================
  // 1️⃣ CHỈ LẤY NGƯỜI CÓ NĂM MẤT
  // ===============================
  const gravePeople = data.filter(p => {
    const death = p["Năm mất"];
    const area = p["Khu vực"];
    return area && death && String(death).trim() !== "";
  });

  if (!gravePeople.length) {
    container.innerHTML = "Không có dữ liệu mộ chí.";
    return;
  }

  // ===============================
  // 2️⃣ GROUP THEO KHU VỰC
  // ===============================
  const grouped = {};

  gravePeople.forEach(p => {
    const area = String(p["Khu vực"]).trim();

    if (!grouped[area]) {
      grouped[area] = [];
    }

    grouped[area].push(p);
  });

  let html = "";

  // ===============================
  // 3️⃣ SẮP XẾP KHU VỰC
  // "Khác" LUÔN Ở CUỐI
  // ===============================
  const sortedAreas = Object.keys(grouped).sort((a, b) => {

    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();

    const aIsOther = aLower.includes("khác");
    const bIsOther = bLower.includes("khác");

    if (aIsOther && !bIsOther) return 1;
    if (!aIsOther && bIsOther) return -1;

    return a.localeCompare(b, 'vi');
  });

  // ===============================
  // 4️⃣ RENDER
  // ===============================
  sortedAreas.forEach(area => {

    html += `<h3>Khu vực: ${area}</h3>`;

    html += `
      <table border="1" cellpadding="5" cellspacing="0">
        <tr>
          <th>STT</th>
          <th>Họ và tên</th>
          <th>Đời</th>
          <th>Năm sinh - Năm mất</th>
          <th>Vị trí</th>
          <th>Chi tiết</th>
        </tr>
    `;

    grouped[area].forEach((p, index) => {

      const lat = p["Tọa X"];
      const lng = p["Tọa Y"];

      let mapCell = "—";

      if (lat && lng) {
        const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;
        mapCell = `<a href="${mapLink}" target="_blank">Google Map</a>`;
      }

      html += `
        <tr>
          <td>${index + 1}</td>
          <td>${p["Họ và tên"] || ""}</td>
          <td>${p["Đời"] || ""}</td>
          <td>${p["Năm sinh"] || ""} - ${p["Năm mất"] || ""}</td>
          <td>${mapCell}</td>
          <td>
            <a href="detail.html?id=${p["ID"]}">
              Xem
            </a>
          </td>
        </tr>
      `;
    });

    html += "</table><br>";
  });

  container.innerHTML = html;
}
