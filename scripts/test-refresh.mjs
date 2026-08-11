import assert from 'node:assert/strict';
import { sourceCounts,normalizeSourceHealth,missingSources,validateAnalysis,validateCurrentSnapshot } from '../netlify/functions/lib/refresh-core.mjs';

const microsoft={inbox:[{}],sent:[{}],flagged:[{}],events:[{}],chatMessages:[{}],health:{mail:'ok',flagged:'ok',calendar:'ok',teams:'ok'}};
const read={meetings:[{}]};
assert.deepEqual(sourceCounts(microsoft,read),{inbox:1,sent:1,flagged:1,events:1,teams:1,read:1});
const health=normalizeSourceHealth(microsoft,'ok');
assert.deepEqual(missingSources(health),[]);
assert.deepEqual(missingSources({...health,teams:'Graph 403'}),['teams']);

const analysis={
  meta:{period:'2026-W33'},
  critical_outcomes:[{title:'x'}],decisions:[{decision:'x'}],my_actions:[{action:'x'}],
  delegated_actions:[],calendar_proposals:[],email_proposals:[],risks:[],flagged:[],source_health:health
};
assert.equal(validateAnalysis(analysis),true);
assert.equal(validateCurrentSnapshot(analysis),true);
assert.equal(validateCurrentSnapshot({...analysis,decisions:[]}),false);
assert.throws(()=>validateAnalysis({...analysis,my_actions:[]}),/my_actions is empty/);
console.log('CEO LifeOS refresh contract tests OK');
