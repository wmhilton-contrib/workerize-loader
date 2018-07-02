import path from 'path';
import loaderUtils from 'loader-utils';

import NodeTargetPlugin from 'webpack/lib/node/NodeTargetPlugin';
import SingleEntryPlugin from 'webpack/lib/SingleEntryPlugin';
import WebWorkerTemplatePlugin from 'webpack/lib/webworker/WebWorkerTemplatePlugin';

export default function loader() {}

const CACHE = {};

loader.pitch = function(request) {
	this.cacheable(false);

	const options = loaderUtils.getOptions(this) || {};

	const cb = this.async();

	const filename = loaderUtils.interpolateName(this, `${options.name || '[hash]'}.worker.js`, {
		context: options.context || this.rootContext || this.options.context,
		regExp: options.regExp
	});

	const worker = {};

	worker.options = {
		filename,
		chunkFilename: `[id].${filename}`,
		namedChunkFilename: null
	};

	worker.compiler = this._compilation.createChildCompiler('worker', worker.options);

	worker.compiler.apply(new WebWorkerTemplatePlugin(worker.options));

	if (this.target!=='webworker' && this.target!=='web') {
		worker.compiler.apply(new NodeTargetPlugin());
	}

	worker.compiler.apply(new SingleEntryPlugin(this.context, `!!${path.resolve(__dirname, 'rpc-worker-loader.js')}!${request}`, 'main'));

	const subCache = `subcache ${__dirname} ${request}`;

	worker.compiler.plugin('compilation', (compilation, data) => {
		if (compilation.cache) {
			if (!compilation.cache[subCache]) compilation.cache[subCache] = {};

			compilation.cache = compilation.cache[subCache];
		}

		data.normalModuleFactory.plugin('parser', (parser, options) => {
			parser.plugin('export declaration', expr => {
				let decl = expr.declaration || expr,
					{ compilation, current } = parser.state,
					entry = compilation.entries[0].resource;

				// only process entry exports
				if (current.resource!==entry) return;

				let exports = compilation.__workerizeExports || (compilation.__workerizeExports = {});

				if (decl.id) {
					exports[decl.id.name] = true;
				}
				else if (decl.declarations) {
					for (let i=0; i<decl.declarations.length; i++) {
						exports[decl.declarations[i].id.name] = true;
					}
				}
				else {
					console.warn('[workerize] unknown export declaration: ', expr);
				}
			});
		});
	});

	worker.compiler.runAsChild((err, entries, compilation) => {
		if (err) return cb(err);

		if (entries[0]) {
			worker.file = entries[0].files[0];

			let contents = compilation.assets[worker.file].source();
			let exports = Object.keys(CACHE[worker.file] = compilation.__workerizeExports || CACHE[worker.file] || {});

			// console.log('Workerized exports: ', exports.join(', '));

			if (options.inline) {
				worker.url = `URL.createObjectURL(new Blob([${JSON.stringify(contents)}]))`;
			}
			else {
				worker.url = `__webpack_public_path__ + ${JSON.stringify(worker.file)}`;
			}

			if (options.fallback === false) {
				delete this._compilation.assets[worker.file];
			}

			return cb(null, `
				var addMethods = require(${loaderUtils.stringifyRequest(this, path.resolve(__dirname, 'rpc-wrapper.js'))})
				var w = new Worker(${worker.url}, { name: ${JSON.stringify(filename)} })
				module.exports = addMethods(w)
			`);
		}

		return cb(null, null);
	});
};
