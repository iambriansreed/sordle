const fs = require('fs');
const path = require('path');

class AsyncDeployPlugin {
    apply(compiler) {
        compiler.hooks.emit.tapPromise('AsyncDeployPlugin', () => {
            const buildRoot = __dirname + '/build/';
            const publicRoot = __dirname + '/public/';

            return new Promise((resolve) => {
                fs.cpSync(publicRoot, buildRoot, { recursive: true, force: true });

                const indexHtml = fs.readFileSync(publicRoot + '/template.html', 'utf-8');

                const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

                const replacements = [
                    // version
                    [new RegExp('%version%', 'g'), pkg.version],
                ];

                fs.writeFileSync(
                    buildRoot + 'index.html',
                    replacements.reduce((finalHtml, replacement) => finalHtml.replace(...replacement), indexHtml)
                );

                fs.rmSync(buildRoot + 'template.html');

                resolve();
            });
        });
    }
}

module.exports = AsyncDeployPlugin;
