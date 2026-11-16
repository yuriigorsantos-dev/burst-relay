// Servidor de retransmissão do BURST ARENA (teste). Uso: npm install && node server.js
const http = require('http');
const { WebSocketServer } = require('ws');
const srv = http.createServer((q, s) => { s.end('BURST ARENA relay ok'); });
const wss = new WebSocketServer({ server: srv });
const rooms = {}; let n = 0;
const J = o => JSON.stringify(o);
wss.on('connection', (ws, req) => {
  const u = new URL(req.url, 'http://x');
  const room = (u.searchParams.get('room') || '').toUpperCase().slice(0, 8), mode = u.searchParams.get('mode');
  const bye = e => { ws.send(J({ t: 'err', e })); ws.close(); };
  if (!room) return ws.close();
  if (mode === 'create') { if (rooms[room]) return bye('exists'); rooms[room] = new Set(); }
  else if (!rooms[room]) return bye('nf');
  if (rooms[room].size >= 8) return bye('full');
  ws.id = 'p' + (++n); rooms[room].add(ws);
  ws.send(J({ t: 'id', id: ws.id }));
  ws.on('message', d => {
    let m; try { m = JSON.parse(d); } catch (e) { return; }
    if (!m || typeof m !== 'object') return;
    m.f = ws.id; const s = J(m);
    for (const c of rooms[room]) if (c !== ws && c.readyState === 1) c.send(s);
  });
  ws.on('close', () => {
    const r = rooms[room]; if (!r) return; r.delete(ws);
    for (const c of r) if (c.readyState === 1) c.send(J({ t: 'l', id: ws.id }));
    if (!r.size) delete rooms[room];
  });
});
srv.listen(process.env.PORT || 8080, () => console.log('relay na porta', process.env.PORT || 8080));
