const fs = require('fs');
const path = require('path');

class AsyncDeployPlugin {
    apply(compiler) {
        compiler.hooks.emit.tapPromise('AsyncDeployPlugin', (vars) => {
            //  console.log(vars.options.mode);

            const buildRoot = __dirname + '/build/';
            const publicRoot = __dirname + '/public/';

            return new Promise((resolve) => {
                fs.cpSync(publicRoot, buildRoot, { recursive: true, force: true });

                const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

                const version = pkg.version + '.' + new Date().getTime();

                const replacements = [
                    // version
                    [new RegExp('%version%', 'g'), version],
                ];

                fs.writeFileSync(
                    buildRoot + 'index.html',
                    replacements.reduce(
                        (content, replacement) => content.replace(...replacement),
                        fs.readFileSync(publicRoot + '/template.html', 'utf-8')
                    )
                );

                fs.writeFileSync(
                    buildRoot + 'manifest.json',
                    replacements.reduce(
                        (content, replacement) => content.replace(...replacement),
                        fs.readFileSync(publicRoot + '/manifest.json', 'utf-8')
                    )
                );

                fs.writeFileSync(
                    buildRoot + 'serviceWorker.js',
                    replacements.reduce(
                        (content, replacement) => content.replace(...replacement),
                        fs.readFileSync(publicRoot + '/serviceWorker.js', 'utf-8')
                    )
                );

                fs.rmSync(buildRoot + 'template.html');

                resolve();
            });
        });
    }
}

module.exports = AsyncDeployPlugin;
