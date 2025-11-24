const fs = require("fs");
const path = require("path");

// Incrementar versão patch
const versionPath = path.join(__dirname, "../src/lib/version.ts");

// Ler versão atual ou criar nova
let currentVersion = "1.0.0";
try {
  const content = fs.readFileSync(versionPath, "utf8");
  const match = content.match(/APP_VERSION = "(\d+\.\d+\.\d+)"/);
  if (match) {
    currentVersion = match[1];
  }
} catch (e) {
  // Arquivo não existe, usar versão inicial
}

// Incrementar patch
const parts = currentVersion.split(".");
parts[2] = (parseInt(parts[2]) + 1).toString();
const newVersion = parts.join(".");

// Data atual
const buildDate = new Date().toISOString().split("T")[0];

// Escrever novo arquivo
const content = `// Versão do sistema - atualizada automaticamente
export const APP_VERSION = "${newVersion}";
export const BUILD_DATE = "${buildDate}";
`;

fs.writeFileSync(versionPath, content);
console.log(`Version updated: ${currentVersion} -> ${newVersion}`);

