import {applyCors, parseBody} from '../_http';
import {getStore, nowLabel} from '../_store';

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

  const {state_id, title, details, tension, trend} = parseBody<{
    state_id?: string;
    title?: string;
    details?: string;
    tension?: '极高' | '高' | '中等' | '较低';
    trend?: 'up' | 'down' | 'stable';
  }>(req);

  if (!state_id || !title || !details || !tension || !trend) {
    res.status(400).json({success: false, message: 'Missing required fields'});
    return;
  }

  const store = getStore();
  const state = store.states.find((s) => s.id === state_id);
  if (!state) {
    res.status(404).json({success: false, message: 'State not found'});
    return;
  }

  const id = `${state_id}-${Date.now()}`;
  const time = nowLabel();
  state.crises.push({id, state_id, time, title, details, tension, trend});
  res.json({success: true, id, time});
}
