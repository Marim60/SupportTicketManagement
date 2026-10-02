// The API serializes enums as strings using JsonStringEnumConverter.
export enum TicketStatus {
  Open = 'Open',
  InProgress = 'InProgress',
  Resolved = 'Resolved'
}

export enum TicketPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High'
}

export interface TicketResponse {
  id: number;
  title: string;
  description: string | null;
  customerEmail: string;
  priority: TicketPriority;
  status: TicketStatus;
  // JSON timestamps are strings; convert to Date only when needed.
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateTicketRequest {
  title: string;
  description?: string | null;
  customerEmail: string;
  priority: TicketPriority;
}

export interface UpdateTicketRequest {
  title: string;
  description?: string | null;
  customerEmail: string;
  priority: TicketPriority;
  status: TicketStatus;
}

export interface TicketQuery {
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  page?: number;
  pageSize?: number;
}
