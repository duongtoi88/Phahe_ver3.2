function renderGraveTab() {

  const container = document.getElementById("graveSection");

  if (!container) {
    console.error("Không tìm thấy graveSection trong DOM");
    return;
  }

 const data = window.rawRows || [];

  if (!data.length) {
    container.innerHTML = "Chưa có dữ liệu.";
    return;
  }

  const gravePeople = data.filter(p => p["Khu vực"]);

  let html = "<h3>Danh sách mộ chí</h3>";

  gravePeople.forEach((p, index) => {

    const lat = p["Tọa X"];
    const lng = p["Tọa Y"];

    let mapLink = "";

    if (lat && lng) {
      mapLink = `<a target="_blank" href="https://www.google.com/maps?q=${lat},${lng}">Google Map</a>`;
    }

    html += `
      <div style="margin-bottom:8px;">
        ${index + 1}. ${p["Họ và tên"] || ""}
        (${p["Năm sinh"] || ""} - ${p["Năm mất"] || ""})
        ${mapLink}
      </div>
    `;
  });

  container.innerHTML = html;
}

