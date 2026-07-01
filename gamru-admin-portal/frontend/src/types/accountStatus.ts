export interface AccountStatus {
  id: string;
  uniqueKey: string;
  displayName: string;
  icon: string;
  color: string;
}

export interface AccountStatusForm {
  statuses: AccountStatus[];
}

export interface AccountStatusErrors {
  [key: string]: {
    uniqueKey?: string;
    displayName?: string;
    icon?: string;
    color?: string;
  };
}
