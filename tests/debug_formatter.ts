import { SlackFormatter } from '../src/utils/SlackFormatter.js';

const drocInput = 'Dr.Oc Mission Control | <a href="https://droc.global-desk.top">View Dashboard</a>';

console.log('--- USMM DR OC INPUT ---');
console.log(drocInput);
console.log('\n--- PARSED SLACK BLOCKS ---');
const blocks = SlackFormatter.parse(drocInput);
console.log(JSON.stringify(blocks, null, 2));
