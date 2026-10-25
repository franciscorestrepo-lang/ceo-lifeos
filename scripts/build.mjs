import { writeFileSync } from 'node:fs';
import './validate.mjs';
writeFileSync('build-info.json',JSON.stringify({commit_sha:process.env.COMMIT_REF||null,deploy_id:process.env.DEPLOY_ID||null,built_at:new Date().toISOString()},null,2)+'\n');
console.log('Operational build metadata created');
