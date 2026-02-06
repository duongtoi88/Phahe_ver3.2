// mother-nodes.js - vẽ các "mẹ" (người mẹ) ngoài vùng tree.
// Hàm bây giờ nhận tham số thay vì phụ thuộc vào window.treeRoot.
// Ghi chú: gi�� compatibility bằng cách gán vào window.drawMotherNodes.

(function () {
  function drawMotherNodes(root, g, rawRows, nodeById = {}) {
    if (!root || !g || !rawRows) return;

    // ===== layer riêng =====
    let layer = g.select('g.mother-layer');
    if (!layer.empty()) layer.remove();
    layer = g.append('g').attr('class', 'mother-layer');

    // ===== map raw rows by id =====
    const people = {};
    rawRows.forEach(r => {
      if (r && r.ID != null) people[String(r.ID)] = r;
    });

    // ===== build motherMap: fatherId -> Set(motherId) =====
    const motherMap = {};
    root.descendants().forEach(d => {
      const fatherId = d.data.id;
      const children = d.children || [];
      children.forEach(c => {
        if (!c.data) return;
        // cố gắng lấy mother từ dữ liệu đã normalize (trong trạng thái rawRows)
        const raw = people[String(c.data.id)];
        const mid = (raw && (raw['ID mẹ'] || raw['IDMe'] || raw['ID_me'])) ? String(raw['ID mẹ'] || raw['IDMe'] || raw['ID_me']) : (c.data.mother || null);
        if (!mid) return;
        (motherMap[fatherId] ||= new Set()).add(String(mid));
      });
    });

    // ===== layout mothers =====
    const TREE_NODE_HEIGHT = 200;
    const offsetY = TREE_NODE_HEIGHT + 40;
    const spacingX = 140;

    Object.entries(motherMap).forEach(([fatherId, set]) => {
      const fatherNode = nodeById[fatherId];
      if (!fatherNode) return;

      const ids = Array.from(set);
      ids.forEach((mid, i) => {
        const m = people[mid];
        if (!m) return;

        const x = fatherNode.x + (i - (ids.length - 1) / 2) * spacingX;
        const y = fatherNode.y + offsetY;

        const mg = layer.append('g')
          .attr('class', 'mother-node')
          .attr('transform', `translate(${x},${y})`);

        mg.append('rect')
          .attr('x', -70)
          .attr('y', -22)
          .attr('width', 140)
          .attr('height', 44)
          .attr('rx', 6);

        mg.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .text(m['Họ và tên'] || '');
      });
    });
  }

  window.drawMotherNodes = drawMotherNodes;
})();