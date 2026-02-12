window.MotherLinks = (function () {

  function render(g, mothers, d) {

    const NODE_HALF_FATHER = 60; // cha cao 120
    const NODE_HALF_MOTHER = 60; // mẹ cao 120

    Object.values(mothers).forEach(m => {

      const f = m.father;

      /* CHA → MẸ */
      g.append("path")
        .attr("class", "link link-father-mother")
        .attr("d", `
          M ${f.x},${f.y + NODE_HALF_FATHER}
          V ${m.y - NODE_HALF_MOTHER}
        `);

      if (!m.children.length) return;

      /* TRỤC */
      const yJoint = m.y + (d * 2 / 3);

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

