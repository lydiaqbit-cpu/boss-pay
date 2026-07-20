const ci = require('miniprogram-ci')
const path = require('path')

const project = new ci.Project({
  appid: 'wx04ecb4a549d16e64',
  type: 'miniProgram',
  projectPath: path.resolve(__dirname, 'frontend/dist/build/mp-weixin'),
  privateKeyPath: '/Users/lydia/Downloads/private.wx04ecb4a549d16e64.key',
  ignores: ['node_modules/**/*'],
})

async function main() {
  await ci.upload({
    project,
    version: '1.3.2',
    desc: '修复未登录游客可浏览首页，跳过登录不退出',
    onProgressUpdate: console.log,
    setting: { es6: true, minify: true },
  })
  console.log('✅ 上传成功！版本 1.3.0')
}

main().catch(err => { console.error('❌ 上传失败:', err.message || err); process.exit(1) })
