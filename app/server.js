const express = require('express');
const helmet = require('helmet');
const { Pool } = require('pg');
const client = require('prom-client');

const app = express();
const port = Number(process.env.APP_PORT || 3000);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const register = new client.Registry();
client.collectDefaultMetrics({ register });

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '100kb' }));
app.use(express.static('public'));

const httpRequests = new client.Counter({
  name: 'petcare_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
});
register.registerMetric(httpRequests);
app.use((req, res, next) => {
  res.on('finish', () => httpRequests.inc({
    method: req.method,
    route: req.route?.path || req.path,
    status: String(res.statusCode)
  }));
  next();
});

const allowed = {
  pets: ['name','species','breed','age_months','gender','price','stock','description','image_url'],
  customers: ['full_name','phone','email','preferred_species','budget_min','budget_max','lifestyle','notes'],
  services: ['name','category','description','duration_minutes','price','active'],
  appointments: ['customer_id','pet_id','service_id','appointment_at','status','notes'],
  care_logs: ['customer_id','pet_id','channel','summary','next_contact_at']
};

function cleanPayload(table, body) {
  const result = {};
  for (const key of allowed[table]) {
    if (Object.prototype.hasOwnProperty.call(body, key)) result[key] = body[key];
  }
  return result;
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', time: new Date().toISOString() });
  } catch (_err) {
    res.status(503).json({ status: 'degraded', database: 'unavailable' });
  }
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/api/:table', async (req, res, next) => {
  const table = req.params.table;
  if (!allowed[table]) return res.status(404).json({ error: 'Không tìm thấy tài nguyên' });
  try {
    const order = table === 'appointments' ? 'appointment_at DESC' : 'id DESC';
    const { rows } = await pool.query(`SELECT * FROM ${table} ORDER BY ${order} LIMIT 500`);
    res.json(rows);
  } catch (err) { next(err); }
});

app.post('/api/:table', async (req, res, next) => {
  const table = req.params.table;
  if (!allowed[table]) return res.status(404).json({ error: 'Không tìm thấy tài nguyên' });
  const data = cleanPayload(table, req.body || {});
  const keys = Object.keys(data);
  if (!keys.length) return res.status(400).json({ error: 'Không có dữ liệu hợp lệ' });
  try {
    const cols = keys.map(k => `"${k}"`).join(',');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
    const values = keys.map(k => data[k]);
    const { rows } = await pool.query(
      `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING *`, values
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

app.patch('/api/:table/:id', async (req, res, next) => {
  const table = req.params.table;
  if (!allowed[table]) return res.status(404).json({ error: 'Không tìm thấy tài nguyên' });
  const data = cleanPayload(table, req.body || {});
  const keys = Object.keys(data);
  if (!keys.length) return res.status(400).json({ error: 'Không có dữ liệu hợp lệ' });
  try {
    const sets = keys.map((k, i) => `"${k}"=$${i + 1}`).join(',');
    const values = keys.map(k => data[k]);
    values.push(Number(req.params.id));
    const { rows } = await pool.query(
      `UPDATE ${table} SET ${sets} WHERE id=$${values.length} RETURNING *`, values
    );
    if (!rows[0]) return res.status(404).json({ error: 'Không tìm thấy bản ghi' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

app.delete('/api/:table/:id', async (req, res, next) => {
  const table = req.params.table;
  if (!['pets','customers','services','appointments','care_logs'].includes(table))
    return res.status(404).json({ error: 'Không tìm thấy tài nguyên' });
  try {
    const { rowCount } = await pool.query(`DELETE FROM ${table} WHERE id=$1`, [Number(req.params.id)]);
    if (!rowCount) return res.status(404).json({ error: 'Không tìm thấy bản ghi' });
    res.status(204).end();
  } catch (err) { next(err); }
});

app.use((err, _req, res, _next) => {
  // Do not leak SQL, credentials, or stack traces to clients.
  console.error('Request failed:', err.message);
  res.status(400).json({ error: 'Không thể xử lý yêu cầu. Hãy kiểm tra dữ liệu nhập.' });
});

app.listen(port, '0.0.0.0', () => console.log(`PetCare listening on ${port}`));
