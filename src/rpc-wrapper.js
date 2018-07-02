export default function addMethods(worker) {
	return new Promise((resolve) => {
		let c = 0;
		let callbacks = {};
		worker.addEventListener('message', (e) => {
			let d = e.data;
			if (d.type!=='RPC') return;
			if (d.id) {
				let f = callbacks[d.id];
				if (f) {
					delete callbacks[d.id];
					if (d.error) {
						f[1](Object.assign(Error(d.error.message), d.error));
					}
					else {
						f[0](d.result);
					}
				}
			}
			else if (d.method === '__register_methods__') {
				let proxy = {}
				console.log(d.params.methods);
				d.params.methods.forEach( method => {
					proxy[method] = (...params) => new Promise( (a, b) => {
						let id = ++c;
						callbacks[id] = [a, b];
						worker.postMessage({ type: 'RPC', id, method, params });
					});
				});
				resolve(proxy);
			}
		});
	});
}
