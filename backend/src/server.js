import 'dotenv/config';
import app from './app.js';
import { startFocusGroupReminders } from './services/focusGroupReminder.service.js';

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  console.log(`Servidor backend escuchando en http://${host}:${port}`);
  startFocusGroupReminders();
});