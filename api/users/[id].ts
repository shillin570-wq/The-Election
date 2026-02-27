import {applyCors, parseBody} from '../_http';
import {getStore} from '../_store';

type Req = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: any;
  query?: {id?: string | string[]};
};

type Res = {
  status: (code: number) => Res;
  json: (body: any) => void;
  setHeader: (name: string, value: string | string[]) => void;
  end: (body?: string) => void;
};

export default function handler(req: Req, res: Res) {
  if (applyCors(req, res)) return;

  const id = Array.isArray(req.query?.id) ? req.query?.id[0] : req.query?.id;
  if (!id) {
    res.status(400).json({success: false, message: 'Missing user id'});
    return;
  }

  const store = getStore();
  const user = store.users.find((u) => u.id === id);
  if (!user) {
    res.status(404).json({success: false, message: 'User not found'});
    return;
  }

  if (req.method === 'PUT') {
    const {password, role} = parseBody<{password?: string; role?: 'admin' | 'viewer'}>(req);
    if (password) user.password = password;
    if (role) user.role = role;
    res.json({success: true});
    return;
  }

  if (req.method === 'DELETE') {
    const index = store.users.findIndex((u) => u.id === id);
    if (index >= 0) store.users.splice(index, 1);
    res.json({success: true});
    return;
  }

  res.status(405).json({success: false, message: 'Method Not Allowed'});
}
