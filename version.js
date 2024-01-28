import fs from 'node:fs';
import path from 'node:path';

const packageJson = fs.readFileSync('package.json', 'utf8');

const { version } = JSON.parse(packageJson);
const [major, minor, patches] = version.split('.');
const nextVersion = `${major}.${minor}.${parseInt(patches) + 1}`;

fs.writeFileSync('package.json', packageJson.replace(version, nextVersion));

function onFile(dir, cb) {
    fs.readdirSync(dir, { withFileTypes: true }).map((dirEnt) => {
        const res = path.resolve(dir, dirEnt.name);
        dirEnt.isDirectory() ? onFile(res, cb) : cb(res);
    });
}

onFile('dist', (filePath) =>
    fs.writeFileSync(filePath, fs.readFileSync(filePath, 'utf8').replace(/%version%/g, nextVersion))
);
