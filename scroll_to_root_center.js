// Sau khi vẽ cây xong, cuộn ngang sao cho node gốc nằm giữa màn hình
setTimeout(() => {
  const container = document.getElementById("tree-container");
  const svg = container.querySelector("svg");
  if (!svg) return;

  // Tìm gốc cây
  const rootNode = d3.select(".node").datum();  // node đầu tiên là gốc
  const transform = d3.zoomTransform(svg);
  const gTransform = d3.select("g").attr("transform");

  // Lấy translateX hiện tại từ chuỗi transform
  const txMatch = /translate\(([^,]+),/.exec(gTransform);
  const translateX = txMatch ? parseFloat(txMatch[1]) : 0;

  const centerX = rootNode.x + translateX;
  const scrollX = centerX - container.clientWidth / 2;

  container.scrollLeft = scrollX;
}, 50);