type Req = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: any;
};

type Res = {
  setHeader: (name: string, value: string | string[]) => void;
  status: (code: number) => Res;
  json: (body: any) => void;
  end: (body?: string) => void;
};

function getAllowedOrigins(): string[] {
  return (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function applyCors(req: Req, res: Res): boolean {
  const origin = (req.headers?.origin as string | undefined) || '';
  const allowList = getAllowedOrigins();
  const allowOrigin = allowList.length === 0 ? '*' : (allowList.includes(origin) ? origin : '');

  if (allowOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

export function parseBody<T>(req: Req): T {
  if (!req.body) return {} as T;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      return {} as T;
    }
  }
  return req.body as T;
}
