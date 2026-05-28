import type {
  GetPassportRequest,
  GetPassportResponse,
  GetStampDetailRequest,
  GetStampDetailResponse,
} from '@wanderpop/shared';

import { supabase } from '../lib/supabase';

export async function getPassport(request: GetPassportRequest): Promise<GetPassportResponse> {
  void supabase;
  void request;

  throw new Error('Not implemented: getPassport');
}

export async function getStampDetail(
  request: GetStampDetailRequest,
): Promise<GetStampDetailResponse> {
  void supabase;
  void request;

  throw new Error('Not implemented: getStampDetail');
}
