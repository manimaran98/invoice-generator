export interface JwtPayload {
  sub: string;
  orgId: string;
  role: string;
}

export type RequestUser = {
  userId: string;
  orgId: string;
  role: string;
};
