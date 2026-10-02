import { Component, inject, input, output, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Observable } from 'rxjs';
import { TicketPriority, TicketResponse, TicketStatus } from '../../core/models/ticket.models';
import { TicketService } from '../../core/services/ticket.service';
import { ticketError, validationMessages } from './ticket-errors';

// Reject titles containing only spaces, which the required validator allows.
function nonBlank(control: AbstractControl) {
  return typeof control.value === 'string' && control.value.trim().length === 0
    ? { required: true } : null;
}

@Component({
  selector: 'app-ticket-form',
  imports: [ReactiveFormsModule],
  templateUrl: './ticket-form.html',
  styleUrl: './tickets.css'
})
export class TicketForm implements OnInit {
  readonly ticket = input<TicketResponse | null>(null);
  readonly saved = output<void>();
  readonly closed = output<void>();
  readonly busyChange = output<boolean>();
  private readonly service = inject(TicketService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly id = signal<number | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly serverErrors = signal<string[]>([]);
  protected readonly priorities = Object.values(TicketPriority);
  protected readonly statuses = Object.values(TicketStatus);
  protected readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, nonBlank, Validators.maxLength(150)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2000)] }),
    customerEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email, Validators.maxLength(320)] }),
    priority: new FormControl(TicketPriority.Medium, { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl(TicketStatus.Open, { nonNullable: true, validators: [Validators.required] })
  });

  ngOnInit(): void {
    // An existing ticket fills the edit form; null keeps the defaults for a new ticket.
    const ticket = this.ticket();
    this.id.set(ticket?.id ?? null);
    if (ticket) this.form.patchValue({ ...ticket, description: ticket.description ?? '' });
  }
  protected statusLabel(status: TicketStatus): string {
    return status === TicketStatus.InProgress ? 'In progress' : status;
  }

  protected save(): void {
    if (this.saving()) return;
    const values = this.form.getRawValue();
    this.form.patchValue({ title: values.title.trim(), description: values.description.trim(), customerEmail: values.customerEmail.trim() });
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const valuesToSave = this.form.getRawValue();
    // Send an empty optional description as null, matching the API model.
    const request = { ...valuesToSave, description: valuesToSave.description || null };
    const id = this.id();
    this.saving.set(true);
    this.busyChange.emit(true);
    this.form.disable();
    this.error.set(null);
    this.serverErrors.set([]);
    const operation: Observable<TicketResponse | void> = id === null
      ? this.service.createTicket({
          title: request.title,
          description: request.description,
          customerEmail: request.customerEmail,
          priority: request.priority
        })
      : this.service.updateTicket(id, request);
    // Stop listening to this request if the form is removed from the page.
    operation.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.busyChange.emit(false);
        this.form.enable();
        this.service.showNotice(id === null ? 'Ticket created successfully.' : 'Ticket updated successfully.');
        this.saved.emit();
      },
      error: error => {
        this.saving.set(false);
        this.busyChange.emit(false);
        this.form.enable();
        this.error.set(ticketError(error, 'Could not save the ticket. Check the fields and try again.'));
        this.serverErrors.set(validationMessages(error));
      }
    });
  }
}
