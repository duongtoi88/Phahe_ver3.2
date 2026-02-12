window.MotherLinks = (function () {

  function render(g, mothers, d) {

    const NODE_HALF_FATHER = 60; // cha cao 120
    const NODE_HALF_MOTHER = 30; // mẹ cao 60

    Object.values(mothers).forEach(m => {

      const f = m.father;

      /* CHA → MẸ */
// nhóm mẹ theo cha
      const byFather = {};
      
      Object.values(mothers).forEach(m => {
        const fid = m.father.data.id;
        if (!byFather[fid]) byFather[fid] = [];
        byFather[fid].push(m);
      });
      
      Object.values(byFather).forEach(wives => {
      
        const father = wives[0].father;
      
        const startX = father.x;
        const startY = father.y + NODE_HALF_FATHER;
      
        const midY = startY + 20; // độ rơi xuống trước khi rẽ ngang
      
        const xs = wives.map(m => m.x);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
      
        // 1️⃣ đường dọc từ cha
        g.append("path")
          .attr("class", "link link-father-mother")
          .attr("d", `
            M ${startX},${startY}
            V ${midY}
          `);
      
        // 2️⃣ trục ngang chung
        g.append("path")
          .attr("class", "link link-father-mother")
          .attr("d", `
            M ${minX},${midY}
            H ${maxX}
          `);
      
        // 3️⃣ từ trục xuống từng mẹ
        wives.forEach(m => {
          g.append("path")
            .attr("class", "link link-father-mother")
            .attr("d", `
              M ${m.x},${midY}
              V ${m.y - NODE_HALF_MOTHER}
            `);
        });
      
      });


      /* TRỤC */
      const yJoint = m.y + (d * 1 / 3);

      const xs = [m.x, ...m.children.map(c => c.x)];
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);

      /* MẸ → TRỤC */
      g.append("path")
        .attr("class", "link link-mother-branch")
        .attr("d", `
          M ${m.x},${m.y + NODE_HALF_MOTHER}
          V ${yJoint}
        `);

      /* TRỤC NGANG */
      g.append("path")
        .attr("class", "link link-children-horizontal")
        .attr("d", `
          M ${minX},${yJoint}
          H ${maxX}
        `);

      /* TRỤC → CON */
      m.children.forEach(c => {
        g.append("path")
          .attr("class", "link link-child-vertical")
          .attr("d", `
            M ${c.x},${yJoint}
            V ${c.y - NODE_HALF_FATHER}
          `);
      });

    });
  }

  return { render };

})();



