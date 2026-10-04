const test = require('node:test');
const assert = require('node:assert/strict');
const { requestedItems, nextOrderStatus } = require(process.env.RULES_BUILD + '/order-rules.js');
const { parseCoordinates } = require(process.env.RULES_BUILD + '/map-coordinates.js');

test('different specifications remain separate while duplicate lines are combined', () => {
  const result = requestedItems([{id:'a::red',spec:'颜色：红',quantity:2},{id:'a::blue',spec:'颜色：蓝',quantity:3},{id:'a::red',spec:'颜色：红',quantity:1}]);
  assert.equal(result.length,2); assert.deepEqual(result.map(x=>x.quantity),[3,3]);
});
test('invalid quantities and malformed items are rejected', () => {
  for(const items of [[],[null],[{id:'a',quantity:-1}],[{id:'a',quantity:1.5}],[{id:'a',quantity:99},{id:'a',quantity:1}]]) assert.throws(()=>requestedItems(items));
});
test('unpaid orders cannot ship and cancellation cannot repeat', () => {
  assert.equal(nextOrderStatus('pending','unpaid','cancel','customer'),'cancelled');
  assert.throws(()=>nextOrderStatus('cancelled','unpaid','cancel','customer'));
  assert.throws(()=>nextOrderStatus('pending','unpaid','ship','merchant'));
  assert.throws(()=>nextOrderStatus('paid','paid','cancel','customer'));
});
test('fulfilment proceeds through the authorized roles in order', () => {
  assert.equal(nextOrderStatus('paid','paid','accept','merchant'),'processing');
  assert.equal(nextOrderStatus('processing','paid','ship','merchant'),'shipped');
  assert.equal(nextOrderStatus('shipped','paid','complete','customer'),'completed');
  assert.throws(()=>nextOrderStatus('paid','paid','ship','merchant'));
  assert.throws(()=>nextOrderStatus('shipped','paid','complete','merchant'));
});
test('a place pin takes precedence over the map camera center', () => {
  assert.deepEqual(parseCoordinates('https://www.google.com/maps/place/shop/@20,97,15z/data=!3d23.69!4d98.76'),{latitude:23.69,longitude:98.76});
  assert.deepEqual(parseCoordinates('https://www.google.com/maps?query=23.69%2C98.76'),{latitude:23.69,longitude:98.76});
  assert.equal(parseCoordinates('https://www.google.com/maps?query=99,200'),null);
});
