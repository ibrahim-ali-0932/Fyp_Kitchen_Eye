// generate-tree.js
const fs = require("fs");
const path = require("path");

// Folders to ignore
const ignoreFolders = ["node_modules", ".git", "dist", "build", "venv", "__pycache__"];

function generateTree(dirPath, prefix = "") {
  const files = fs.readdirSync(dirPath).filter(f => !ignoreFolders.includes(f));
  let treeStr = "";

  files.forEach((file, index) => {
    const fullPath = path.join(dirPath, file);
    const isDir = fs.statSync(fullPath).isDirectory();
    const connector = index === files.length - 1 ? "└── " : "├── ";

    treeStr += `${prefix}${connector}${file}\n`;

    if (isDir) {
      const newPrefix = prefix + (index === files.length - 1 ? "    " : "│   ");
      treeStr += generateTree(fullPath, newPrefix);
    }
  });

  return treeStr;
}

// Generate tree starting from current folder
const treeOutput = generateTree("./");

// Save to TXT file
fs.writeFileSync("project-structure.txt", treeOutput);

console.log("✅ Project tree saved to project-structure.txt");
