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
      objects: {
        Row: {
          id: string
          object_type: string
          name: string
          description: string | null
          status: string | null
          confidence_score: number | null
          epistemic_state: Json | null
          owner_id: string | null
          tags: string[] | null
          metadata: Json | null
          domain: string | null
          is_archived: boolean | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          object_type: string
          name: string
          description?: string | null
          status?: string | null
          confidence_score?: number | null
          epistemic_state?: Json | null
          owner_id?: string | null
          tags?: string[] | null
          metadata?: Json | null
          domain?: string | null
          is_archived?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          object_type?: string
          name?: string
          description?: string | null
          status?: string | null
          confidence_score?: number | null
          epistemic_state?: Json | null
          owner_id?: string | null
          tags?: string[] | null
          metadata?: Json | null
          domain?: string | null
          is_archived?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
      }
      relationships: {
        Row: {
          id: string
          source_object_id: string
          target_object_id: string
          relationship_type: string
          strength: number | null
          confidence: number | null
          is_directed: boolean | null
          description: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          source_object_id: string
          target_object_id: string
          relationship_type: string
          strength?: number | null
          confidence?: number | null
          is_directed?: boolean | null
          description?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          source_object_id?: string
          target_object_id?: string
          relationship_type?: string
          strength?: number | null
          confidence?: number | null
          is_directed?: boolean | null
          description?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      sources: {
        Row: {
          id: string
          object_id: string | null
          source_type: string | null
          title: string | null
          authors: string[] | null
          publication: string | null
          url: string | null
          doi: string | null
          publication_date: string | null
          reliability_score: number | null
          peer_reviewed: boolean | null
          retracted: boolean | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          object_id?: string | null
          source_type?: string | null
          title?: string | null
          authors?: string[] | null
          publication?: string | null
          url?: string | null
          doi?: string | null
          publication_date?: string | null
          reliability_score?: number | null
          peer_reviewed?: boolean | null
          retracted?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          object_id?: string | null
          source_type?: string | null
          title?: string | null
          authors?: string[] | null
          publication?: string | null
          url?: string | null
          doi?: string | null
          publication_date?: string | null
          reliability_score?: number | null
          peer_reviewed?: boolean | null
          retracted?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      provenance_events: {
        Row: {
          id: string
          object_id: string | null
          event_type: string | null
          actor_id: string | null
          actor_type: string | null
          actor_name: string | null
          summary: string | null
          detail: Json | null
          source_system: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          object_id?: string | null
          event_type?: string | null
          actor_id?: string | null
          actor_type?: string | null
          actor_name?: string | null
          summary?: string | null
          detail?: Json | null
          source_system?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          object_id?: string | null
          event_type?: string | null
          actor_id?: string | null
          actor_type?: string | null
          actor_name?: string | null
          summary?: string | null
          detail?: Json | null
          source_system?: string | null
          created_at?: string | null
        }
      }
      claims: {
        Row: {
          id: string
          object_id: string | null
          claim_text: string
          claim_type: string | null
          status: string | null
          confidence_score: number | null
          evidence_count: number | null
          source_count: number | null
          supporting_evidence_count: number | null
          contradicting_evidence_count: number | null
          last_reviewed_at: string | null
          review_due_at: string | null
          domain: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          object_id?: string | null
          claim_text: string
          claim_type?: string | null
          status?: string | null
          confidence_score?: number | null
          evidence_count?: number | null
          source_count?: number | null
          supporting_evidence_count?: number | null
          contradicting_evidence_count?: number | null
          last_reviewed_at?: string | null
          review_due_at?: string | null
          domain?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          object_id?: string | null
          claim_text?: string
          claim_type?: string | null
          status?: string | null
          confidence_score?: number | null
          evidence_count?: number | null
          source_count?: number | null
          supporting_evidence_count?: number | null
          contradicting_evidence_count?: number | null
          last_reviewed_at?: string | null
          review_due_at?: string | null
          domain?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      evidence: {
        Row: {
          id: string
          claim_id: string | null
          source_id: string | null
          object_id: string | null
          evidence_type: string | null
          summary: string | null
          content: string | null
          excerpt: string | null
          supports_claim: boolean | null
          quality_scores: Json | null
          quality_score: number | null
          data_collection_date: string | null
          collected_at: string | null
          last_verified_at: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          claim_id?: string | null
          source_id?: string | null
          object_id?: string | null
          evidence_type?: string | null
          summary?: string | null
          content?: string | null
          excerpt?: string | null
          supports_claim?: boolean | null
          quality_scores?: Json | null
          quality_score?: number | null
          data_collection_date?: string | null
          collected_at?: string | null
          last_verified_at?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          claim_id?: string | null
          source_id?: string | null
          object_id?: string | null
          evidence_type?: string | null
          summary?: string | null
          content?: string | null
          excerpt?: string | null
          supports_claim?: boolean | null
          quality_scores?: Json | null
          quality_score?: number | null
          data_collection_date?: string | null
          collected_at?: string | null
          last_verified_at?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      assumptions: {
        Row: {
          id: string
          object_id: string | null
          assumption_text: string
          status: string | null
          importance: number | null
          risk_if_false: number | null
          confidence_gap: number | null
          dependency_count: number | null
          time_since_review: number | null
          assumption_risk_score: number | null
          current_confidence: number | null
          last_reviewed_at: string | null
          review_due_at: string | null
          category: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          object_id?: string | null
          assumption_text: string
          status?: string | null
          importance?: number | null
          risk_if_false?: number | null
          confidence_gap?: number | null
          dependency_count?: number | null
          time_since_review?: number | null
          assumption_risk_score?: number | null
          current_confidence?: number | null
          last_reviewed_at?: string | null
          review_due_at?: string | null
          category?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          object_id?: string | null
          assumption_text?: string
          status?: string | null
          importance?: number | null
          risk_if_false?: number | null
          confidence_gap?: number | null
          dependency_count?: number | null
          time_since_review?: number | null
          assumption_risk_score?: number | null
          current_confidence?: number | null
          last_reviewed_at?: string | null
          review_due_at?: string | null
          category?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      unknowns: {
        Row: {
          id: string
          object_id: string | null
          unknown_text: string
          description: string | null
          status: string | null
          category: string | null
          impact_if_resolved: number | null
          probability_changes_decision: number | null
          decision_value: number | null
          cost_to_resolve: number | null
          cost_of_delay: number | null
          evi_score: number | null
          investigation_notes: string | null
          resolved_at: string | null
          resolution_notes: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          object_id?: string | null
          unknown_text: string
          description?: string | null
          status?: string | null
          category?: string | null
          impact_if_resolved?: number | null
          probability_changes_decision?: number | null
          decision_value?: number | null
          cost_to_resolve?: number | null
          cost_of_delay?: number | null
          evi_score?: number | null
          investigation_notes?: string | null
          resolved_at?: string | null
          resolution_notes?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          object_id?: string | null
          unknown_text?: string
          description?: string | null
          status?: string | null
          category?: string | null
          impact_if_resolved?: number | null
          probability_changes_decision?: number | null
          decision_value?: number | null
          cost_to_resolve?: number | null
          cost_of_delay?: number | null
          evi_score?: number | null
          investigation_notes?: string | null
          resolved_at?: string | null
          resolution_notes?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      contradictions: {
        Row: {
          id: string
          claim_a_id: string | null
          claim_b_id: string | null
          object_id: string | null
          severity: string | null
          status: string | null
          description: string | null
          resolved_at: string | null
          resolution_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          claim_a_id?: string | null
          claim_b_id?: string | null
          object_id?: string | null
          severity?: string | null
          status?: string | null
          description?: string | null
          resolved_at?: string | null
          resolution_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          claim_a_id?: string | null
          claim_b_id?: string | null
          object_id?: string | null
          severity?: string | null
          status?: string | null
          description?: string | null
          resolved_at?: string | null
          resolution_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      decisions: {
        Row: {
          id: string
          object_id: string | null
          title: string
          description: string | null
          context: string | null
          status: string | null
          confidence_at_decision: number | null
          selected_alternative_id: string | null
          decision_rationale: string | null
          made_by: string | null
          made_at: string | null
          expected_outcome: string | null
          success_criteria: string | null
          outcome_due_date: string | null
          actual_outcome: string | null
          accuracy_score: number | null
          calibration_delta: number | null
          lessons_learned: string | null
          reviewed_at: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          object_id?: string | null
          title: string
          description?: string | null
          context?: string | null
          status?: string | null
          confidence_at_decision?: number | null
          selected_alternative_id?: string | null
          decision_rationale?: string | null
          made_by?: string | null
          made_at?: string | null
          expected_outcome?: string | null
          success_criteria?: string | null
          outcome_due_date?: string | null
          actual_outcome?: string | null
          accuracy_score?: number | null
          calibration_delta?: number | null
          lessons_learned?: string | null
          reviewed_at?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          object_id?: string | null
          title?: string
          description?: string | null
          context?: string | null
          status?: string | null
          confidence_at_decision?: number | null
          selected_alternative_id?: string | null
          decision_rationale?: string | null
          made_by?: string | null
          made_at?: string | null
          expected_outcome?: string | null
          success_criteria?: string | null
          outcome_due_date?: string | null
          actual_outcome?: string | null
          accuracy_score?: number | null
          calibration_delta?: number | null
          lessons_learned?: string | null
          reviewed_at?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      alternatives: {
        Row: {
          id: string
          decision_id: string | null
          title: string
          description: string | null
          expected_value: number | null
          probability_of_success: number | null
          was_selected: boolean | null
          rejection_reason: string | null
          outcome_score: number | null
          outcome_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          decision_id?: string | null
          title: string
          description?: string | null
          expected_value?: number | null
          probability_of_success?: number | null
          was_selected?: boolean | null
          rejection_reason?: string | null
          outcome_score?: number | null
          outcome_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          decision_id?: string | null
          title?: string
          description?: string | null
          expected_value?: number | null
          probability_of_success?: number | null
          was_selected?: boolean | null
          rejection_reason?: string | null
          outcome_score?: number | null
          outcome_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      outcome_reviews: {
        Row: {
          id: string
          decision_id: string | null
          expected_outcome: string | null
          actual_outcome: string | null
          accuracy_score: number | null
          confidence_at_decision: number | null
          calibration_delta: number | null
          lessons_learned: string | null
          reviewer_id: string | null
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          decision_id?: string | null
          expected_outcome?: string | null
          actual_outcome?: string | null
          accuracy_score?: number | null
          confidence_at_decision?: number | null
          calibration_delta?: number | null
          lessons_learned?: string | null
          reviewer_id?: string | null
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          decision_id?: string | null
          expected_outcome?: string | null
          actual_outcome?: string | null
          accuracy_score?: number | null
          confidence_at_decision?: number | null
          calibration_delta?: number | null
          lessons_learned?: string | null
          reviewer_id?: string | null
          reviewed_at?: string | null
        }
      }
      risks: {
        Row: {
          id: string
          object_id: string | null
          title: string
          description: string | null
          category: string | null
          likelihood: number | null
          impact: number | null
          risk_score: number | null
          risk_level: string | null
          mitigation_status: string | null
          mitigation_plan: string | null
          mitigation_owner_id: string | null
          owner_id: string | null
          last_reviewed_at: string | null
          is_active: boolean | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          object_id?: string | null
          title: string
          description?: string | null
          category?: string | null
          likelihood?: number | null
          impact?: number | null
          risk_score?: number | null
          risk_level?: string | null
          mitigation_status?: string | null
          mitigation_plan?: string | null
          mitigation_owner_id?: string | null
          owner_id?: string | null
          last_reviewed_at?: string | null
          is_active?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          object_id?: string | null
          title?: string
          description?: string | null
          category?: string | null
          likelihood?: number | null
          impact?: number | null
          risk_score?: number | null
          risk_level?: string | null
          mitigation_status?: string | null
          mitigation_plan?: string | null
          mitigation_owner_id?: string | null
          owner_id?: string | null
          last_reviewed_at?: string | null
          is_active?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          object_id: string | null
          name: string
          description: string | null
          status: string | null
          project_type: string | null
          owner_id: string | null
          start_date: string | null
          target_end_date: string | null
          actual_end_date: string | null
          task_count: number | null
          completed_task_count: number | null
          blocked_task_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          object_id?: string | null
          name: string
          description?: string | null
          status?: string | null
          project_type?: string | null
          owner_id?: string | null
          start_date?: string | null
          target_end_date?: string | null
          actual_end_date?: string | null
          task_count?: number | null
          completed_task_count?: number | null
          blocked_task_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          object_id?: string | null
          name?: string
          description?: string | null
          status?: string | null
          project_type?: string | null
          owner_id?: string | null
          start_date?: string | null
          target_end_date?: string | null
          actual_end_date?: string | null
          task_count?: number | null
          completed_task_count?: number | null
          blocked_task_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      tasks: {
        Row: {
          id: string
          object_id: string | null
          project_id: string | null
          parent_task_id: string | null
          title: string
          description: string | null
          status: string | null
          priority: string | null
          assigned_to: string | null
          due_date: string | null
          started_at: string | null
          completed_at: string | null
          blocked_reason: string | null
          strategic_importance: number | null
          expected_value: number | null
          urgency: number | null
          confidence: number | null
          unblock_multiplier: number | null
          effort: number | null
          distraction_cost: number | null
          focus_score: number | null
          tags: string[] | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          object_id?: string | null
          project_id?: string | null
          parent_task_id?: string | null
          title: string
          description?: string | null
          status?: string | null
          priority?: string | null
          assigned_to?: string | null
          due_date?: string | null
          started_at?: string | null
          completed_at?: string | null
          blocked_reason?: string | null
          strategic_importance?: number | null
          expected_value?: number | null
          urgency?: number | null
          confidence?: number | null
          unblock_multiplier?: number | null
          effort?: number | null
          distraction_cost?: number | null
          focus_score?: number | null
          tags?: string[] | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          object_id?: string | null
          project_id?: string | null
          parent_task_id?: string | null
          title?: string
          description?: string | null
          status?: string | null
          priority?: string | null
          assigned_to?: string | null
          due_date?: string | null
          started_at?: string | null
          completed_at?: string | null
          blocked_reason?: string | null
          strategic_importance?: number | null
          expected_value?: number | null
          urgency?: number | null
          confidence?: number | null
          unblock_multiplier?: number | null
          effort?: number | null
          distraction_cost?: number | null
          focus_score?: number | null
          tags?: string[] | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      workflows: {
        Row: {
          id: string
          name: string
          description: string | null
          trigger_type: string | null
          trigger_config: Json | null
          steps: Json | null
          is_active: boolean | null
          run_count: number | null
          last_run_at: string | null
          last_run_status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          trigger_type?: string | null
          trigger_config?: Json | null
          steps?: Json | null
          is_active?: boolean | null
          run_count?: number | null
          last_run_at?: string | null
          last_run_status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          trigger_type?: string | null
          trigger_config?: Json | null
          steps?: Json | null
          is_active?: boolean | null
          run_count?: number | null
          last_run_at?: string | null
          last_run_status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      automations: {
        Row: {
          id: string
          workflow_id: string | null
          name: string
          status: string | null
          trigger_type: string | null
          action_type: string | null
          cron_expression: string | null
          next_run_at: string | null
          last_run_at: string | null
          last_run_status: string | null
          run_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          workflow_id?: string | null
          name: string
          status?: string | null
          trigger_type?: string | null
          action_type?: string | null
          cron_expression?: string | null
          next_run_at?: string | null
          last_run_at?: string | null
          last_run_status?: string | null
          run_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          workflow_id?: string | null
          name?: string
          status?: string | null
          trigger_type?: string | null
          action_type?: string | null
          cron_expression?: string | null
          next_run_at?: string | null
          last_run_at?: string | null
          last_run_status?: string | null
          run_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      agents: {
        Row: {
          id: string
          name: string
          agent_type: string | null
          status: string | null
          schedule: string | null
          next_run_at: string | null
          last_run_at: string | null
          last_run_status: string | null
          last_error: string | null
          total_runs: number | null
          is_system_agent: boolean | null
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          agent_type?: string | null
          status?: string | null
          schedule?: string | null
          next_run_at?: string | null
          last_run_at?: string | null
          last_run_status?: string | null
          last_error?: string | null
          total_runs?: number | null
          is_system_agent?: boolean | null
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          agent_type?: string | null
          status?: string | null
          schedule?: string | null
          next_run_at?: string | null
          last_run_at?: string | null
          last_run_status?: string | null
          last_error?: string | null
          total_runs?: number | null
          is_system_agent?: boolean | null
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      metrics: {
        Row: {
          id: string
          object_id: string | null
          metric_type: string | null
          metric_name: string | null
          dimension: string | null
          value: number | null
          unit: string | null
          value_label: string | null
          period_start: string | null
          period_end: string | null
          period_type: string | null
          recorded_at: string | null
          previous_value: number | null
          delta: number | null
          delta_percent: number | null
          trend: string | null
          computed_by: string | null
          threshold_green: number | null
          threshold_amber: number | null
          threshold_red: number | null
          current_status: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          object_id?: string | null
          metric_type?: string | null
          metric_name?: string | null
          dimension?: string | null
          value?: number | null
          unit?: string | null
          value_label?: string | null
          period_start?: string | null
          period_end?: string | null
          period_type?: string | null
          recorded_at?: string | null
          previous_value?: number | null
          delta?: number | null
          delta_percent?: number | null
          trend?: string | null
          computed_by?: string | null
          threshold_green?: number | null
          threshold_amber?: number | null
          threshold_red?: number | null
          current_status?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          object_id?: string | null
          metric_type?: string | null
          metric_name?: string | null
          dimension?: string | null
          value?: number | null
          unit?: string | null
          value_label?: string | null
          period_start?: string | null
          period_end?: string | null
          period_type?: string | null
          recorded_at?: string | null
          previous_value?: number | null
          delta?: number | null
          delta_percent?: number | null
          trend?: string | null
          computed_by?: string | null
          threshold_green?: number | null
          threshold_amber?: number | null
          threshold_red?: number | null
          current_status?: string | null
          notes?: string | null
          created_at?: string | null
        }
      }
      briefs: {
        Row: {
          id: string
          object_id: string | null
          brief_type: string | null
          brief_date: string | null
          title: string | null
          summary: string | null
          focus_items: Json | null
          org_health_snapshot: Json | null
          alert_summary: Json | null
          activity_summary: Json | null
          generated_by: string | null
          generated_at: string | null
          read_at: string | null
          is_valid: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          object_id?: string | null
          brief_type?: string | null
          brief_date?: string | null
          title?: string | null
          summary?: string | null
          focus_items?: Json | null
          org_health_snapshot?: Json | null
          alert_summary?: Json | null
          activity_summary?: Json | null
          generated_by?: string | null
          generated_at?: string | null
          read_at?: string | null
          is_valid?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          object_id?: string | null
          brief_type?: string | null
          brief_date?: string | null
          title?: string | null
          summary?: string | null
          focus_items?: Json | null
          org_health_snapshot?: Json | null
          alert_summary?: Json | null
          activity_summary?: Json | null
          generated_by?: string | null
          generated_at?: string | null
          read_at?: string | null
          is_valid?: boolean | null
          created_at?: string | null
        }
      }
      reconciliation_events: {
        Row: {
          id: string
          object_id: string | null
          reconciliation_scope: string | null
          domain_filter: string | null
          initiated_by: string | null
          started_at: string | null
          completed_at: string | null
          objects_reviewed: number | null
          claims_verified: number | null
          contradictions_found: number | null
          status: string | null
          rai_before: number | null
          rai_after: number | null
          rai_delta: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          object_id?: string | null
          reconciliation_scope?: string | null
          domain_filter?: string | null
          initiated_by?: string | null
          started_at?: string | null
          completed_at?: string | null
          objects_reviewed?: number | null
          claims_verified?: number | null
          contradictions_found?: number | null
          status?: string | null
          rai_before?: number | null
          rai_after?: number | null
          rai_delta?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          object_id?: string | null
          reconciliation_scope?: string | null
          domain_filter?: string | null
          initiated_by?: string | null
          started_at?: string | null
          completed_at?: string | null
          objects_reviewed?: number | null
          claims_verified?: number | null
          contradictions_found?: number | null
          status?: string | null
          rai_before?: number | null
          rai_after?: number | null
          rai_delta?: number | null
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
