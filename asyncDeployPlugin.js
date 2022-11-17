const fs = require('fs');
const path = require('path');

class AsyncDeployPlugin {
    apply(compiler) {
        compiler.hooks.emit.tapPromise('AsyncDeployPlugin', () => {
            return new Promise((resolve) => {
                const indexHtml = fs.readFileSync('./public/template.html', 'utf-8');

                const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

                const replacements = [
                    // version
                    [new RegExp('%version%', 'g'), pkg.version],
                ];

                fs.writeFileSync(
                    'build/index.html',
                    replacements.reduce((finalHtml, replacement) => finalHtml.replace(...replacement), indexHtml)
                );

                resolve();
                // throw new Error('Checking if build script works.');
            });
        });
    }
}

module.exports = AsyncDeployPlugin;
