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
    res.status(400).json({success: false, message: 'Missing crisis id'});
    return;
  }

  const store = getStore();
  let targetStateIndex = -1;
  let targetCrisisIndex = -1;

  for (let i = 0; i < store.states.length; i += 1) {
    const idx = store.states[i].crises.findIndex((c) => c.id === id);
    if (idx >= 0) {
      targetStateIndex = i;
      targetCrisisIndex = idx;
      break;
    }
  }

  if (targetStateIndex < 0 || targetCrisisIndex < 0) {
    res.status(404).json({success: false, message: 'Crisis not found'});
    return;
  }

  const crisis = store.states[targetStateIndex].crises[targetCrisisIndex];

  if (req.method === 'PATCH') {
    const {tension} = parseBody<{tension?: '极高' | '高' | '中等' | '较低'}>(req);
    if (!tension) {
      res.status(400).json({success: false, message: 'Missing tension'});
      return;
    }
    crisis.tension = tension;
    res.json({success: true});
    return;
  }

  if (req.method === 'PUT') {
    const {title, details, tension, trend} = parseBody<{
      title?: string;
      details?: string;
      tension?: '极高' | '高' | '中等' | '较低';
      trend?: 'up' | 'down' | 'stable';
    }>(req);
    if (!title || !details || !tension || !trend) {
      res.status(400).json({success: false, message: 'Missing required fields'});
      return;
    }
    crisis.title = title;
    crisis.details = details;
    crisis.tension = tension;
    crisis.trend = trend;
    res.json({success: true});
    return;
  }

  if (req.method === 'DELETE') {
    store.states[targetStateIndex].crises.splice(targetCrisisIndex, 1);
    res.json({success: true});
    return;
  }

  res.status(405).json({success: false, message: 'Method Not Allowed'});
}
