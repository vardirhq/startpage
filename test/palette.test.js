// Run with: node --test
const { test } = require('node:test');
const assert = require('node:assert/strict');

global.window = {};
require('../js/palette.js');
const { calc, convert } = window.SP.palette;

test('arithmetic and precedence', () => {
  assert.equal(calc('2+3*4'), 14);
  assert.equal(calc('(2+3)*4'), 20);
  assert.equal(calc('2^3^2'), 512); // right-associative
  assert.equal(calc('-2^2'), -4);
  assert.equal(calc('2^-1'), 0.5);
  assert.equal(calc('10 % 4'), 2);
  assert.equal(calc('7 / 2'), 3.5);
});
test('functions, constants, implicit multiplication, factorial', () => {
  assert.equal(calc('sqrt(16)'), 4);
  assert.ok(Math.abs(calc('2pi') - 2 * Math.PI) < 1e-12);
  assert.equal(calc('3(4+1)'), 15);
  assert.equal(calc('5!'), 120);
  assert.equal(calc('round(2.6)'), 3);
});
test('comma decimals and unicode operators', () => {
  assert.equal(calc('1,5*2'), 3);
  assert.equal(calc('6×7'), 42);
  assert.equal(calc('9÷3'), 3);
});
test('rejects junk and anything that is not math', () => {
  for (const s of ['', '2+', 'alert(1)', 'constructor', '2**', '1/0', 'foo(2)', '(2', 'sqrt 4', '3!!!!!!!!!!!!!!']) assert.equal(calc(s), null, s);
});
test('unit conversion', () => {
  assert.equal(convert('5 km to mi').text, '3.1068560 mi'.replace('3.1068560', String(parseFloat((5000 / 1609.344).toPrecision(8)))));
  assert.equal(convert('100 c to f').value, 212);
  assert.ok(Math.abs(convert('32 f in c').value) < 1e-9);
  assert.equal(convert('1 gib to mib').value, 1024);
  assert.equal(convert('10 kg to km'), null); // incompatible units
  assert.equal(convert('hello world'), null);
});
