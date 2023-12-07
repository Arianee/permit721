import { execSync } from 'child_process';
import { globSync as glob } from 'glob';
import fs from 'fs';
import path from 'path';

function exec(cmd: string) {
  execSync(cmd, { stdio: 'inherit' });
}

async function main() {
  const force = process.argv.includes('--force');

  if (fs.existsSync('./build')) {
    if (!force) {
      console.info('Build folder exists. Use --force to force build.');
      exec('npx hardhat compile');
      process.exit(0);
    } else {
      exec('rm -r build');
    }
  }

  exec('npx hardhat compile --force');

  exec('mkdir build');
  exec('cp -r contracts build/solidity');

  exec('cp -r artifacts/contracts build/abi');

  const contractAbiFiles = glob('build/abi/**/*.json').filter((file) => !file.includes('dbg'));
  for (const contractAbiFile of contractAbiFiles) {
    const newPath = contractAbiFile.replace(/\/[^/]*\.sol\//g, '/');
    exec(`mv ${contractAbiFile} ${newPath}`);
  }

  const removeSolDirRec = (dir: string) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.endsWith('.sol')) {
          exec(`rm -r ${entryPath}`);
        } else {
          removeSolDirRec(entryPath);
        }
      }
    });
  };

  removeSolDirRec('./build/abi');

  const contractMetaFiles = glob('build/abi/**/*.json');
  for (const contractMetaFile of contractMetaFiles) {
    const contractMeta = JSON.parse(fs.readFileSync(contractMetaFile, 'utf8'));
    if (!contractMeta.abi || (contractMeta.abi as any[]).length === 0) {
      fs.rmSync(contractMetaFile);
    } else {
      fs.writeFileSync(contractMetaFile, JSON.stringify(contractMeta.abi, null, 2));
    }
  }

  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { private: _private, scripts, devDependencies, config, ...packageJsonRest } = packageJson;
  packageJsonRest.main = 'index.js';
  fs.writeFileSync('./build/package.json', JSON.stringify(packageJsonRest, null, 2));

  exec('cp ./README.md build/README.md');

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
