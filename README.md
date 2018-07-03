# workerize-loader - the dynamic import(), typescript-friendly edition

> A webpack loader that moves a module and its dependencies into a Web Worker, automatically reflecting exported functions as asynchronous proxies.

- Has the exact same semantics as dynamic `import()`
- If the module exports are already async functions, the signature is unchanged
- Works beautifully with async/await
- Imported value is a Promise that resolves to the worker proxy
- Currently only supports CommonJS modules that use `exports` as the export object. Will gladly accept a PR to fix it so it works with ES6 exports.


## Install

```sh
npm install -D @wmhilton/workerize-loader
```


## Usage

**expensive.worker.ts**:

```ts
// block for `time` ms, then return the number of loops we could run in that time:
export async function expensive(time: number) {
    let start = Date.now(),
        count = 0
    while (Date.now() - start < time) count++
    return count
}
```

**index.ts**: _(our demo)_

```ts
// Use dynamic import to get a Promise
const Worker = import('./expensive.worker')

Worker.then(async (worker) => {
	// Async functions send their arguments to the WebWorker and
	// resolve when the result is received.
	let count = await worker.expensive(1000)
	console.log(`Ran ${count} loops`)
})
```

## Webpack config

I recommend configuring this Webpack loader to match against specific filenames.
This will enable you to simply name your files a certain way, say ending with `.worker.ts`.
Test environments like Jest that don't have WebWorkers (but do support dynamic `import()` via Babel) will be able to run the same code without any extra hacks or mocks.

```js
module: {
	rules: [
		{
			test: /\.worker\.(ts|js)$/,
			loader: require.resolve('@wmhilton/workerize-loader')
		}
	]
}

```

## Credit

This is a fork of [workerize-loader](https://github.com/developit/workerize-loader)


## License

[MIT License](https://oss.ninja/mit/developit) © [Jason Miller](https://jasonformat.com)
