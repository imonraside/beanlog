import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // GitHub Pages 배포용 기본 경로 (이미 있다면 그대로 유지하세요)
  base: '/beanlog/', 
  plugins: [
    react(),
    VitePWA({
      // 서비스 워커를 자동으로 등록하고 업데이트합니다.
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      
      // 우리가 PWASetup.jsx에서 manifest를 직접 만들고 있으므로 
      // 플러그인이 중복으로 생성하지 않도록 끕니다.
      manifest: false, 
      
      workbox: {
        // 오프라인에서 앱을 켜기 위해 필요한 모든 파일을 캐싱(저장)합니다.
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallbackDenylist: [/^\/beanlog\/guide/]
      }
    })
  ],
})
