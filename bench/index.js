const { join } = require('node:path');
const { Suite } = require('benchmark');
const { klona } = require('klona/lite');

console.log('Load times:');

console.time('assert');
const { deepStrictEqual } = require('node:assert');
console.timeEnd('assert');

console.time('util');
const { isDeepStrictEqual } = require('node:util');
console.timeEnd('util');

console.time('fast-deep-equal');
const fastdeep = require('fast-deep-equal');
console.timeEnd('fast-deep-equal');

console.time('fast-equals/deepEqual');
const { deepEqual } = require('fast-equals');
console.timeEnd('fast-equals/deepEqual');

console.time('fast-equals/strictDeepEqual');
const { strictDeepEqual } = require('fast-equals');
console.timeEnd('fast-equals/strictDeepEqual');

console.time('lodash/isequal');
const lodash = require('lodash/isequal');
console.timeEnd('lodash/isequal');

console.time('nano-equal');
const nanoequal = require('nano-equal');
console.timeEnd('nano-equal');

console.time('dequal');
const { dequal } = require('../src/index.js');
console.timeEnd('dequal');

console.time('dequal/lite');
const lite = require('../src/lite.js');
console.timeEnd('dequal/lite');

console.time('customDeepEqual');
const { deepEqual: customDeepEqual } = require('../custom.js');
console.timeEnd('customDeepEqual');

function naiive(a, b) {
	try {
		deepStrictEqual(a, b);
		return true;
	} catch (err) {
		return false;
	}
}

// @ts-ignore
const assert = (foo, bar, msg='') => deepStrictEqual(foo, bar, msg);

function runner(name, contenders) {
	const file = join(__dirname, 'fixtures', name + '.js');
	const fixture = require(file);

	console.log('\n(%s) Validation: ', name);
	Object.keys(contenders).forEach(name => {
		const func = contenders[name];
		const { foo, bar } = klona(fixture);

		try {
			assert(func(1, 1), true, 'equal numbers');
			assert(func(1, 2), false, 'not equal numbers');
			assert(func(1, [1]), false, 'number vs array');
			assert(func(0, null), false, 'number vs null');
			assert(func(0, undefined), false, 'number vs undefined');

			assert(func(foo, bar), true, 'kitchen sink');
			console.log('  ✔', name);
		} catch (err) {
			console.log('  ✘', name, `(FAILED @ "${err.message}")`);
		}
	});

	console.log('\n(%s) Benchmark: ', name);
	const bench = new Suite().on('cycle', e => {
		console.log('  ' + e.target);
	});

	Object.keys(contenders).forEach(name => {
		const { foo, bar } = klona(fixture);
		bench.add(name/* + ' '.repeat(22 - name.length)*/, () => {
			// contenders[name]({ a: 1, b: 2, c: 3 }, { a: 1, b: 4, c: 3 });
			contenders[name](foo, bar);
		})
	});

	bench.run();
}

runner('basic', {
	'assert.deepStrictEqual': naiive,
	'util.isDeepStrictEqual': isDeepStrictEqual,
	'fast-deep-equal': fastdeep,
	'fast-equals/deepEqual': deepEqual,
	'fast-equals/strictDeepEqual': strictDeepEqual,
	'lodash.isEqual': lodash,
	'nano-equal': nanoequal,
	'dequal/lite': lite.dequal,
	'dequal': dequal,
	'customDeepEqual': customDeepEqual,
});

// Only keep those that pass
runner('complex', {
	'assert.deepStrictEqual': naiive,
	'util.isDeepStrictEqual': isDeepStrictEqual,
	'fast-equals/deepEqual': deepEqual,
	'fast-equals/strictDeepEqual': strictDeepEqual,
	'lodash.isEqual': lodash,
	'dequal': dequal,
	'customDeepEqual': customDeepEqual,
});
