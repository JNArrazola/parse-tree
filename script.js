document.getElementById('inputForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const startSymbol = document.getElementById('startSymbol').value.trim();
    const terminals = document.getElementById('terminals').value.split(',').map(t => t.trim());
    const nonTerminals = document.getElementById('nonTerminals').value.split(',').map(nt => nt.trim());
    const rules = parseRules(document.getElementById('rules').value.trim());
    const inputString = document.getElementById('inputString').value.trim();
  
    generateTree(startSymbol, terminals, nonTerminals, rules, inputString);
  });
  
  function parseRules(rulesText) {
    const rules = {};
    const lines = rulesText.split('\n');
    for (const line of lines) {
      const [left, right] = line.split('->').map(s => s.trim());
      if (!rules[left]) rules[left] = [];
      rules[left].push(...right.split('|').map(r => r.trim()));
    }
    return rules;
  }
  
  function generateTree(startSymbol, terminals, nonTerminals, rules, inputString) {
    const queue = [{ node: startSymbol, path: [startSymbol] }];
    const treeData = { name: startSymbol, children: [] };
    const nodesMap = { [startSymbol]: treeData };
    const sequences = [];
    let successPath = null;
  
    while (queue.length > 0) {
      const { node, path } = queue.shift();
  
      if (node.length > inputString.length) continue;
  
      let isCompatible = true;
      for (let i = 0; i < node.length; i++) {
        if (terminals.includes(node[i]) && node[i] !== inputString[i]) {
          isCompatible = false;
          break;
        }
      }
      if (!isCompatible) continue;
  
      if (node === inputString) {
        successPath = path;
        sequences.push({ path, success: true });
        continue;
      }
  
      sequences.push({ path, success: false });
  
      let isTerminalOnly = true;
      const generatedChildren = new Set(); 
      for (let i = 0; i < node.length; i++) {
        if (nonTerminals.includes(node[i])) {
          isTerminalOnly = false;
          const expansions = rules[node[i]] || [];
          for (const expansion of expansions) {
            const newNode = node.slice(0, i) + expansion + node.slice(i + 1);
  
            if (generatedChildren.has(newNode)) continue;
  
            generatedChildren.add(newNode);
            const child = { name: newNode, children: [] };
            nodesMap[node].children.push(child);
            nodesMap[newNode] = child;
            queue.push({ node: newNode, path: [...path, newNode] });
          }
          break;
        }
      }
  
      if (isTerminalOnly && node !== inputString) continue;
    }
  
    drawTree(treeData, successPath);
    displaySequences(sequences);
  }
  
  function drawTree(data, successPath) {
    const treeContainer = document.getElementById('tree-container');
    const containerWidth = treeContainer.clientWidth;
    const height = calculateTreeHeight(data) * 150; 
    const width = calculateTreeWidth(data) * 200; 
  
    const treeLayout = d3.tree().size([width, height - 100]);
    const root = d3.hierarchy(data);
    treeLayout(root);
  
    d3.select('#tree').selectAll('*').remove();
    const svg = d3.select('#tree').append('svg')
      .attr('width', width)
      .attr('height', height);
  
    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, 50)`); 
  
    g.selectAll('.link')
      .data(root.links())
      .enter().append('line')
      .attr('class', 'link')
      .attr('x1', d => d.source.x - width / 2)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x - width / 2)
      .attr('y2', d => d.target.y)
      .attr('stroke', '#aaa');
  
    const node = g.selectAll('.node')
      .data(root.descendants())
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x - width / 2},${d.y})`);
  
    node.append('circle')
      .attr('r', 30) 
      .attr('fill', d => successPath && successPath.includes(d.data.name) ? 'yellow' : 'lightblue')
      .on('click', (event, d) => showFullContent(d.data.name)); // Mostrar contenido completo al hacer clic
  
    node.append('text')
      .text(d => truncateText(d.data.name, 10)) 
      .attr('dy', 4)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px'); 
  }
  
  function truncateText(text, maxLength) {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  }
  
  function showFullContent(fullText) {
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-button">&times;</span>
        <p>${fullText}</p>
      </div>
    `;
    document.body.appendChild(modal);
  
    modal.querySelector('.close-button').addEventListener('click', () => modal.remove());
  
    modal.addEventListener('click', (event) => {
      if (event.target === modal) modal.remove();
    });
  }
  
  
  function calculateTreeHeight(data) {
    let maxDepth = 0;
    function traverse(node, depth) {
      maxDepth = Math.max(maxDepth, depth);
      if (node.children) {
        node.children.forEach(child => traverse(child, depth + 1));
      }
    }
    traverse(data, 0);
    return maxDepth + 1;
  }
  
  function calculateTreeWidth(data) {
    let maxWidth = 1;
    function traverse(node, depth) {
      if (!node.children || node.children.length === 0) return;
      maxWidth = Math.max(maxWidth, node.children.length);
      node.children.forEach(child => traverse(child, depth + 1));
    }
    traverse(data, 0);
    return maxWidth;
  }
  
  function displaySequences(sequences) {
    const sequencesDiv = document.getElementById('sequences');
    sequencesDiv.innerHTML = sequences.map(seq => 
      `<div style="color: ${seq.success ? 'green' : 'black'}">${seq.path.join(' -> ')}</div>`).join('');
  }
  