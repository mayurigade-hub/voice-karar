import { spawn } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const services = [
  ['backend', ['--prefix', 'backend', 'run', 'dev']],
  ['ai-agent', ['--prefix', 'ai-agent', 'run', 'dev']],
  ['frontend', ['--prefix', 'frontend', 'run', 'dev']],
];

const children = services.map(([name, args]) => {
  const child = spawn(npm, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      FORCE_COLOR: '1',
    },
    shell: true,
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
      shutdown(code);
    }
  });

  return child;
});

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
