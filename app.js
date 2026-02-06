// app.js - tự động load ./input.xlsx (cùng thư mục), robust header mapping, vẽ bằng D3
(function () {
  // ===== Helper đọc cột Excel an toàn Unicode =====
  function normalizeKey(s) {
    if (s == null) return '';
    return String(s).normalize('NFC').trim();
  }
  function getValue(row, key) {
    const target = normalizeKey(key);
    for (const k in row) {
      if (normalizeKey(k) === target) return row[k];
    }
    return null;
  }
  function getAny(row, names) {
    for (const n of names) {
      const v = getValue(row, n);
      if (v != null && String(v).toString().trim() !== '') return v;
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
      // Insert before tree-container if possible, otherwise append to tree-container's parent or body
      const ref = $('tree-container');
      if (ref && ref.parentNode) {
        ref.parentNode.insertBefore(el, ref);
      } else {
        document.body.appendChild(el);
      }
    }
    el.textContent = msg;
  }

  // ===== Init =====
  window.addEventListener('DOMContentLoaded', () => {
    initUI();
    // Tự động load input.xlsx trong cùng thư mục
    loadExcel('./input.xlsx').catch(err => {
      console.warn('Auto load input.xlsx thất bại:', err);
      showMessage('Không tìm thấy hoặc không thể đọc ./input.xlsx. Hãy đảm bảo file nằm cùng thư mục với index.html và mở trang qua HTTP (local server) nếu dùng cục bộ.');
    });
  });

  // ===== Load Excel từ URL tương đối =====
  async function loadExcel(url) {
    showMessage('Đang tải và đọc file Excel: ' + url);
    let res;
    try {
      res = await fetch(url, { cache: 'no-store' });
    } catch (err) {
      throw new Error('Fetch lỗi: ' + err.message + '. Nếu bạn mở bằng file://, vui lòng dùng local server.');
    }
    if (!res.ok) {
      throw new Error('Fetch thất bại: ' + res.status + ' ' + res.statusText);
    }
    const data = await res.arrayBuffer();
    processWorkbookArrayBuffer(data);
  }

  // ===== Xử lý workbook =====
  function processWorkbookArrayBuffer(arrayBuffer) {
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
    console.info('SheetJS: rows read =', rows.length);
    if (rows.length > 0) {
      console.info('SheetJS: sample row keys =', Object.keys(rows[0]));
      showMessage('Đã đọc ' + rows.length + ' hàng. (Xem console để biết tên cột thực tế.)');
    } else {
      showMessage('File rỗng hoặc không tìm thấy hàng. Vui lòng kiểm tra file input.xlsx.');
    }
    state.rows = rows;
    buildMaps(rows);
    buildRootSelector();
    // tự động redraw nếu có root được chọn
    if (state.currentRootID) redraw();
  }

  // ===== Build maps robust =====
  function buildMaps(rows) {
    state.people = {};
    state.childrenMap = {};
    state.rootIDs = [];

    const ID_KEYS = ['ID', 'Id', 'id'];
    const NAME_KEYS = ['Họ và tên', 'Ho va ten', 'Ho và tên', 'Họ và ten', 'Name', 'Ten'];
    const FATHER_KEYS = ['ID cha', 'ID_cha', 'IDcha', 'ID Cha', 'IDCha'];
    const MOTHER_KEYS = ['ID mẹ', 'ID_me', 'IDme', 'ID Mẹ', 'IDMe'];
    const DINH_KEYS = ['Đinh', 'Dinh', 'dinh'];

    rows.forEach((r, idx) => {
      if (!r) return;
      const rawId = getAny(r, ID_KEYS);
      if (rawId == null) {
        if (idx < 3) console.warn('buildMaps: row missing ID (sample):', r);
        return;
      }
      const id = String(rawId).trim();
      const fatherVal = getAny(r, FATHER_KEYS);
      const motherVal = getAny(r, MOTHER_KEYS);
      const father = fatherVal ? String(fatherVal).trim() : null;
      const mother = motherVal ? String(motherVal).trim() : null;
      const dinhVal = getAny(r, DINH_KEYS);
      const dinh = dinhVal != null ? String(dinhVal).trim() : '';

      const nameVal = getAny(r, NAME_KEYS);
      const name = nameVal != null ? String(nameVal).trim() : (r['Họ và tên'] || r['Name'] || '');

      state.people[id] = {
        id,
        name,
        father,
        mother,
        dinh,
      };
      if (father) {
        (state.childrenMap[father] ||= []).push(id);
      }
      if (String(dinh) === 'x') state.rootIDs.push(id);
    });

    state.rootIDs = Array.from(new Set(state.rootIDs));
    console.info('buildMaps: people count =', Object.keys(state.people).length, 'rootIDs =', state.rootIDs.length);
  }

  // ===== UI init =====
  function initUI() {
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

    window._redrawTimeout = null;
    window.debounceRedraw = function () {
      if (window._redrawTimeout) clearTimeout(window._redrawTimeout);
      window._redrawTimeout = setTimeout(redraw, 120);
    };
  }

  // ===== Build root selector =====
  function buildRootSelector() {
    const select = $('rootSelector');
    select.innerHTML = '';
    let opts = state.rootIDs.length ? state.rootIDs.slice() : [];
    if (!opts.length) {
      opts = Object.values(state.people)
        .filter(p => !p.father)
        .slice(0, 50)
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

    if (select.options.length) {
      select.selectedIndex = 0;
      state.currentRootID = select.value;
    } else {
      state.currentRootID = null;
      const sample = state.rows[0];
      if (sample) {
        showMessage('Không tìm thấy ID gốc. Tên cột trong file có thể khác. Sample columns: ' + Object.keys(sample).join(', '));
        console.warn('buildRootSelector: sample row keys =', Object.keys(sample));
      } else {
        showMessage('Không có dữ liệu. Vui lòng đảm bảo input.xlsx tồn tại trong cùng thư mục.');
      }
    }
  }

  // ===== Convert dữ liệu sang subtree =====
  function convertToSubTree(rootID, includeGirls) {
    if (!rootID || !state.people[rootID]) return null;
    const valid = new Set();
    const stack = [rootID];
    while (stack.length) {
      const id = stack.pop();
      const p = state.people[id];
      if (!p) continue;
      valid.add(id);
      const children = state.childrenMap[id] || [];
      for (const cid of children) stack.push(cid);
    }

    function buildNode(id) {
      const p = state.people[id];
      if (!p) return null;
      const node = { id: p.id, name: p.name, dinh: p.dinh, children: [] };
      const childs = state.childrenMap[id] || [];
      for (const cid of childs) {
        if (valid.has(cid)) {
          const cnode = buildNode(cid);
          if (cnode) node.children.push(cnode);
        }
      }
      return node;
    }

    return buildNode(rootID);
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
      showMessage('Không có dữ liệu cho ID gốc đã chọn. Vui lòng kiểm tra input.xlsx.');
      return;
    }
    showMessage('');
    drawTree(treeData);
  }

  function drawTree(data) {
    const NODE_W = 110, NODE_H = 80, H_SPACING = 160, V_SPACING = 200;
    const margin = { top: 40, right: 60, bottom: 120, left: 60 };

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

    const g = svg.append('g').attr('class', 'tree-layer').attr('transform', `translate(0,${20})`);

    const zoom = d3.zoom().scaleExtent([0.2, 3]).on('zoom', (event) => { g.attr('transform', event.transform); });
    svg.call(zoom);

    g.selectAll('.link').data(root.links()).join('path')
      .attr('class', 'link')
      .attr('d', d => {
        const sx = d.source.x, sy = d.source.y, tx = d.target.x, ty = d.target.y, mx = (sx + tx) / 2;
        return `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`;
      })
      .attr('fill', 'none').attr('stroke', '#777').attr('stroke-width', 2);

    const node = g.selectAll('.node').data(nodes, d => d.data.id).join('g')
      .attr('class', d => d.data.dinh === 'x' ? 'node dinh-x' : 'node dinh-thuong')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer');

    node.append('rect').attr('x', -NODE_W / 2).attr('y', -NODE_H / 2)
      .attr('width', NODE_W).attr('height', NODE_H).attr('rx', 8)
      .attr('fill', '#fff').attr('stroke', '#333');

    node.append('text').attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .style('pointer-events', 'none').style('font-size', '12px')
      .text(d => d.data.name || ('ID ' + d.data.id));

    let tooltip = document.getElementById('tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'tooltip';
      document.body.appendChild(tooltip);
    }

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
      const svgNode = svg.node();
      const svgRect = svgNode.getBoundingClientRect();
      const cx = svgRect.width / 2, cy = svgRect.height / 3;
      const x = d.x, y = d.y;
      const t = d3.zoomTransform(svgNode);
      const scale = t.k;
      const translateX = cx - x * scale;
      const translateY = cy - y * scale;
      svg.transition().duration(700).call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
    });

    window._currentDraw = { root, group: g, rows: state.rows, nodeById: Object.fromEntries(nodes.map(n => [n.data.id, n])) };

    if (typeof window.drawMotherNodes === 'function') {
      try {
        window.drawMotherNodes(root, g, state.rows, window._currentDraw.nodeById);
      } catch (err) {
        console.error('Error drawMotherNodes:', err);
      }
    }

    // Center root safely
    try {
      const rootNode = nodes.find(n => n.depth === 0) || nodes[0];
      if (rootNode) {
        const svgNode = svg.node();
        const svgRect = svgNode.getBoundingClientRect();
        const cx = svgRect.width / 2, cy = svgRect.height / 3;
        const x = rootNode.x, y = rootNode.y;
        const t = d3.zoomTransform(svgNode);
        const scale = t.k || 1;
        const translateX = cx - x * scale;
        const translateY = cy - y * scale;
        svg.call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
      }
    } catch (err) {
      console.warn('Centering root failed:', err);
    }
  }

  window._familyApp = { state, redraw };
})();
