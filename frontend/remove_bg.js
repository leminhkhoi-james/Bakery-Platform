import { Jimp } from "jimp";

async function processImage() {
  try {
    const image = await Jimp.read('public/cat-logo.png');
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    // 1. Erase all cream-like background colors globally.
    // Cream is roughly (255, 248, 234)
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const c = image.getPixelColor(x, y);
        const r = (c >> 24) & 255;
        const g = (c >> 16) & 255;
        const b = (c >> 8) & 255;
        
        // Background has radiating lines, some are purely cream, some have a slightly darker tone
        // Distance to pure white (255,255,255) is important to protect the face.
        // White to Cream distance is ~15.
        // Let's use a very careful distance metric.
        
        // If it's very close to cream:
        const distCream = Math.sqrt(Math.pow(r - 255, 2) + Math.pow(g - 248, 2) + Math.pow(b - 234, 2));
        
        // We also want to erase the grayish/yellowish artifacts from jpeg compression in the background
        const distWhite = Math.sqrt(Math.pow(r - 255, 2) + Math.pow(g - 255, 2) + Math.pow(b - 255, 2));
        
        // If it's closer to cream than white, and not part of the dark cat outline
        // The cat has white face (distWhite ~ 0), yellow cape (~255, 228, 166), red outline
        // We will erase anything where distCream < 20, but protect distWhite < 5
        if (distCream < 25 && distWhite > 10) {
            image.setPixelColor(0x00000000, x, y);
        }
      }
    }

    // 2. Erase the strict borders (first 2 and last 2 rows/cols) because they often have red snip tool borders
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < 2; y++) {
            image.setPixelColor(0x00000000, x, y);
            image.setPixelColor(0x00000000, x, height - 1 - y);
        }
    }
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < 2; x++) {
            image.setPixelColor(0x00000000, x, y);
            image.setPixelColor(0x00000000, width - 1 - x, y);
        }
    }

    // 3. To remove radiating red lines from the background without removing the cat:
    // We can use a flood fill from the edges to erase ANY red pixels that touch the edge,
    // assuming the radiating lines touch the edge and the cat is in the middle.
    const visited = new Array(width * height).fill(false);
    const queue = [];
    for (let i = 0; i < width; i++) {
        queue.push([i, 0]);
        queue.push([i, height - 1]);
    }
    for (let j = 0; j < height; j++) {
        queue.push([0, j]);
        queue.push([width - 1, j]);
    }
    
    while (queue.length > 0) {
      const [x, y] = queue.shift();
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      
      const idx = y * width + x;
      if (visited[idx]) continue;
      visited[idx] = true;

      const c = image.getPixelColor(x, y);
      const a = c & 255;
      
      // If it's already transparent, we can pass through it to find floating red lines!
      if (a === 0) {
          queue.push([x - 1, y]);
          queue.push([x + 1, y]);
          queue.push([x, y - 1]);
          queue.push([x, y + 1]);
          continue;
      }
      
      // If it's not transparent, it's some color. 
      // If it's a red radiating line, we want to erase it.
      // But wait! If the cat outline touches the transparent background, the flood fill will erase the cat!
      // So we shouldn't do this unless we're sure the cat doesn't touch the edge.
      // Let's skip step 3 to be safe and just rely on the cream removal + border removal.
    }

    await image.write('public/cat-logo-transparent.png');
    console.log("Done");
  } catch(e) {
    console.error(e);
  }
}

processImage();
