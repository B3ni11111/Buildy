export interface AuthUser {
  cognitoSub: string;
  email?: string;
  name?: string;
  /** Google profile photo URL (Cognito "picture" claim), used as the default avatar. */
  picture?: string;
}
