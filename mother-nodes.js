// mother-nodes.js - vẽ các "mẹ" (người mẹ) ngoài vùng tree.
// Hàm bây giờ nhận tham số thay vì phụ thuộc vào window.treeRoot.
// Ghi chú: giữ compatibility bằng cách gán vào window.drawMotherNodes.

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
      people[String(r.ID)] = r;
    });

    // ===== build motherMap: fatherId -> Set(motherId) =====
    const motherMap = {};
    root.descendants().forEach(d => {
      const fatherId = d.data.id;
      const children = d.children || [];
      children.forEach(c => {
        if (!c.data || !c.data.mother) return;
        const mid = c.data.mother || String(getValueFromRaw(people[c.data.id], 'ID mẹ'));
        if (!mid) return;
        (motherMap[fatherId] ||= new Set()).add(mid);
      });
    });

    // helper to read raw value safely (in case keys have Unicode forms)
    function getValueFromRaw(row, key) {
      if (!row) return null;
      // normalization similar to app.js getValue
      const target = String(key).normalize('NFC');
      for (const k in row) {
        if (String(k).normalize('NFC') === target) return row[k];
      }
      return null;
    }

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

        // group: rotate for vertical label (optional). We'll render horizontal text for readability.
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

  // expose to window (compat)
  window.drawMotherNodes = drawMotherNodes;
})();