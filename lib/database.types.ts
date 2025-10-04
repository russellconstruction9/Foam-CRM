export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          name: string
          address: string
          email: string
          phone: string
          notes: string | null
          lat: number | null
          lng: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string
          email?: string
          phone?: string
          notes?: string | null
          lat?: number | null
          lng?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          email?: string
          phone?: string
          notes?: string | null
          lat?: number | null
          lng?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          name: string
          role: string
          pin: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          role?: string
          pin: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: string
          pin?: string
          created_at?: string
          updated_at?: string
        }
      }
      estimates: {
        Row: {
          id: string
          customer_id: string
          estimate_number: string
          estimate_pdf: ArrayBuffer | null
          material_order_pdf: ArrayBuffer | null
          invoice_pdf: ArrayBuffer | null
          calc_data: Json
          costs_data: Json
          scope_of_work: string
          status: 'estimate' | 'sold' | 'invoiced' | 'paid'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          estimate_number: string
          estimate_pdf?: ArrayBuffer | null
          material_order_pdf?: ArrayBuffer | null
          invoice_pdf?: ArrayBuffer | null
          calc_data?: Json
          costs_data?: Json
          scope_of_work?: string
          status?: 'estimate' | 'sold' | 'invoiced' | 'paid'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          estimate_number?: string
          estimate_pdf?: ArrayBuffer | null
          material_order_pdf?: ArrayBuffer | null
          invoice_pdf?: ArrayBuffer | null
          calc_data?: Json
          costs_data?: Json
          scope_of_work?: string
          status?: 'estimate' | 'sold' | 'invoiced' | 'paid'
          created_at?: string
          updated_at?: string
        }
      }
      time_log: {
        Row: {
          id: string
          employee_id: string
          job_id: string
          start_time: string
          end_time: string | null
          start_lat: number | null
          start_lng: number | null
          end_lat: number | null
          end_lng: number | null
          duration_hours: number | null
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          job_id: string
          start_time: string
          end_time?: string | null
          start_lat?: number | null
          start_lng?: number | null
          end_lat?: number | null
          end_lng?: number | null
          duration_hours?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          job_id?: string
          start_time?: string
          end_time?: string | null
          start_lat?: number | null
          start_lng?: number | null
          end_lat?: number | null
          end_lng?: number | null
          duration_hours?: number | null
          created_at?: string
        }
      }
      inventory: {
        Row: {
          id: string
          name: string
          category: string
          quantity: number
          unit_cost: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string
          quantity?: number
          unit_cost?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          quantity?: number
          unit_cost?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          due_date: string | null
          completed: boolean
          assigned_to: Json
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          due_date?: string | null
          completed?: boolean
          assigned_to?: Json
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          completed?: boolean
          assigned_to?: Json
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      drive_files: {
        Row: {
          id: string
          customer_id: string
          file_id: string
          file_name: string
          web_link: string
          icon_link: string
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          file_id: string
          file_name: string
          web_link: string
          icon_link: string
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          file_id?: string
          file_name?: string
          web_link?: string
          icon_link?: string
          created_at?: string
        }
      }
      automations: {
        Row: {
          id: string
          name: string
          trigger_type: 'new_customer' | 'job_status_updated'
          trigger_config: Json
          action_type: 'webhook' | 'create_task' | 'add_to_schedule' | 'send_email' | 'update_inventory' | 'sync_to_calendar'
          action_config: Json
          is_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          trigger_type: 'new_customer' | 'job_status_updated'
          trigger_config?: Json
          action_type: 'webhook' | 'create_task' | 'add_to_schedule' | 'send_email' | 'update_inventory' | 'sync_to_calendar'
          action_config?: Json
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          trigger_type?: 'new_customer' | 'job_status_updated'
          trigger_config?: Json
          action_type?: 'webhook' | 'create_task' | 'add_to_schedule' | 'send_email' | 'update_inventory' | 'sync_to_calendar'
          action_config?: Json
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
