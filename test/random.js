function random() {
	Math.random();
}

function randomInt(max=1000) {
	return Math.floor(Math.random() * max);
}

function randomBigInt(max=1000) {
	return ethers.getBigInt(randomInt(max));
}

function randomHex(len) {
  let output = '0x';
  for (let i = 0; i < len; ++i) {
    output += (randomInt(16)).toString(16);
  }
  return output;
}

function randomAddress() {
  return randomHex(40);
}

module.exports = { random, randomInt, randomBigInt, randomHex, randomAddress }
