import {applyCors, parseBody} from '../_http.js';
import {getStore} from '../_store.js';

type Req = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: any;
};

type Res = {
  status: (code: number) => Res;
  json: (body: any) => void;
  setHeader: (name: string, value: string | string[]) => void;
  end: (body?: string) => void;
};

export default function handler(req: Req, res: Res) {
  if (applyCors(req, res)) return;

  const store = getStore();

  if (req.method === 'GET') {
    res.json(store.users.map(({id, username, role}) => ({id, username, role})));
    return;
  }

  if (req.method === 'POST') {
    const {username, password, role} = parseBody<{username?: string; password?: string; role?: 'admin' | 'viewer'}>(req);
    if (!username || !password || !role) {
      res.status(400).json({success: false, message: 'Missing required fields'});
      return;
    }
    if (store.users.some((u) => u.username === username)) {
      res.status(400).json({success: false, message: 'Username already exists'});
      return;
    }
    const id = `u-${Date.now()}`;
    store.users.push({id, username, password, role});
    res.json({success: true, id});
    return;
  }

  res.status(405).json({success: false, message: 'Method Not Allowed'});
}
