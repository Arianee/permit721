import { execSync } from 'child_process';
import fs from 'fs';

function exec(cmd: string) {
  execSync(cmd, { stdio: 'inherit' });
}

async function main() {
  if (fs.existsSync('./tmpSrc')) {
    exec('rm -r ./tmpSrc');
  }

  exec('mkdir tmpSrc');
  fs.writeFileSync('./tmpSrc/index.ts', `// @ts-ignore\nexport * from './typechain-ethers6'`);
  exec('tsc --p ./tsconfig.publish.json');
  exec('rm -r ./tmpSrc');
  exec('mv -v ./build/tmpSrc/* ./build');
  exec('rm -r ./build/tmpSrc');
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
