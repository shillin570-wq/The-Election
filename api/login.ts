import {applyCors, parseBody} from './_http.js';
import {getStore} from './_store.js';

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

  if (req.method !== 'POST') {
    res.status(405).json({success: false, message: 'Method Not Allowed'});
    return;
  }

  const {username, password} = parseBody<{username?: string; password?: string}>(req);
  const store = getStore();
  const user = store.users.find((u) => u.username === username && u.password === password);

  if (!user) {
    res.status(401).json({success: false, message: 'Invalid credentials'});
    return;
  }
  res.json({success: true, role: user.role, username: user.username});
}
