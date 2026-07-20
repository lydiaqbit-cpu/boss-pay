<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";

onLaunch(() => {
  // #ifdef MP-WEIXIN
  wx.onNeedPrivacyAuthorization((resolve) => {
    uni.showModal({
      title: '隐私授权',
      content: '使用前需要您授权，我们承诺仅用于核心功能，不会对外分享您的信息。',
      confirmText: '同意',
      cancelText: '拒绝',
      success: (res) => {
        if (res.confirm) {
          resolve({ buttonId: 'agree-btn', event: 'agree' })
        } else {
          resolve({ buttonId: 'disagree-btn', event: 'disagree' })
        }
      }
    })
  })
  // #endif
});
onShow(() => {});
onHide(() => {});
</script>

<style lang="scss">
/* ── 全局重置 ── */
/* #ifdef H5 */
page, body, * {
  font-family: 'LXGW WenKai Screen', 'Noto Sans SC', 'PingFang SC', -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}
/* #endif */
/* #ifndef H5 */
page, view, text, input, button, image, scroll-view, swiper, textarea {
  font-family: 'Noto Sans SC', 'PingFang SC', 'HarmonyOS Sans', -apple-system, sans-serif;
}
/* #endif */
page {
  background: #F7F4F0;
  color: #1E1A14;
}

/* ── 全局动画 keyframes ── */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes floatMoney {
  0%   { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
  60%  { opacity: 0.9; transform: translateY(-90px) scale(1.4) rotate(15deg); }
  100% { opacity: 0; transform: translateY(-160px) scale(0.7) rotate(-10deg); }
}
@keyframes pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 4px 20px rgba(67,97,238,0.35); }
  50%       { transform: scale(1.03); box-shadow: 0 8px 32px rgba(67,97,238,0.5); }
}
@keyframes notifySlide {
  from { opacity: 0; transform: translateX(60px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes balancePop {
  0%   { opacity: 0; transform: scale(0.8); }
  70%  { transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes coinSpin {
  0%   { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }
}

/* ── H5 桌面端手机框架 ── */
@media (min-width: 500px) {
  body {
    background: linear-gradient(135deg, #0E0C08 0%, #1E1A14 50%, #0E0C08 100%) !important;
    min-height: 100vh;
    display: flex !important;
    justify-content: center !important;
    align-items: flex-start !important;
    padding: 48px 0 80px !important;
  }

  #app {
    width: 390px !important;
    min-width: 390px !important;
    max-width: 390px !important;
    border-radius: 50px !important;
    overflow: hidden !important;
    border: 13px solid #0E0C08 !important;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.1),
      0 50px 130px rgba(0,0,0,0.9),
      inset 0 1px 0 rgba(255,255,255,0.05) !important;
    position: relative !important;
  }
}
</style>
