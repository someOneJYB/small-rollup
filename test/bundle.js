const a$1 = 1;

const b$1 = a$1 + 1;

function testFunc() {
  console.log(a$1);
}

let test = 90
function testDefaultFunc () {
  console.log(test);
}
export const cc = b$1;
export const bb = testDefaultFunc();
export const aa = testFunc();

export default b$1;