import { obtainServiceToken } from '@/lib/server/dmapi-service-token'

export async function obtainServiceTokenForServer(): Promise<string> {
  return obtainServiceToken()
}

