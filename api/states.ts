import {applyCors} from './_http';
import {getStore} from './_store';

type Req = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type Res = {
  status: (code: number) => Res;
  json: (body: any) => void;
  setHeader: (name: string, value: string | string[]) => void;
  end: (body?: string) => void;
};

export default function handler(req: Req, res: Res) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    res.status(405).json({success: false, message: 'Method Not Allowed'});
    return;
  }

  res.json(getStore().states);
}
