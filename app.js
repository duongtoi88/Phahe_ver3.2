// app.js - tối ưu, zoom/pan, xử lý lỗi, map children trước, tooltip, focus on node
(function () {
  // ===== Helper đọc cột Excel an toàn Unicode =====
  function getValue(row, key) {
    const target = String(key).normalize("NFC");
    for (const k in row) {
      if (String(k).normalize("NFC") === target) return row[k];
    }
    return null;
  }

  // ===== State =====
  const state = {
    rows: [],
    people: {},     // id -> person object
    childrenMap: {},// fatherId -> [childId,...]
    rootIDs: [],
    currentRootID: null,
    includeGirls: false
  };

  // ===== Utils =====
  function $(id) { return document.getElementById(id); }
  function showMessage(msg) {
    let el = $('loadingMessage');
    if (!el) {
      el = document.createElement('div');
      el.id = 'loadingMessage';
      el.style.padding = '8px';
      el.style.fontSize = '13px';
      document.body.insertBefore(el, $('tree-container'));
    }
    el.textContent = msg;
  }

  // ===== Load Excel & init =====
  window.addEventListener('DOMContentLoaded', () => {
    initUI();
    loadExcel('input.xlsx').catch(err => {
      console.error(err);
      showMessage('Lỗi khi tải/đọc file Excel: ' + (err.message || err));
    });
  });

  async function loadExcel(url) {
    showMessage('Đang tải và đọc file Excel...');
    const res = await fetch(url);
    if (!res.ok) throw new Error('Fetch failed: ' + res.status);
    const data = await res.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
    state.rows = rows;
    buildMaps(rows);
    buildRootSelector();
    showMessage('Đã tải xong. Chọn ID gốc để vẽ cây.');
    redraw();
  }

  function buildMaps(rows) {
    state.people = {};
    state.childrenMap = {};
    state.rootIDs = [];

    rows.forEach(r => {
      const id = String(r.ID);
      const father = getValue(r, 'ID cha') ? String(getValue(r, 'ID cha')) : null;
      const mother = getValue(r, 'ID mẹ') ? String(getValue(r, 'ID mẹ')) : null;
      const dinh = r['Đinh'] || '';
      state.people[id] = {
        id,
        name: r['Họ và tên'] || '',
        father,
        mother,
        dinh,
      };
      if (father) {
        (state.childrenMap[father] ||= []).push(id);
      }
      // mark roots: records with "Đinh" === "x" are candidate roots
      if (r['Đinh'] === 'x') state.rootIDs.push(id);
    });

    // ensure unique rootIDs
    state.rootIDs = Array.from(new Set(state.rootIDs));
  }

  // ===== UI init =====
  function initUI() {
    // ensure a select exists (index.html already inserts a container), but create if missing
    let select = $('rootSelector');
    if (!select) {
      select = document.createElement('select');
      select.id = 'rootSelector';
      document.body.insertBefore(select, $('tree-container'));
    }
    select.addEventListener('change', () => {
      state.currentRootID = select.value;
      debounceRedraw();
    });

    const cb = $('showGirls');
    if (cb) {
      cb.addEventListener('change', () => {
        state.includeGirls = cb.checked;
        debounceRedraw();
      });
    }

    // small debounce to avoid multiple expensive redraws
    window._redrawTimeout = null;
    window.debounceRedraw = function () {
      if (window._redrawTimeout) clearTimeout(window._redrawTimeout);
      window._redrawTimeout = setTimeout(redraw, 120);
    };
  }

  // ===== Build root selector options =====
  function buildRootSelector() {
    const select = $('rootSelector');
    select.innerHTML = '';
    // If no explicit roots found, fallback to unique top-level people (no father)
    let opts = state.rootIDs.length ? state.rootIDs.slice() : [];
    if (!opts.length) {
      opts = Object.values(state.people)
        .filter(p => !p.father)
        .slice(0, 50) // limit to avoid giant selects
        .map(p => p.id);
    }

    opts.forEach(id => {
      const p = state.people[id];
      if (!p) return;
      const opt = document.createElement('option');
      opt.value = id;
      opt.text = `${p.name || ('ID ' + id)} (Đinh: ${p.dinh || '-'})`;
      select.appendChild(opt);
    });

    // select the first by default
    if (select.options.length) {
      select.selectedIndex = 0;
      state.currentRootID = select.value;
    }
  }

  // ===== Convert dữ liệu sang subtree =====
  function convertToSubTree(rootID, includeGirls) {
    if (!rootID || !state.people[rootID]) return null;

    const valid = new Set();
    // DFS stack using childrenMap for speed
    const stack = [rootID];
    while (stack.length) {
      const id = stack.pop();
      const p = state.people[id];
      if (!p) continue;
      if (includeGirls || p.dinh === 'x') valid.add(id);
      const children = state.childrenMap[id] || [];
      for (const cid of children) {
        stack.push(cid);
      }
    }

    // build nodes only for valid set, recursively
    function buildNode(id) {
      const p = state.people[id];
      if (!p) return null;
      const node = {
        id: p.id,
        name: p.name,
        dinh: p.dinh,
        children: []
      };
      const childs = state.childrenMap[id] || [];
      for (const cid of childs) {
        if (valid.has(cid)) {
          const cnode = buildNode(cid);
          if (cnode) node.children.push(cnode);
        }
      }
      return node;
    }

    const rootNode = buildNode(rootID);
    return rootNode;
  }

  // ===== Vẽ tree =====
  function redraw() {
    const rootID = state.currentRootID;
    const includeGirls = state.includeGirls;
    const treeData = convertToSubTree(rootID, includeGirls);
    const container = $('tree-container');
    if (!container) return;
    container.innerHTML = '';
    if (!treeData) {
      showMessage('Không có dữ liệu cho ID gốc đã chọn.');
      return;
    }
    showMessage('');
    drawTree(treeData);
  }

  function drawTree(data) {
    // constants / sizing
    const NODE_W = 110;
    const NODE_H = 80;
    const H_SPACING = 160;
    const V_SPACING = 200;
    const margin = { top: 40, right: 60, bottom: 120, left: 60 };

    // create hierarchy & layout
    const root = d3.hierarchy(data, d => d.children);
    const treeLayout = d3.tree().nodeSize([H_SPACING, V_SPACING]);
    treeLayout(root);

    const nodes = root.descendants();
    const minX = d3.min(nodes, d => d.x);
    const maxX = d3.max(nodes, d => d.x);
    const minY = d3.min(nodes, d => d.y);
    const maxY = d3.max(nodes, d => d.y);

    const width = Math.max(800, maxX - minX + margin.left + margin.right);
    const height = Math.max(400, maxY - minY + margin.top + margin.bottom);

    const container = d3.select('#tree-container');
    const svg = container.append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `${minX - margin.left} ${-margin.top} ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('background', 'transparent');

    // add zoom / pan
    const g = svg.append('g')
      .attr('class', 'tree-layer')
      .attr('transform', `translate(0,${20})`);

    const zoom = d3.zoom()
      .scaleExtent([0.2, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // links
    g.selectAll('.link')
      .data(root.links())
      .join('path')
      .attr('class', 'link')
      .attr('d', d => {
        // Manhattan connector like original but smoother with cubic curve
        const sx = d.source.x;
        const sy = d.source.y;
        const tx = d.target.x;
        const ty = d.target.y;
        const mx = (sx + tx) / 2;
        return `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`;
      })
      .attr('fill', 'none')
      .attr('stroke', '#777')
      .attr('stroke-width', 2);

    // nodes
    const node = g.selectAll('.node')
      .data(nodes, d => d.data.id)
      .join('g')
      .attr('class', d => d.data.dinh === 'x' ? 'node dinh-x' : 'node dinh-thuong')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer');

    node.append('rect')
      .attr('x', -NODE_W / 2)
      .attr('y', -NODE_H / 2)
      .attr('width', NODE_W)
      .attr('height', NODE_H)
      .attr('rx', 8)
      .attr('fill', '#fff')
      .attr('stroke', '#333');

    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('pointer-events', 'none')
      .style('font-size', '12px')
      .text(d => d.data.name || ('ID ' + d.data.id));

    // tooltip element (single shared div in DOM)
    let tooltip = document.getElementById('tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'tooltip';
      document.body.appendChild(tooltip);
    }

    // events: hover, click to focus
    node.on('mouseenter', (event, d) => {
      tooltip.style.display = 'block';
      tooltip.innerHTML = `<b>${d.data.name || ''}</b><br/>ID: ${d.data.id}<br/>Đinh: ${d.data.dinh || '-'}`;
      tooltip.style.left = (event.pageX + 12) + 'px';
      tooltip.style.top = (event.pageY + 12) + 'px';
    }).on('mousemove', (event) => {
      tooltip.style.left = (event.pageX + 12) + 'px';
      tooltip.style.top = (event.pageY + 12) + 'px';
    }).on('mouseleave', () => {
      tooltip.style.display = 'none';
    }).on('click', (event, d) => {
      // center clicked node: compute transform to center node in viewport
      const svgNode = svg.node();
      const svgRect = svgNode.getBoundingClientRect();
      const cx = svgRect.width / 2;
      const cy = svgRect.height / 3;
      const x = d.x;
      const y = d.y;
      // current transform
      const t = d3.zoomTransform(svgNode);
      const scale = t.k;
      const translateX = cx - x * scale;
      const translateY = cy - y * scale;
      svg.transition().duration(700).call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
    });

    // expose for mother nodes rendering
    window._currentDraw = { root, group: g, rows: state.rows, nodeById: Object.fromEntries(nodes.map(n => [n.data.id, n])) };

    // call mother-nodes renderer if present
    if (typeof window.drawMotherNodes === 'function') {
      try {
        window.drawMotherNodes(root, g, state.rows, window._currentDraw.nodeById);
      } catch (err) {
        console.error('Error drawMotherNodes:', err);
      }
    }
  }

  // Expose minimal API for debugging (optional)
  window._familyApp = {
    state,
    redraw,
  };

})();