//  server/src/types/index.ts  //

export enum EventStatus {
  BUSY = "BUSY",
  SWAPPABLE = "SWAPPABLE",
  SWAP_PENDING = "SWAP_PENDING",
}

export enum SwapRequestStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}
