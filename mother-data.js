window.MotherData = (function () {

  function collect(root, d) {
    const map = {};
    const allNodes = root.descendants();

    allNodes.forEach(child => {
      const motherID = child.data.mother;
      const fatherID = child.data.father;
      if (!motherID || !fatherID) return;

      const father = allNodes.find(n => n.data.id === fatherID);
      if (!father) return;

      if (!map[motherID]) {

        // lấy tên trực tiếp từ rawRows để không phụ thuộc tree
        const row = window.rawRows.find(r =>
          String(r.ID).replace('.0', '') === motherID
        );

        map[motherID] = {
          id: motherID,
          name: row ? row["Họ và tên"] : "",
          father,
          children: [],
          x: father.x,
          y: father.y + d / 3
        };
      }

      map[motherID].children.push(child);
    });

    layoutMultipleWives(map);

    return map;
  }

  function layoutMultipleWives(mothers) {
    const byFather = {};

    Object.values(mothers).forEach(m => {
      const fid = m.father.data.id;
      if (!byFather[fid]) byFather[fid] = [];
      byFather[fid].push(m);
    });

    Object.values(byFather).forEach(wives => {
      if (wives.length <= 1) return;

      const spacing = 120;
      wives.forEach((m, i) => {
        m.x = m.father.x + (i - (wives.length - 1) / 2) * spacing;
        m.y += i * 8;
      });
    });
  }

  return { collect };

})();
