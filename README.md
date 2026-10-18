# 🎨 GDG Design Studio (`gdg-design-studio`)

행사 준비를 위한 **SNS 홍보용 에셋** 및 **인쇄용 제작물(X배너, 3단 팜플렛, 포스터, 네임택)** 통합 디자인 스튜디오입니다.  
기본 에셋 업로드, 연사자 프로필 사진 자동 클리핑 머지(합성), 디자인 시스템 토큰 주입(JSON & AI), 그리고 **SVG / PNG / JPG / WebP** 멀티 포맷 고해상도 Export를 지원합니다.

---

## ✨ 주요 기능

1. **용도별 규격 프리셋 & 인쇄 가이드**
   - **SNS 홍보용**: 인스타그램 피드(1:1), 포스터(4:5), 스토리/릴스(9:16), 링크드인/X 배너(1.91:1), 유튜브 썸네일(16:9)
   - **인쇄용(Print)**: 실내용/실외용 X배너(`600×1800mm`), 3단 접지 팜플렛/리플렛(`A4 가로 3단`), 행사 메인 포스터(`A2/A3`), 연사자 네임택 배지(`100×140mm`)
   - **인쇄 보조 가이드**: 재단선(Bleed Line), 안전 영역(Safe Zone), 3단 접지선(Fold Lines), X배너 코너 타공점(Grommets) 실시간 토글 및 인쇄소 전달용 포함 출력 지원

2. **기본 에셋 업로드 및 레이어 관리**
   - 로고(`Logo`), 배경(`Background`), 프레임 오버레이(`Frame`), 스티커(`Sticker`), 스폰서 바(`Sponsor`) 다중 업로드
   - 레이어별 표시 여부, 크기 배율, X/Y 좌표 위치 조정

3. **연사자 사진 업로드 & 에셋 자동 머지 (Speaker Photo Merge)**
   - 연사자 사진 업로드 시 프레임 마스크(`아치형`, `원형`, `육각형`, `캡슐형`, `라운드 사각`)에 맞춰 자동 클리핑 & 레이어 합성
   - 사진 확대/축소, 위치 오프셋, 컬러 필터(듀오톤/흑백/고대비) 및 AI 오로라 조명 효과
   - 다중 연사자 로스터 관리 및 **전체 연사자 일괄 머지 Export (Batch Export)** 지원

4. **디자인 시스템 주입 (Design System Injector)**
   - 5종 기본 테마 프리셋 (`GDG Classic`, `DevFest Dark Cyber`, `Build with AI`, `I/O Extended Pastel`, `Cloud Summit Minimal`)
   - **JSON 토큰 직접 주입**: 컬러 팔레트, 타이포그래피, 도형/그림자 스타일 JSON을 붙여넣어 즉시 일괄 반영
   - **Gemini / Vertex AI 프롬프트 기반 테마 생성**: 자연어 키워드로 커스텀 디자인 시스템 생성

5. **멀티 포맷 & 고해상도 Export**
   - **SVG**: 피그마(Figma), 일러스트레이터(Illustrator), 인쇄소에서 바로 편집 가능한 순수 벡터 SVG 출력
   - **PNG / JPG / WebP**: `1x`, `2x`, `3x` (인쇄용 300 DPI 급) 해상도 스케일링 및 투명 배경 옵션 지원

---

## 🚀 로컬 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 접속합니다.

---

## ☁️ Google Cloud Platform (GCP) 배포 가이드

본 프로젝트는 **Google Cloud Run**, **Artifact Registry**, **Cloud Build**, **GitHub Actions** 배포 구성이 모두 준비되어 있습니다.

### 1. 초기 GCP 리소스 셋업 스크립트 실행
```bash
chmod +x ./scripts/setup-gcp.sh
./scripts/setup-gcp.sh <YOUR_GCP_PROJECT_ID> asia-northeast3
```

### 2. Cloud Build를 통한 수동 배포
```bash
gcloud builds submit --config cloudbuild.yaml
```

### 3. GitHub Actions 자동 배포 설정 (`.github/workflows/deploy-gcp.yml`)
GitHub 저장소 Settings → Secrets and variables → Actions에 아래 시크릿을 등록하면 `main` 브랜치 푸시 시 자동 배포됩니다:
- `GCP_PROJECT_ID`: GCP 프로젝트 ID
- `GCP_WORKLOAD_IDENTITY_PROVIDER` / `GCP_SERVICE_ACCOUNT` (또는 `GCP_SA_KEY`)
- `GCS_BUCKET_NAME`: 에셋 저장용 Cloud Storage 버킷 이름
- `GEMINI_API_KEY`: Gemini / Vertex AI 연동 API 키
