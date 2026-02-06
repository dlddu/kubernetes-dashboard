# End-to-End (E2E) Tests

Playwright를 사용한 Kubernetes Dashboard의 E2E 테스트입니다.

## 구조

```
e2e/
├── health.spec.ts        # Health check 및 기본 통합 테스트
└── README.md             # 이 파일

test/
├── kind-setup.sh         # kind 클러스터 관리 스크립트
├── e2e_helper.go         # Go 테스트 헬퍼
└── fixtures/             # Kubernetes 테스트 리소스
    ├── namespace.yaml
    ├── deployment.yaml
    ├── pod.yaml
    └── secret.yaml
```

## 사전 요구사항

### 로컬 개발 환경

1. **kind (Kubernetes in Docker)**
   ```bash
   # macOS
   brew install kind

   # Linux
   curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
   chmod +x ./kind
   sudo mv ./kind /usr/local/bin/kind
   ```

2. **kubectl**
   ```bash
   # macOS
   brew install kubectl

   # Linux
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   chmod +x kubectl
   sudo mv kubectl /usr/local/bin/
   ```

3. **Docker**
   - kind는 Docker를 사용하므로 Docker가 실행 중이어야 합니다.

4. **Node.js 20+**
   ```bash
   node --version  # v20.x.x 이상
   ```

5. **Go 1.21+**
   ```bash
   go version  # go1.21.x 이상
   ```

## 로컬에서 실행하기

### 1. Playwright 설치

```bash
# 루트 디렉토리에서
npm install
npm run playwright:install
```

### 2. kind 클러스터 생성 및 설정

```bash
# 전체 설정 (클러스터 생성 + 테스트 리소스 배포)
./test/kind-setup.sh setup

# 또는 단계별로
./test/kind-setup.sh create          # 클러스터 생성
./test/kind-setup.sh apply-fixtures  # 테스트 리소스 배포
./test/kind-setup.sh verify          # 클러스터 검증
```

### 3. 프론트엔드 빌드

```bash
cd frontend
npm ci
npm run build
cd ..
```

### 4. 백엔드 빌드 및 실행

```bash
# 빌드
go build -o kubernetes-dashboard .

# 실행 (kubeconfig를 kind 클러스터로 설정)
export KUBECONFIG=$(kind get kubeconfig --name k8s-dashboard-e2e)
./kubernetes-dashboard
```

### 5. E2E 테스트 실행

새 터미널에서:

```bash
# 모든 테스트 실행
npm run test:e2e

# UI 모드로 실행 (디버깅용)
npm run test:e2e:ui

# 디버그 모드
npm run test:e2e:debug

# 헤드리스 모드 비활성화 (브라우저 창 표시)
npm run test:e2e:headed
```

### 6. 정리

```bash
# kind 클러스터 삭제
./test/kind-setup.sh teardown

# 또는
./test/kind-setup.sh delete
```

## CI/CD에서 실행

GitHub Actions에서 자동으로 실행됩니다:

- **트리거**: `main` 브랜치 push 또는 PR
- **워크플로우**: `.github/workflows/e2e.yaml`
- **단계**:
  1. kind 클러스터 생성
  2. 테스트 리소스 배포
  3. 프론트엔드 빌드
  4. 백엔드 빌드 및 실행
  5. Playwright 테스트 실행
  6. 리포트 업로드 (실패 시)
  7. 클러스터 정리

## 테스트 작성 가이드

### 기본 구조

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something when condition', async ({ page, request }) => {
    // Arrange - 테스트 설정
    const url = '/some-page';

    // Act - 동작 실행
    await page.goto(url);

    // Assert - 검증
    expect(page.url()).toContain('expected');
  });
});
```

### API 테스트

```typescript
test('should return data from API', async ({ request }) => {
  const response = await request.get('/api/endpoint');

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data).toHaveProperty('field');
});
```

### UI 테스트

```typescript
test('should interact with UI', async ({ page }) => {
  await page.goto('/');
  await page.click('button#submit');
  await expect(page.locator('.result')).toBeVisible();
});
```

## 유용한 명령어

### kind 클러스터 관리

```bash
# 클러스터 목록
kind get clusters

# 클러스터 정보
./test/kind-setup.sh info

# kubeconfig 경로
./test/kind-setup.sh kubeconfig

# kubectl 사용
kubectl get pods --all-namespaces
kubectl get deployments -n test-namespace
```

### Playwright

```bash
# 특정 테스트 파일 실행
npx playwright test e2e/health.spec.ts

# 특정 브라우저로 실행
npx playwright test --project=chromium

# 리포트 보기
npm run playwright:report
```

## 트러블슈팅

### kind 클러스터가 시작되지 않음

```bash
# Docker 확인
docker ps

# kind 클러스터 재생성
./test/kind-setup.sh teardown
./test/kind-setup.sh setup
```

### 백엔드가 클러스터에 연결할 수 없음

```bash
# kubeconfig 확인
echo $KUBECONFIG

# kubectl 연결 테스트
kubectl cluster-info

# kubeconfig 재설정
export KUBECONFIG=$(kind get kubeconfig --name k8s-dashboard-e2e)
```

### Playwright 테스트가 타임아웃

```bash
# 백엔드가 실행 중인지 확인
curl http://localhost:8080/api/health

# 프론트엔드 빌드 확인
ls -la frontend/dist/

# 타임아웃 증가 (playwright.config.ts)
timeout: 60 * 1000  // 60초
```

## 참고 자료

- [Playwright 문서](https://playwright.dev/)
- [kind 문서](https://kind.sigs.k8s.io/)
- [Kubernetes 문서](https://kubernetes.io/docs/home/)
