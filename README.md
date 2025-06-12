
### 每个 import 引入的依赖文件对应一个 module，ast 解析每个文件内的 import export 语句，收集语句生成 module 中的声明，引用链主要是通过作用域找到参数或者使用的 identifier 类型的 node，在收集到的所有 exports 中，找到对应声明语句，标记被使用，同时声明需要的引用声明们也需要标记被执行，因为会被用到，同时 tree-shaking 中尽量不要写 * 的导入，会导致因为副作用无法识别文件中导出但没有被使用的也会被打包到代码中
### 例子如下, 下面分析中
```dep1.js
// 声明 a
const a = 1;
// 声明 b 引用 a
export const b = a + 1;
// 声明 multi 引用 a，b
export const multi = function (a, b) {
  return a * b;
};
// 声明 testFunc 引用 a
export function testFunc() {
  console.log(a);
}

// 声明 default 引用 a，b
export default function (a, b) {
  return a + b;
}
```
import {b, testFunc} from './dep1.js';
import { log, c } from './dep2.js';
import testDefaultFunc from './dep3.js';

// 声明 cc，引用 b
export const cc = b;
// 声明 bb，引用 testDefaultFunc
export const bb = testDefaultFunc();
// 声明 aa，引用 testFunc
export const aa = testFunc();
// 声明 default，引用 b
export default b;
```
### 导出 aa(a) cc(b) bb(a,b) b(b) 对应的引用链可以发现 () 内为引用链，根据这个没用的全干掉
### 但是写成下面的
```js
// 这里就会打包 所有内容引用链失效
import * as dep1 from './dep1.js';
import { log, c } from './dep2.js';
import testDefaultFunc from './dep3.js';

export const cc = dep1.b;
export const bb = testDefaultFunc();
export const aa = dep1.testFunc();
export default dep1.b;


```
