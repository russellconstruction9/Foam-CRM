import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type ChangeCallback = (payload: any) => void;

export class RealtimeSubscriptions {
  private channels: Map<string, RealtimeChannel> = new Map();

  subscribeToCustomers(callbacks: {
    onInsert?: ChangeCallback;
    onUpdate?: ChangeCallback;
    onDelete?: ChangeCallback;
  }) {
    const channel = supabase
      .channel('customers-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'customers' }, (payload) => {
        callbacks.onInsert?.(payload);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'customers' }, (payload) => {
        callbacks.onUpdate?.(payload);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'customers' }, (payload) => {
        callbacks.onDelete?.(payload);
      })
      .subscribe();

    this.channels.set('customers', channel);
    return channel;
  }

  subscribeToEstimates(callbacks: {
    onInsert?: ChangeCallback;
    onUpdate?: ChangeCallback;
    onDelete?: ChangeCallback;
  }) {
    const channel = supabase
      .channel('estimates-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'estimates' }, (payload) => {
        callbacks.onInsert?.(payload);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'estimates' }, (payload) => {
        callbacks.onUpdate?.(payload);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'estimates' }, (payload) => {
        callbacks.onDelete?.(payload);
      })
      .subscribe();

    this.channels.set('estimates', channel);
    return channel;
  }

  subscribeToEmployees(callbacks: {
    onInsert?: ChangeCallback;
    onUpdate?: ChangeCallback;
    onDelete?: ChangeCallback;
  }) {
    const channel = supabase
      .channel('employees-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'employees' }, (payload) => {
        callbacks.onInsert?.(payload);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'employees' }, (payload) => {
        callbacks.onUpdate?.(payload);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'employees' }, (payload) => {
        callbacks.onDelete?.(payload);
      })
      .subscribe();

    this.channels.set('employees', channel);
    return channel;
  }

  subscribeToTimeLog(callbacks: {
    onInsert?: ChangeCallback;
    onUpdate?: ChangeCallback;
    onDelete?: ChangeCallback;
  }) {
    const channel = supabase
      .channel('time-log-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'time_log' }, (payload) => {
        callbacks.onInsert?.(payload);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'time_log' }, (payload) => {
        callbacks.onUpdate?.(payload);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'time_log' }, (payload) => {
        callbacks.onDelete?.(payload);
      })
      .subscribe();

    this.channels.set('time_log', channel);
    return channel;
  }

  subscribeToInventory(callbacks: {
    onInsert?: ChangeCallback;
    onUpdate?: ChangeCallback;
    onDelete?: ChangeCallback;
  }) {
    const channel = supabase
      .channel('inventory-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inventory' }, (payload) => {
        callbacks.onInsert?.(payload);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'inventory' }, (payload) => {
        callbacks.onUpdate?.(payload);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'inventory' }, (payload) => {
        callbacks.onDelete?.(payload);
      })
      .subscribe();

    this.channels.set('inventory', channel);
    return channel;
  }

  subscribeToTasks(callbacks: {
    onInsert?: ChangeCallback;
    onUpdate?: ChangeCallback;
    onDelete?: ChangeCallback;
  }) {
    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, (payload) => {
        callbacks.onInsert?.(payload);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, (payload) => {
        callbacks.onUpdate?.(payload);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tasks' }, (payload) => {
        callbacks.onDelete?.(payload);
      })
      .subscribe();

    this.channels.set('tasks', channel);
    return channel;
  }

  subscribeToAutomations(callbacks: {
    onInsert?: ChangeCallback;
    onUpdate?: ChangeCallback;
    onDelete?: ChangeCallback;
  }) {
    const channel = supabase
      .channel('automations-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'automations' }, (payload) => {
        callbacks.onInsert?.(payload);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'automations' }, (payload) => {
        callbacks.onUpdate?.(payload);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'automations' }, (payload) => {
        callbacks.onDelete?.(payload);
      })
      .subscribe();

    this.channels.set('automations', channel);
    return channel;
  }

  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  unsubscribeAll() {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

export const realtimeSubscriptions = new RealtimeSubscriptions();
