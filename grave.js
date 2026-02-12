function renderGraveTab() {

  const container = document.getElementById("graveContainer");
  const data = window.allPeople || [];

  if (!data.length) {
    container.innerHTML = "Chưa có dữ liệu.";
    return;
  }

  const gravePeople = data.filter(p => p["Khu vực"]);

  const grouped = {};

  gravePeople.forEach(p => {
    const area = p["Khu vực"].trim();
    if (!grouped[area]) grouped[area] = [];
    grouped[area].push(p);
  });

  let html = "";

  Object.keys(grouped).forEach(area => {

    html += `<h3>Khu vực: ${area}</h3>`;

    html += `
      <table>
        <tr>
          <th>STT</th>
          <th>Họ và tên</th>
          <th>Đời</th>
          <th>Năm sinh - Năm mất</th>
          <th>Vị trí</th>
          <th>Chi tiết</th>
        </tr>
    `;

    grouped[area]
      .sort((a, b) => (a["Thứ tự v"] || 0) - (b["Thứ tự v"] || 0))
      .forEach((p, index) => {

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
            <td><a href="detail.html?id=${p["ID"]}">Xem</a></td>
          </tr>
        `;
      });

    html += "</table><br>";
  });

  container.innerHTML = html;
}
