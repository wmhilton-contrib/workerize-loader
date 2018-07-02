import './other';
import Worker from 'workerize-loader!./worker';
import inlineWorker from 'workerize-loader!./worker';

describe('worker', () => {
	it('should be thenable', () => {
		expect(typeof Worker.then).toBe('function');
	});

	it('should NOT be an instance of Worker', () => {
		expect(Worker).not.toEqual(jasmine.any(window.Worker));
	});

	if('should resolve to an Object wrapper', async () => {
		let worker = await Worker;
		expect(worker).toEqual(jasmine.any(Object));
	})

	it('worker.foo()', async () => {
		let worker = await Worker;
		expect(await worker.foo()).toBe(1);
	});

	it('worker.bar()', async () => {
		let worker = await Worker;
		let out = await worker.bar('a', 'b');
		expect(out).toEqual('a [bar:3] b');
	});

	it('worker.throwError() should pass the Error back to the application context', async () => {
		let worker = await Worker;
		try {
			await worker.throwError();
		}
		catch (e) {
			expect(e).toEqual(Error('Error in worker.js'));
		}
	});
});

describe('async/await demo', () => {
	it('remote worker', async () => {
		let start = Date.now(), elapsed;

		let worker = await Worker;
		elapsed = Date.now()-start;
		console.log(`let worker = await Worker [${elapsed}ms]`);
		expect(elapsed).toBeLessThan(300);

		let one = await worker.foo();
		elapsed = Date.now()-start;
		console.log(`await worker.foo() [${elapsed}ms]: `, one);
		expect(one).toEqual(1);
		expect(Date.now()-start).toBeLessThan(300);  // @todo why the overhead here?

		start = Date.now();
		let two = await worker.bar(1, 2);
		elapsed = Date.now()-start;
		console.log(`await worker.bar(1, 2) [${elapsed}ms]: `, two);
		expect(two).toEqual('1 [bar:3] 2');
		expect(Date.now()-start).toBeLessThan(20);
	});

	it('inline worker', async () => {
		let start = Date.now(), elapsed;

		let worker = await inlineWorker;
		elapsed = Date.now()-start;
		console.log(`let worker = await inlineWorker [${elapsed}ms]`);
		expect(elapsed).toBeLessThan(300);

		start = Date.now();
		let one = await worker.foo();
		elapsed = Date.now()-start;
		console.log(`await worker.foo() [${elapsed}ms]: `, one);
		expect(one).toEqual(1);
		expect(elapsed).toBeLessThan(20);

		start = Date.now();
		let two = await worker.bar(1, 2);
		elapsed = Date.now()-start;
		console.log(`await worker.bar(1, 2) [${elapsed}ms]: `, two);
		expect(two).toEqual('1 [bar:3] 2');
		expect(elapsed).toBeLessThan(20);
	});

});
