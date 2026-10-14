# PetCare Studio — Hệ thống quản lý cửa hàng thú cưng

Ứng dụng mẫu phục vụ đồ án triển khai hệ thống web bằng Docker Compose. Giao diện tiếng Việt gồm quản lý thú cưng và giá bán, khách hàng/sở thích/ngân sách, dịch vụ spa, lịch hẹn và nhật ký chăm sóc. Dữ liệu lưu PostgreSQL; pgAdmin quản trị DB; Nginx reverse proxy; Prometheus + Grafana giám sát metrics; Loki + Promtail thu thập log Nginx.

> Đây là bộ khung đồ án/demo. Trước khi đưa lên Internet cần bổ sung đăng nhập/ phân quyền, kiểm thử bảo mật, backup, tên miền và chứng chỉ TLS hợp lệ. Dữ liệu mẫu và giá chỉ nhằm minh họa, hãy điều chỉnh theo cửa hàng thực tế.

## 1. Yêu cầu
- Docker Engine và Docker Compose v2
- Git
- OpenSSL (để tạo chứng chỉ tự ký dùng cho môi trường demo)

## 2. Cài đặt
```bash
cp .env.example .env
```
Sửa `.env`: đặt mật khẩu dài, riêng biệt cho PostgreSQL, pgAdmin và Grafana. Không commit `.env` hoặc khóa riêng vào Git.

Tạo chứng chỉ demo (trình duyệt sẽ cảnh báo vì đây là chứng chỉ tự ký):
```bash
mkdir -p nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/server.key -out nginx/certs/server.crt \
  -subj "/CN=localhost"
```
Chạy dịch vụ:
```bash
docker compose up -d --build
docker compose ps
docker compose logs -f app
```
Truy cập:
- Web: `https://localhost` (chấp nhận cảnh báo chứng chỉ tự ký trong môi trường lab)
- pgAdmin: `http://127.0.0.1:5050`
- Prometheus: `http://127.0.0.1:9090`
- Grafana: `http://127.0.0.1:3001`
- Health: `https://localhost/api/health`

Trong pgAdmin, đăng ký server với host `db`, port `5432`, database/user/password lấy từ `.env`.

## 3. Chức năng
- Dashboard: số lượng thú cưng, khách hàng, lịch hẹn, lịch sắp tới và gợi ý chăm sóc.
- Thú cưng: thêm/sửa/xóa hồ sơ, giống, tuổi, giới tính, giá và số lượng.
- Khách hàng: thông tin liên hệ, loài yêu thích, ngân sách, môi trường sống và ghi chú.
- Dịch vụ spa: danh mục, thời lượng và bảng giá.
- Lịch hẹn: liên kết mã khách hàng, thú cưng, dịch vụ, thời gian và trạng thái.
- Chăm sóc khách hàng: nhật ký tương tác, kênh liên hệ và ngày liên hệ tiếp theo.
- API JSON và `/metrics` cho Prometheus.

## 4. Kiểm tra
```bash
curl -k https://localhost/api/health
curl -k https://localhost/api/pets
curl -k https://localhost/metrics
docker compose ps
docker compose logs --tail=100 app nginx prometheus loki promtail
```
Truy vấn LogQL trong Grafana Explore (chọn Loki làm datasource):
```logql
{job="nginx"}
{job="nginx-error"}
{job="nginx"} |= "GET"
```
Truy vấn Prometheus:
```promql
up
rate(petcare_http_requests_total[5m])
```

## 5. Git — gợi ý 3 commit có ý nghĩa
```bash
git init
git add README.md .gitignore .env.example db app
git commit -m "commit 1: build PetCare UI and core CRUD API"
git add docker-compose.yml nginx
git commit -m "commit 2: deploy stack with PostgreSQL and Nginx TLS"
git add monitoring docs
git commit -m "commit 3: add Prometheus Grafana Loki and project report"
```
Ba commit cần được tạo theo từng giai đoạn như trên để lịch sử Git phản ánh đúng công việc. Không tạo commit giả hoặc ghi đè lịch sử để tạo bằng chứng không có thật.

## 6. Lưu ý bảo mật và giới hạn
- Mật khẩu mẫu trong `.env.example` chỉ là placeholder; phải đổi trước khi chạy.
- Chứng chỉ tự ký chỉ dành cho lab. Triển khai thật cần domain và chứng chỉ từ CA (ví dụ Let's Encrypt).
- Mẫu hiện chưa có xác thực người dùng/role-based access control; không công khai hệ thống hoặc các trang quản trị ra Internet trước khi bổ sung xác thực.
- Docker socket được mount read-only cho Promtail để minh họa thu thập log container; quyền đọc Docker socket vẫn có rủi ro cao. Trong triển khai nghiêm ngặt nên dùng logging driver/agent thay thế hoặc giới hạn nguồn log.
- Backend dùng danh sách bảng/cột cho phép và truy vấn tham số hóa; vẫn cần validation nghiệp vụ, rate limit, CSRF strategy nếu dùng cookie/session, audit log và kiểm thử.
- Dữ liệu khởi tạo chỉ chạy tự động trên volume PostgreSQL mới. Nếu cần reset dữ liệu demo, sao lưu trước rồi mới cân nhắc `docker compose down -v`.
