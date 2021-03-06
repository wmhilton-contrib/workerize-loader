/* global __webpack_exports__ */

function workerSetup() {
	addEventListener('message', (e) => {
		let { type, method, id, params } = e.data, f, p;
		if (type==='RPC' && method) {
			if ((f = exports[method])) {
				p = Promise.resolve().then( () => f.apply(exports, params) );
			}
			else {
				p = Promise.reject('No such method');
			}
			p.then(result => {
					postMessage({ type: 'RPC', id, result });
				})
				.catch(e => {
					let error = { message: e};
					if (e.stack) {
						error.message = e.message;
						error.stack = e.stack;
						error.name = e.name;
					}
					postMessage({ type: 'RPC', id, error });
				});
		}
	});
	postMessage({
		type: 'RPC', method: '__register_methods__', params: {
			methods: Object.keys(exports)
		}
	});
	postMessage({ type: 'RPC', method: 'ready' });
}

const workerScript = '\n' + Function.prototype.toString.call(workerSetup).replace(/(^.*\{|\}.*$|\n\s*)/g, '');

export default function rpcWorkerLoader(content) {
	return content + workerScript;
}
