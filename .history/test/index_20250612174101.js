import {b, testFunc} from './dep1.js';
import { log, c } from './dep2.js';
import testDefaultFunc from './dep3.js';

export const cc = b;
export const bb = testDefaultFunc();
export const aa = testFunc();

export default b;
