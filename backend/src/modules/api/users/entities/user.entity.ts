export type IUser = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  emailVerified: boolean;
};

export class User {}
