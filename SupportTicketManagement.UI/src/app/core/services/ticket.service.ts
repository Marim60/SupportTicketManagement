import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { PagedResult } from '../models/paged-result.model';
import { CreateTicketRequest, UpdateTicketRequest, TicketQuery, TicketResponse } from '../models/ticket.models';

@Injectable({ providedIn: 'root' })
export class TicketService implements OnDestroy {
  readonly notice = signal<string | null>(null);
  private noticeTimer?: ReturnType<typeof setTimeout>;

  showNotice(message: string): void {
    // Restart the timer so the previous timeout cannot hide a new message.
    clearTimeout(this.noticeTimer);
    this.notice.set(message);
    this.noticeTimer = setTimeout(() => this.notice.set(null), 2000);
  }

  ngOnDestroy(): void {
    clearTimeout(this.noticeTimer);
  }
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL).replace(/\/$/, '');

  createTicket(request: CreateTicketRequest): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(`${this.baseUrl}/Tickets/Create`, request);
  }

  updateTicket(id: number, request: UpdateTicketRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Tickets/Update`, request, { params: { id } });
  }

  deleteTicket(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Tickets/Delete`, { params: { id } });
  }

  getTickets(query: TicketQuery): Observable<PagedResult<TicketResponse>> {
    let params = new HttpParams()
      .set('Page', query.page ?? 1)
      .set('PageSize', query.pageSize ?? 10);
    if (query.search?.trim()) params = params.set('Search', query.search.trim());
    if (query.status) params = params.set('Status', query.status);
    if (query.priority) params = params.set('Priority', query.priority);
    return this.http.get<PagedResult<TicketResponse>>(`${this.baseUrl}/Tickets/GetAll`, { params });
  }
}
