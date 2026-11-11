import fs from 'node:fs';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!/^[a-f0-9]{32}$/i.test(accountId || '') || !token) throw new Error('Cloudflare account ID or API token is missing/invalid.');
const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/formater-ksef`, {
  headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000)
});
const payload = await response.json();
if (!response.ok || !payload.success) throw new Error(`Cannot read Cloudflare Pages project (HTTP ${response.status}). Check token permissions and account ID.`);
const project = payload.result;
if (project?.name !== 'formater-ksef' || project.subdomain !== 'formater-ksef.pages.dev') {
  throw new Error('Project does not match the existing formater-ksef.pages.dev application.');
}
const branch = project.production_branch;
if (typeof branch !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(branch)) {
  throw new Error('Unsupported or missing production branch in Cloudflare project.');
}
if (!process.env.GITHUB_OUTPUT) throw new Error('GitHub Actions output file is missing.');
fs.appendFileSync(process.env.GITHUB_OUTPUT, `branch=${branch}\n`);
console.log(`Verified project ${project.subdomain}; using its existing production branch: ${branch}`);
