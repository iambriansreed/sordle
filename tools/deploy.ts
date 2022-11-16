import * as fs from 'fs';

const indexHtml = fs.readFileSync('build/index.html', 'utf-8');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

const replacements: [searchValue: string | RegExp, replaceValue: string][] = [
    // version
    [new RegExp('%version%', 'g'), pkg.version],
];

fs.writeFileSync(
    'build/index.html',
    replacements.reduce((finalHtml, replacement) => finalHtml.replace(...replacement), indexHtml)
);

// throw new Error('Checking if build script works.');
