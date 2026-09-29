// Both branches are published as one artifact; no game source is merged.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const [originalArg, previewArg, outputArg] = process.argv.slice(2);
if (!originalArg || !previewArg || !outputArg) throw new Error('Usage: node build-pages.cjs original preview output');
const original = path.resolve(originalArg), preview = path.resolve(previewArg), output = path.resolve(outputArg);
if (fs.existsSync(output)) throw new Error('Output must be a new directory: ' + output);
const files = ['index.html', 'src', 'styles', 'assets', 'previews', 'docs', 'LICENSE', 'LICENSES', 'ASSET_SOURCES.md', 'THIRD_PARTY_NOTICES.md', 'README.md', 'README_EN.md'];
function copyVersion(source, destination) {
  fs.mkdirSync(destination, {recursive: true});
  for (const file of files) fs.cpSync(path.join(source, file), path.join(destination, file), {recursive: true});
}
function sha(directory) { return execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], {encoding:'utf8'}).trim(); }
copyVersion(original, output);
copyVersion(preview, path.join(output, 'preview'));
fs.mkdirSync(path.join(output, 'versions'));
fs.copyFileSync(path.join(__dirname, 'pages-versions.html'), path.join(output, 'versions/index.html'));
fs.writeFileSync(path.join(output, '.nojekyll'), '');
fs.writeFileSync(path.join(output, 'versions.json'), JSON.stringify({
  builtAt: new Date().toISOString(),
  original: {branch:'main', commit:sha(original), path:'./'},
  preview: {branch:'feature/first-adventure-rework', commit:sha(preview), path:'./preview/'}
}, null, 2));
console.log('Packaged original at / and exploration at /preview/');
