import test from 'node:test';
import assert from 'node:assert/strict';
import domains from '../packages/config/domains.mjs';

const custom = { SITE_URL: 'https://www.brand.example', CMS_URL: 'https://admin.brand.example',
  SITE_ALIAS_URL: 'https://brand.example', NODE_ENV: 'production' };

test('部署必须明确填写主站，不回退品牌域名；本机预览与测试环境可离线使用', () => {
  const local = domains.resolveDomains({});
  assert.equal(local.site, 'http://localhost:44321');
  assert.equal(local.cms, 'http://localhost:44301');
  assert.equal(local.environment, 'testing');
  assert.throws(() => domains.resolveDomains({}, { production: true }), /SITE_URL/);
  assert.throws(() => domains.resolveDomains({ SITE_ENVIRONMENT: 'production' }), /SITE_URL/);
  assert.throws(() => domains.siteUrl({ STRICT_CONTENT_BUILD: '1' }), /SITE_URL/);
  assert.throws(() => domains.siteUrl({ SITE_URL: 'http://brand.example', SITE_ENVIRONMENT: 'production' }), /HTTPS/);
  assert.ok(!domains.resolveDomains(custom).allowedOrigins.some((url) => url.includes('localhost')));
  assert.ok(domains.resolveDomains({}).allowedOrigins.includes('http://localhost:44321'));
  assert.equal(domains.resolveDomains({ PAYLOAD_PUBLIC_SERVER_URL: 'https://old-cms.example/' }).cms, 'https://old-cms.example');
});

test('自定义域名精确白名单不残留旧主域；额外来源去重，不默认信任 CDN', () => {
  const result = domains.resolveDomains({ ...custom, MEDIA_URL: 'https://media.brand.example',
    PAYLOAD_ALLOWED_ORIGINS: 'https://partner.example, https://www.brand.example' }, { production: true });
  assert.deepEqual(result.allowedOrigins, [custom.SITE_URL, custom.CMS_URL, custom.SITE_ALIAS_URL, 'https://partner.example']);
  assert.equal(result.media, 'https://media.brand.example');
  assert.equal(domains.resolveDomains(custom).media, custom.CMS_URL);
  assert.equal(domains.siteUrl({ SITE_URL: custom.SITE_URL + '/' }), custom.SITE_URL);
});

test('拒绝非法来源、部署路径、通配符及 Caddy 配置注入，不回显秘密', () => {
  const invalid = ['ftp://brand.example', 'brand.example', 'https://user:password@brand.example',
    'https://brand.example/path', 'https://brand.example/?token=secret', 'https://brand.example/#x',
    'https://*.brand.example', 'https://brand.example\nrespond hacked', 'https://brand.example\\evil',
    'https://brand.example{uri}', 'https://brand.example,evil.example'];
  for (const SITE_URL of invalid) {
    assert.throws(() => domains.resolveDomains({ ...custom, SITE_URL }), (error) =>
      error.message.includes('SITE_URL') && !error.message.includes('secret') && !error.message.includes('password'));
  }
  for (const key of ['CMS_URL', 'SITE_ALIAS_URL', 'MEDIA_URL', 'PAYLOAD_ALLOWED_ORIGINS']) {
    assert.throws(() => domains.resolveDomains({ ...custom, [key]: 'https://bad.example/path' }));
  }
});

test('生产校验拒绝 HTTP、末尾斜杠和别名冲突，允许后台同域及无别名', () => {
  for (const key of ['SITE_URL', 'CMS_URL', 'SITE_ALIAS_URL', 'MEDIA_URL', 'PAYLOAD_ALLOWED_ORIGINS']) {
    assert.throws(() => domains.resolveDomains({ ...custom, [key]: 'http://brand.example' }, { production: true }));
  }
  assert.throws(() => domains.resolveDomains({ ...custom, SITE_URL: custom.SITE_URL + '/' }, { production: true }));
  const shared = domains.resolveDomains({ ...custom, CMS_URL: '', SITE_ALIAS_URL: '' }, { production: true });
  assert.equal(shared.cms, custom.SITE_URL);
  assert.equal(shared.alias, '');
  assert.deepEqual(shared.allowedOrigins, [custom.SITE_URL]);
  assert.equal(domains.resolveDomains({ ...custom, CMS_URL: custom.SITE_URL }).cms, custom.SITE_URL);
  assert.throws(() => domains.resolveDomains({ ...custom, SITE_ALIAS_URL: custom.SITE_URL }));
  assert.throws(() => domains.resolveDomains({ ...custom, SITE_ALIAS_URL: custom.CMS_URL }));
  assert.throws(() => domains.resolveDomains({ ...custom, SITE_ENVIRONMENT: 'unknown' }), /SITE_ENVIRONMENT/);
});
