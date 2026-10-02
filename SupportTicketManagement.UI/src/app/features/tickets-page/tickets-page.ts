import { Component, computed, DestroyRef, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PagedResult } from '../../core/models/paged-result.model';
import { TicketPriority, TicketQuery, TicketResponse, TicketStatus } from '../../core/models/ticket.models';
import { TicketService } from '../../core/services/ticket.service';
import { TicketForm } from '../tickets/ticket-form';
import { ticketError } from '../tickets/ticket-errors';

@Component({
  selector: 'app-tickets-page',
  imports: [ReactiveFormsModule, DatePipe, TicketForm],
  templateUrl: './tickets-page.html',
  styleUrl: './tickets-page.css'
})
export class TicketsPage implements OnInit {
  @ViewChild('createDialog') private createDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('deleteDialog') private deleteDialog!: ElementRef<HTMLDialogElement>;
  protected readonly pendingDelete = signal<TicketResponse | null>(null);
  protected readonly deleteError = signal<string | null>(null);
  protected readonly modalOpen = signal(false);
  protected readonly modalBusy = signal(false);
  protected readonly editingTicket = signal<TicketResponse | null>(null);
  protected readonly expandedIds = signal<Set<number>>(new Set());
  protected readonly deletingId = signal<number | null>(null);

  protected openCreate(): void {
    this.editingTicket.set(null);
    this.modalOpen.set(true);
    this.createDialog.nativeElement.showModal();
  }

  protected openEdit(ticket: TicketResponse): void {
    this.editingTicket.set(ticket);
    this.modalOpen.set(true);
    this.createDialog.nativeElement.showModal();
  }

  protected toggleDetails(id: number): void {
    this.expandedIds.update(current => {
      // Return a new Set so Angular notices the change and updates the expanded rows.
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected deleteTicket(ticket: TicketResponse): void {
    if (this.deletingId() !== null) return;
    this.pendingDelete.set(ticket);
    this.deleteError.set(null);
    this.deleteDialog.nativeElement.showModal();
  }

  protected closeDelete(): void {
    if (this.deletingId() !== null) return;
    this.deleteDialog.nativeElement.close();
    this.pendingDelete.set(null);
    this.deleteError.set(null);
  }

  protected cancelDelete(event: Event): void {
    // Handle Escape ourselves so the dialog stays open while deletion is running.
    event.preventDefault();
    this.closeDelete();
  }

  protected confirmDelete(): void {
    const ticket = this.pendingDelete();
    if (!ticket || this.deletingId() !== null) return;
    this.deletingId.set(ticket.id);
    this.deleteError.set(null);
    this.tickets.deleteTicket(ticket.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.closeDelete();
        this.tickets.showNotice('Ticket deleted successfully.');
        this.loadPage(this.page());
      },
      error: error => {
        this.deletingId.set(null);
        this.deleteError.set(ticketError(error, 'Could not delete the ticket. Please try again.'));
      }
    });
  }

  protected closeCreate(): void {
    if (this.modalBusy()) return;
    this.createDialog.nativeElement.close();
    this.modalOpen.set(false);
  }

  protected cancelCreate(event: Event): void {
    // Handle Escape ourselves so the dialog stays open while saving is running.
    event.preventDefault();
    this.closeCreate();
  }

  protected ticketSaved(): void {
    // New tickets appear first; after editing, keep the user on their current page.
    const page = this.editingTicket() ? this.page() : 1;
    this.closeCreate();
    this.loadPage(page);
  }
  private readonly tickets = inject(TicketService);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;
  // Pagination uses the applied filters until the user submits new filter values.
  private appliedQuery: TicketQuery = { pageSize: 10 };

  protected readonly statuses = Object.values(TicketStatus);
  protected readonly priorities = Object.values(TicketPriority);
  protected readonly pageSizes = [10, 25, 50];
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly result = signal<PagedResult<TicketResponse> | null>(null);
  protected readonly page = signal(1);
  protected readonly hasFilters = signal(false);
  protected readonly firstItem = computed(() => {
    const result = this.result();
    return result && result.totalCount > 0 ? (result.page - 1) * result.pageSize + 1 : 0;
  });
  protected readonly lastItem = computed(() => {
    const result = this.result();
    return result ? Math.min(result.page * result.pageSize, result.totalCount) : 0;
  });

  protected readonly filters = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    status: new FormControl<TicketStatus | ''>('', { nonNullable: true }),
    priority: new FormControl<TicketPriority | ''>('', { nonNullable: true }),
    pageSize: new FormControl(10, { nonNullable: true })
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.request?.unsubscribe());
  }

  ngOnInit(): void {
    this.loadPage(1);
  }

  protected applyFilters(): void {
    const values = this.filters.getRawValue();
    this.appliedQuery = {
      search: values.search.trim() || undefined,
      status: values.status || undefined,
      priority: values.priority || undefined,
      pageSize: values.pageSize
    };
    this.hasFilters.set(Boolean(this.appliedQuery.search || values.status || values.priority));
    this.loadPage(1);
  }

  protected clearFilters(): void {
    this.filters.reset({ search: '', status: '', priority: '', pageSize: 10 });
    this.applyFilters();
  }

  protected changePage(page: number): void {
    const result = this.result();
    if (this.loading() || !result || page < 1 || page > result.totalPages) return;
    this.loadPage(page);
  }

  protected retry(): void {
    this.loadPage(this.page());
  }

  protected statusLabel(status: TicketStatus): string {
    return status === TicketStatus.InProgress ? 'In progress' : status;
  }

  private loadPage(page: number): void {
    // Cancel older requests so their responses cannot overwrite the latest filters.
    this.request?.unsubscribe();
    this.page.set(page);
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);
    this.request = this.tickets.getTickets({ ...this.appliedQuery, page }).subscribe({
      next: result => {
        // Deleting tickets can remove the current page, so load a page that still exists.
        if (result.totalPages === 0 && page !== 1) {
          this.loadPage(1);
          return;
        }
        if (result.totalPages > 0 && page > result.totalPages) {
          this.loadPage(result.totalPages);
          return;
        }
        this.result.set(result);
        // Keep expanded details only for tickets still visible on this page.
        this.expandedIds.update(ids => new Set(result.items.filter(ticket => ids.has(ticket.id)).map(ticket => ticket.id)));
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(ticketError(error, 'Could not load tickets. Please try again.'));
        this.loading.set(false);
      }
    });
  }
}
