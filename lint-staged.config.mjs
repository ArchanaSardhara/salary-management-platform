const toPosix = (file) => file.replaceAll('\\', '/');

const stripPrefix = (files, prefix) =>
  files.map((file) => toPosix(file).replace(new RegExp(`^${prefix}/`), ''));

export default {
  'frontend/**/*.{js,jsx,mjs,ts,tsx}': (files) => {
    const relative = stripPrefix(files, 'frontend');
    return `npm --prefix frontend exec -- eslint --fix --max-warnings=0 --no-warn-ignored ${relative.join(' ')}`;
  },
  'frontend/**/*.{js,jsx,mjs,ts,tsx,json,css,md}': (files) => {
    const relative = stripPrefix(files, 'frontend');
    return `npm --prefix frontend exec -- prettier --write ${relative.join(' ')}`;
  },
  'backend/**/*.{js,ts}': (files) => {
    const relative = stripPrefix(files, 'backend');
    return `npm --prefix backend exec -- oxlint --fix ${relative.join(' ')}`;
  },
  'backend/**/*.{js,ts,json,md}': (files) => {
    const relative = stripPrefix(files, 'backend');
    return `npm --prefix backend exec -- prettier --write ${relative.join(' ')}`;
  },
  '**/.env': () => 'echo Blocked: do not commit .env files && exit 1',
  '**/.env.*': (files) => {
    const allowed = files.filter((file) =>
      toPosix(file).endsWith('.env.example'),
    );
    if (allowed.length === files.length) return [];
    return 'echo Blocked: do not commit .env files && exit 1';
  },
};
